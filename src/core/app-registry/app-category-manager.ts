import type { AppConfig, AppCategory } from './types'

/**
 * 应用分类管理器
 * 负责管理应用分类、分组和过滤功能
 */
export class AppCategoryManager {
  private static readonly CATEGORY_METADATA = {
    system: {
      name: '系统',
      icon: '⚙️',
      description: '系统核心应用和工具',
      color: '#007AFF',
      priority: 1,
      defaultPermissions: ['system']
    },
    utilities: {
      name: '实用工具',
      icon: '🔧',
      description: '日常使用的实用工具',
      color: '#34C759',
      priority: 2,
      defaultPermissions: []
    },
    productivity: {
      name: '效率工具',
      icon: '📊',
      description: '提高工作效率的应用',
      color: '#FF9500',
      priority: 3,
      defaultPermissions: ['storage']
    },
    development: {
      name: '开发工具',
      icon: '💻',
      description: '软件开发相关工具',
      color: '#5856D6',
      priority: 4,
      defaultPermissions: ['storage', 'network']
    },
    entertainment: {
      name: '娱乐',
      icon: '🎮',
      description: '娱乐和休闲应用',
      color: '#FF2D92',
      priority: 5,
      defaultPermissions: ['multimedia']
    },
    education: {
      name: '教育',
      icon: '📚',
      description: '学习和教育相关应用',
      color: '#30B0C7',
      priority: 6,
      defaultPermissions: []
    },
    business: {
      name: '商务',
      icon: '💼',
      description: '商务和办公应用',
      color: '#8E8E93',
      priority: 7,
      defaultPermissions: ['storage', 'network']
    },
    graphics: {
      name: '图形设计',
      icon: '🎨',
      description: '图形设计和创意工具',
      color: '#FF3B30',
      priority: 8,
      defaultPermissions: ['storage']
    },
    multimedia: {
      name: '多媒体',
      icon: '🎵',
      description: '音频、视频处理工具',
      color: '#AF52DE',
      priority: 9,
      defaultPermissions: ['multimedia', 'storage']
    },
    social: {
      name: '社交',
      icon: '💬',
      description: '社交和通讯应用',
      color: '#007AFF',
      priority: 10,
      defaultPermissions: ['network', 'notifications']
    },
    games: {
      name: '游戏',
      icon: '🎯',
      description: '游戏和娱乐应用',
      color: '#FF9500',
      priority: 11,
      defaultPermissions: []
    },
    demo: {
      name: '演示',
      icon: '🧪',
      description: '演示和测试应用',
      color: '#8E8E93',
      priority: 12,
      defaultPermissions: []
    },
    custom: {
      name: '自定义',
      icon: '📱',
      description: '用户自定义应用',
      color: '#8E8E93',
      priority: 13,
      defaultPermissions: []
    }
  }

  /**
   * 获取所有分类
   */
  static getAllCategories(): AppCategory[] {
    return Object.keys(this.CATEGORY_METADATA) as AppCategory[]
  }

  /**
   * 获取分类元数据
   */
  static getCategoryMetadata(category: AppCategory) {
    return this.CATEGORY_METADATA[category] || this.CATEGORY_METADATA.custom
  }

  /**
   * 获取所有分类的元数据
   */
  static getAllCategoryMetadata() {
    return { ...this.CATEGORY_METADATA }
  }

  /**
   * 按分类分组应用
   */
  static groupAppsByCategory(apps: AppConfig[]): Record<AppCategory, AppConfig[]> {
    const grouped = {} as Record<AppCategory, AppConfig[]>
    
    // 初始化所有分类
    this.getAllCategories().forEach(category => {
      grouped[category] = []
    })
    
    // 分组应用
    apps.forEach(app => {
      const category = app.category || 'custom'
      if (grouped[category]) {
        grouped[category].push(app)
      } else {
        grouped.custom.push(app)
      }
    })
    
    return grouped
  }

