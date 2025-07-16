import type { WindowState as IWindowState, WindowPosition, WindowSize, WindowSnapshot } from './types'

/**
 * 窗口状态管理器
 * 负责管理窗口的状态变更、历史记录和快照
 */
export class WindowState {
  private states = new Map<string, IWindowState>()
  private history = new Map<string, IWindowState[]>()
  private snapshots = new Map<string, WindowSnapshot[]>()
  private maxHistorySize: number
  private maxSnapshotSize: number

  constructor(config: { maxHistorySize?: number; maxSnapshotSize?: number } = {}) {
    this.maxHistorySize = config.maxHistorySize || 50
    this.maxSnapshotSize = config.maxSnapshotSize || 10
  }

  /**
   * 获取窗口状态
   */
  getState(windowId: string): IWindowState | undefined {
    return this.states.get(windowId)
  }

  /**
   * 设置窗口状态
   */
  setState(windowId: string, state: IWindowState): void {
    const currentState = this.states.get(windowId)
    
    // 保存历史记录
    if (currentState) {
      this.addToHistory(windowId, currentState)
    }

    // 更新状态
    this.states.set(windowId, { ...state })
  }

  /**
   * 更新窗口状态（部分更新）
   */
  updateState(windowId: string, updates: Partial<IWindowState>): void {
    const currentState = this.states.get(windowId)
    if (!currentState) {
      throw new Error(`Window ${windowId} not found`)
    }

    const newState = { ...currentState, ...updates }
    this.setState(windowId, newState)
  }

  /**
   * 删除窗口状态
   */
  removeState(windowId: string): void {
    this.states.delete(windowId)
    this.history.delete(windowId)
    this.snapshots.delete(windowId)
  }

  /**
   * 获取所有窗口状态
   */
  getAllStates(): Map<string, IWindowState> {
    return new Map(this.states)
  }

  /**
   * 获取窗口历史记录
   */
  getHistory(windowId: string): IWindowState[] {
    return this.history.get(windowId) || []
  }

  /**
   * 撤销到上一个状态
   */
  undo(windowId: string): IWindowState | null {
    const history = this.history.get(windowId)
    if (!history || history.length === 0) {
      return null
    }

    const previousState = history.pop()!
    this.states.set(windowId, previousState)
    return previousState
  }

  /**
   * 清空窗口历史记录
   */
  clearHistory(windowId: string): void {
    this.history.delete(windowId)
  }

  /**
   * 创建窗口快照
   */
  createSnapshot(windowId: string, name: string, description?: string): void {
    const state = this.states.get(windowId)
    if (!state) {
      throw new Error(`Window ${windowId} not found`)
    }

    const snapshot: WindowSnapshot = {
      id: `${windowId}_${Date.now()}`,
      windowId,
      name,
      description,
      state: { ...state },
      timestamp: Date.now()
    }

    let snapshots = this.snapshots.get(windowId) || []
    snapshots.push(snapshot)

    // 限制快照数量
    if (snapshots.length > this.maxSnapshotSize) {
      snapshots = snapshots.slice(-this.maxSnapshotSize)
    }

    this.snapshots.set(windowId, snapshots)
  }

  /**
   * 恢复到快照状态
   */
  restoreSnapshot(windowId: string, snapshotId: string): boolean {
    const snapshots = this.snapshots.get(windowId)
    if (!snapshots) {
      return false
    }

    const snapshot = snapshots.find(s => s.id === snapshotId)
    if (!snapshot) {
      return false
    }

    this.setState(windowId, snapshot.state)
    return true
  }

  /**
   * 获取窗口快照列表
   */
  getSnapshots(windowId: string): WindowSnapshot[] {
    return this.snapshots.get(windowId) || []
  }

  /**
   * 删除快照
   */
  deleteSnapshot(windowId: string, snapshotId: string): boolean {
    const snapshots = this.snapshots.get(windowId)
    if (!snapshots) {
      return false
    }

    const index = snapshots.findIndex(s => s.id === snapshotId)
    if (index === -1) {
      return false
    }

    snapshots.splice(index, 1)
    return true
  }

  /**
   * 清空窗口快照
   */
  clearSnapshots(windowId: string): void {
    this.snapshots.delete(windowId)
  }

  /**
   * 检查窗口是否存在
   */
  hasWindow(windowId: string): boolean {
    return this.states.has(windowId)
  }

  /**
   * 获取窗口数量
   */
  getWindowCount(): number {
    return this.states.size
  }

  /**
   * 获取指定状态的窗口列表
   */
  getWindowsByState(state: IWindowState['state']): string[] {
    const windowIds: string[] = []
    
    for (const [windowId, windowState] of this.states) {
      if (windowState.state === state) {
        windowIds.push(windowId)
      }
    }
    
    return windowIds
  }

  /**
   * 获取可见窗口列表
   */
  getVisibleWindows(): string[] {
    const visibleWindows: string[] = []
    
    for (const [windowId, state] of this.states) {
      if (state.visible && state.state !== 'minimized') {
        visibleWindows.push(windowId)
      }
    }
    
    return visibleWindows
  }

  /**
   * 获取最小化的窗口列表
   */
  getMinimizedWindows(): string[] {
    return this.getWindowsByState('minimized')
  }

  /**
   * 获取最大化的窗口列表
   */
  getMaximizedWindows(): string[] {
    return this.getWindowsByState('maximized')
  }