  /**
   * 按分类分组应用（仅包含非空分类）
   */
  static groupAppsByCategoryNonEmpty(apps: AppConfig[]): Record<AppCategory, AppConfig[]> {
    const allGrouped = this.groupAppsByCategory(apps)
    const nonEmptyGrouped = {} as Record<AppCategory, AppConfig[]>
    
    Object.entries(allGrouped).forEach(([category, categoryApps]) => {
      if (categoryApps.length > 0) {
        nonEmptyGrouped[category as AppCategory] = categoryApps
      }
    })
    
    return nonEmptyGrouped
  }

  /**
   * 获取分类中的应用
   */
  static getAppsByCategory(apps: AppConfig[], category: AppCategory): AppConfig[] {
    return apps.filter(app => (app.category || 'custom') === category)
  }

  /**
   * 按优先级排序分类
   */
  static sortCategoriesByPriority(categories: AppCategory[]): AppCategory[] {
    return categories.sort((a, b) => {
      const priorityA = this.CATEGORY_METADATA[a]?.priority || 999
      const priorityB = this.CATEGORY_METADATA[b]?.priority || 999
      return priorityA - priorityB
    })
  }

  /**
   * 获取分类统计信息
   */
  static getCategoryStats(apps: AppConfig[]) {
    const grouped = this.groupAppsByCategory(apps)
    const stats = {} as Record<AppCategory, {
      count: number
      percentage: number
      metadata: typeof this.CATEGORY_METADATA[AppCategory]
    }>
    
    const totalApps = apps.length
    
    Object.entries(grouped).forEach(([category, categoryApps]) => {
      const cat = category as AppCategory
      stats[cat] = {
        count: categoryApps.length,
        percentage: totalApps > 0 ? (categoryApps.length / totalApps) * 100 : 0,
        metadata: this.getCategoryMetadata(cat)
      }
    })
    
    return stats
  }

  /**
   * 搜索分类
   */
  static searchCategories(query: string): AppCategory[] {
    const lowerQuery = query.toLowerCase()
    
    return this.getAllCategories().filter(category => {
      const metadata = this.getCategoryMetadata(category)
      return (
        category.toLowerCase().includes(lowerQuery) ||
        metadata.name.toLowerCase().includes(lowerQuery) ||
        metadata.description.toLowerCase().includes(lowerQuery)
      )
    })
  }

  /**
   * 推荐分类（基于应用特征）
   */
  static recommendCategory(app: Partial<AppConfig>): AppCategory {
    const { title = '', description = '', permissions = [] } = app
    const text = `${title} ${description}`.toLowerCase()
    
    // 基于关键词推荐
    const keywordMap: Record<string, AppCategory> = {
      // 系统相关
      'system': 'system',
      'setting': 'system',
      'config': 'system',
      'preference': 'system',
      'control': 'system',
      
      // 开发工具
      'code': 'development',
      'editor': 'development',
      'ide': 'development',
      'debug': 'development',
      'git': 'development',
      'terminal': 'development',
      'compiler': 'development',
      
      // 实用工具
      'calculator': 'utilities',
      'calendar': 'utilities',
      'clock': 'utilities',
      'timer': 'utilities',
      'converter': 'utilities',
      'utility': 'utilities',
      
      // 效率工具
      'productivity': 'productivity',
      'office': 'productivity',
      'document': 'productivity',
      'spreadsheet': 'productivity',
      'presentation': 'productivity',
      'note': 'productivity',
      'task': 'productivity',
      'todo': 'productivity',
      
      // 娱乐
      'game': 'games',
      'play': 'games',
      'fun': 'entertainment',
      'entertainment': 'entertainment',
      'movie': 'entertainment',
      'video': 'multimedia',
      
      // 多媒体
      'audio': 'multimedia',
      'music': 'multimedia',
      'sound': 'multimedia',
      'media': 'multimedia',
      'player': 'multimedia',
      
      // 图形设计
      'design': 'graphics',
      'draw': 'graphics',
      'paint': 'graphics',
      'image': 'graphics',
      'photo': 'graphics',
      'graphic': 'graphics',
      
      // 社交
      'chat': 'social',
      'message': 'social',
      'social': 'social',
      'communication': 'social',
      
      // 教育
      'learn': 'education',
      'education': 'education',
      'study': 'education',
      'tutorial': 'education',
      'course': 'education',
      
      // 商务
      'business': 'business',
      'finance': 'business',
      'money': 'business',
      'invoice': 'business',
      'crm': 'business',
      
      // 演示
      'demo': 'demo',
      'example': 'demo',
      'sample': 'demo',
      'test': 'demo'
    }
    
    // 检查关键词匹配
    for (const [keyword, category] of Object.entries(keywordMap)) {
      if (text.includes(keyword)) {
        return category
      }
    }
    
    // 基于权限推荐
    if (permissions.includes('system') || permissions.includes('admin')) {
      return 'system'
    }
    
    if (permissions.includes('camera') || permissions.includes('microphone')) {
      return 'multimedia'
    }
    
    if (permissions.includes('location')) {
      return 'utilities'
    }
    
    // 默认分类
    return 'custom'
  }