  /**
   * 获取活动窗口
   */
  getActiveWindow(): string | null {
    for (const [windowId, state] of this.states) {
      if (state.active) {
        return windowId
      }
    }
    return null
  }

  /**
   * 设置活动窗口
   */
  setActiveWindow(windowId: string): void {
    // 取消所有窗口的活动状态
    for (const [id, state] of this.states) {
      if (state.active) {
        this.updateState(id, { active: false })
      }
    }

    // 设置新的活动窗口
    if (this.states.has(windowId)) {
      this.updateState(windowId, { active: true })
    }
  }

  /**
   * 获取窗口位置
   */
  getPosition(windowId: string): WindowPosition | null {
    const state = this.states.get(windowId)
    return state ? state.position : null
  }

  /**
   * 设置窗口位置
   */
  setPosition(windowId: string, position: WindowPosition): void {
    this.updateState(windowId, { position })
  }

  /**
   * 获取窗口大小
   */
  getSize(windowId: string): WindowSize | null {
    const state = this.states.get(windowId)
    return state ? state.size : null
  }

  /**
   * 设置窗口大小
   */
  setSize(windowId: string, size: WindowSize): void {
    this.updateState(windowId, { size })
  }

  /**
   * 获取窗口层级
   */
  getZIndex(windowId: string): number | null {
    const state = this.states.get(windowId)
    return state ? state.zIndex : null
  }

  /**
   * 设置窗口层级
   */
  setZIndex(windowId: string, zIndex: number): void {
    this.updateState(windowId, { zIndex })
  }

  /**
   * 获取最高层级
   */
  getMaxZIndex(): number {
    let maxZIndex = 0
    for (const state of this.states.values()) {
      if (state.zIndex > maxZIndex) {
        maxZIndex = state.zIndex
      }
    }
    return maxZIndex
  }

  /**
   * 将窗口置于顶层
   */
  bringToFront(windowId: string): void {
    const maxZIndex = this.getMaxZIndex()
    this.setZIndex(windowId, maxZIndex + 1)
  }

  /**
   * 将窗口置于底层
   */
  sendToBack(windowId: string): void {
    this.setZIndex(windowId, 0)
    
    // 重新排列其他窗口的层级
    const windows = Array.from(this.states.entries())
      .filter(([id]) => id !== windowId)
      .sort(([, a], [, b]) => a.zIndex - b.zIndex)
    
    windows.forEach(([id], index) => {
      this.setZIndex(id, index + 1)
    })
  }

  /**
   * 检查窗口是否可见
   */
  isVisible(windowId: string): boolean {
    const state = this.states.get(windowId)
    return state ? state.visible : false
  }

  /**
   * 设置窗口可见性
   */
  setVisible(windowId: string, visible: boolean): void {
    this.updateState(windowId, { visible })
  }

  /**
   * 检查窗口是否处于全屏状态
   */
  isFullscreen(windowId: string): boolean {
    const state = this.states.get(windowId)
    return state ? state.fullscreen : false
  }

  /**
   * 设置窗口全屏状态
   */
  setFullscreen(windowId: string, fullscreen: boolean): void {
    this.updateState(windowId, { fullscreen })
  }

  /**
   * 获取状态统计信息
   */
  getStats(): {
    total: number
    visible: number
    minimized: number
    maximized: number
    fullscreen: number
    active: number
  } {
    let visible = 0
    let minimized = 0
    let maximized = 0
    let fullscreen = 0
    let active = 0

    for (const state of this.states.values()) {
      if (state.visible) visible++
      if (state.state === 'minimized') minimized++
      if (state.state === 'maximized') maximized++
      if (state.fullscreen) fullscreen++
      if (state.active) active++
    }

    return {
      total: this.states.size,
      visible,
      minimized,
      maximized,
      fullscreen,
      active
    }
  }

  /**
   * 清空所有状态
   */
  clear(): void {
    this.states.clear()
    this.history.clear()
    this.snapshots.clear()
  }

  /**
   * 导出状态数据
   */
  export(): {
    states: Record<string, IWindowState>
    snapshots: Record<string, WindowSnapshot[]>
  } {
    const states: Record<string, IWindowState> = {}
    const snapshots: Record<string, WindowSnapshot[]> = {}

    for (const [windowId, state] of this.states) {
      states[windowId] = { ...state }
    }

    for (const [windowId, snapshotList] of this.snapshots) {
      snapshots[windowId] = snapshotList.map(s => ({ ...s }))
    }

    return { states, snapshots }
  }

  /**
   * 导入状态数据
   */
  import(data: {
    states: Record<string, IWindowState>
    snapshots?: Record<string, WindowSnapshot[]>
  }): void {
    // 导入状态
    for (const [windowId, state] of Object.entries(data.states)) {
      this.states.set(windowId, { ...state })
    }

    // 导入快照
    if (data.snapshots) {
      for (const [windowId, snapshotList] of Object.entries(data.snapshots)) {
        this.snapshots.set(windowId, snapshotList.map(s => ({ ...s })))
      }
    }
  }

  // 私有方法

  private addToHistory(windowId: string, state: IWindowState): void {
    let history = this.history.get(windowId) || []
    history.push({ ...state })

    // 限制历史记录数量
    if (history.length > this.maxHistorySize) {
      history = history.slice(-this.maxHistorySize)
    }

    this.history.set(windowId, history)
  }
}

// 导出单例实例
export const windowState = new WindowState()