  /**
   * 验证分类
   */
  static isValidCategory(category: string): category is AppCategory {
    return category in this.CATEGORY_METADATA
  }

  /**
   * 获取分类的默认权限
   */
  static getDefaultPermissions(category: AppCategory): string[] {
    return [...(this.CATEGORY_METADATA[category]?.defaultPermissions || [])]
  }

  /**
   * 获取分类颜色
   */
  static getCategoryColor(category: AppCategory): string {
    return this.CATEGORY_METADATA[category]?.color || '#8E8E93'
  }

  /**
   * 获取分类图标
   */
  static getCategoryIcon(category: AppCategory): string {
    return this.CATEGORY_METADATA[category]?.icon || '📱'
  }

  /**
   * 获取分类名称
   */
  static getCategoryName(category: AppCategory): string {
    return this.CATEGORY_METADATA[category]?.name || '未知分类'
  }

  /**
   * 获取分类描述
   */
  static getCategoryDescription(category: AppCategory): string {
    return this.CATEGORY_METADATA[category]?.description || ''
  }

  /**
   * 创建分类过滤器
   */
  static createCategoryFilter(categories: AppCategory[]) {
    return (app: AppConfig) => {
      const appCategory = app.category || 'custom'
      return categories.includes(appCategory)
    }
  }

  /**
   * 创建分类排序器
   */
  static createCategorySorter(order: 'asc' | 'desc' = 'asc') {
    return (a: AppConfig, b: AppConfig) => {
      const categoryA = a.category || 'custom'
      const categoryB = b.category || 'custom'
      const priorityA = this.CATEGORY_METADATA[categoryA]?.priority || 999
      const priorityB = this.CATEGORY_METADATA[categoryB]?.priority || 999
      
      if (order === 'asc') {
        return priorityA - priorityB
      } else {
        return priorityB - priorityA
      }
    }
  }

  /**
   * 获取热门分类（基于应用数量）
   */
  static getPopularCategories(apps: AppConfig[], limit = 5): AppCategory[] {
    const stats = this.getCategoryStats(apps)
    
    return Object.entries(stats)
      .filter(([, stat]) => stat.count > 0)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, limit)
      .map(([category]) => category as AppCategory)
  }

  /**
   * 获取空分类
   */
  static getEmptyCategories(apps: AppConfig[]): AppCategory[] {
    const grouped = this.groupAppsByCategory(apps)
    
    return Object.entries(grouped)
      .filter(([, categoryApps]) => categoryApps.length === 0)
      .map(([category]) => category as AppCategory)
  }

  /**
   * 合并分类统计
   */
  static mergeCategoryStats(...statsArray: ReturnType<typeof this.getCategoryStats>[]) {
    const merged = {} as ReturnType<typeof this.getCategoryStats>
    
    this.getAllCategories().forEach(category => {
      merged[category] = {
        count: 0,
        percentage: 0,
        metadata: this.getCategoryMetadata(category)
      }
    })
    
    statsArray.forEach(stats => {
      Object.entries(stats).forEach(([category, stat]) => {
        const cat = category as AppCategory
        if (merged[cat]) {
          merged[cat].count += stat.count
        }
      })
    })
    
    // 重新计算百分比
    const totalCount = Object.values(merged).reduce((sum, stat) => sum + stat.count, 0)
    Object.values(merged).forEach(stat => {
      stat.percentage = totalCount > 0 ? (stat.count / totalCount) * 100 : 0
    })
    
    return merged
  }
}