import type { AppConfig, AppValidationResult, AppCategory, AppPermission } from './types'

/**
 * 应用配置验证器
 * 负责验证应用配置的完整性和有效性
 */
export class AppConfigValidator {
  private static readonly REQUIRED_FIELDS = ['key', 'title', 'icon']
  private static readonly VALID_CATEGORIES: AppCategory[] = [
    'system', 'utilities', 'productivity', 'entertainment', 'development',
    'education', 'business', 'graphics', 'multimedia', 'social', 'games',
    'demo', 'custom'
  ]
  private static readonly VALID_PERMISSIONS: AppPermission[] = [
    'camera', 'microphone', 'location', 'notifications', 'storage',
    'network', 'system', 'admin'
  ]

  /**
   * 验证应用配置
   */
  static validate(config: Partial<AppConfig>): AppValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // 检查必需字段
    this.validateRequiredFields(config, errors)

    // 检查字段类型和格式
    this.validateFieldTypes(config, errors, warnings)

    // 检查业务逻辑
    this.validateBusinessLogic(config, errors, warnings)

    // 检查安全性
    this.validateSecurity(config, errors, warnings)

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: this.calculateScore(config, errors, warnings)
    }
  }

  /**
   * 验证必需字段
   */
  private static validateRequiredFields(config: Partial<AppConfig>, errors: string[]): void {
    for (const field of this.REQUIRED_FIELDS) {
      if (!config[field as keyof AppConfig]) {
        errors.push(`Missing required field: ${field}`)
      }
    }
  }

  /**
   * 验证字段类型和格式
   */
  private static validateFieldTypes(config: Partial<AppConfig>, errors: string[], warnings: string[]): void {
    // 验证 key
    if (config.key) {
      if (typeof config.key !== 'string') {
        errors.push('Field "key" must be a string')
      } else if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(config.key)) {
        errors.push('Field "key" must start with a letter and contain only letters, numbers, underscores, and hyphens')
      } else if (config.key.length > 50) {
        errors.push('Field "key" must be 50 characters or less')
      }
    }

    // 验证 title
    if (config.title) {
      if (typeof config.title !== 'string') {
        errors.push('Field "title" must be a string')
      } else if (config.title.length > 100) {
        errors.push('Field "title" must be 100 characters or less')
      } else if (config.title.trim().length === 0) {
        errors.push('Field "title" cannot be empty')
      }
    }

    // 验证 icon
    if (config.icon) {
      if (typeof config.icon !== 'string') {
        errors.push('Field "icon" must be a string')
      } else if (config.icon.trim().length === 0) {
        errors.push('Field "icon" cannot be empty')
      }
    }

    // 验证 category
    if (config.category) {
      if (!this.VALID_CATEGORIES.includes(config.category)) {
        errors.push(`Invalid category: ${config.category}. Valid categories: ${this.VALID_CATEGORIES.join(', ')}`)
      }
    } else {
      warnings.push('No category specified, defaulting to "custom"')
    }

    // 验证 version
    if (config.version) {
      if (typeof config.version !== 'string') {
        errors.push('Field "version" must be a string')
      } else if (!/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/.test(config.version)) {
        warnings.push('Field "version" should follow semantic versioning (e.g., 1.0.0)')
      }
    }

    // 验证 author
    if (config.author) {
      if (typeof config.author !== 'string') {
        errors.push('Field "author" must be a string')
      } else if (config.author.length > 100) {
        warnings.push('Field "author" is quite long (>100 characters)')
      }
    }

    // 验证 description
    if (config.description) {
      if (typeof config.description !== 'string') {
        errors.push('Field "description" must be a string')
      } else if (config.description.length > 500) {
        warnings.push('Field "description" is quite long (>500 characters)')
      }
    }

    // 验证 permissions
    if (config.permissions) {
      if (!Array.isArray(config.permissions)) {
        errors.push('Field "permissions" must be an array')
      } else {
        const invalidPermissions = config.permissions.filter(
          permission => !this.VALID_PERMISSIONS.includes(permission)
        )
        if (invalidPermissions.length > 0) {
          errors.push(`Invalid permissions: ${invalidPermissions.join(', ')}. Valid permissions: ${this.VALID_PERMISSIONS.join(', ')}`)
        }
      }
    }

    // 验证 window 配置
    if (config.window) {
      this.validateWindowConfig(config.window, errors, warnings)
    }

    // 验证 theme 配置
    if (config.theme) {
      this.validateThemeConfig(config.theme, errors, warnings)
    }

    // 验证 menu 配置
    if (config.menu) {
      this.validateMenuConfig(config.menu, errors, warnings)
    }

    // 验证生命周期钩子
    if (config.lifecycle) {
      this.validateLifecycleHooks(config.lifecycle, errors, warnings)
    }
  }

  /**
   * 验证窗口配置
   */
  private static validateWindowConfig(window: any, errors: string[], warnings: string[]): void {
    if (typeof window !== 'object' || window === null) {
      errors.push('Field "window" must be an object')
      return
    }

    // 验证尺寸
    if (window.width !== undefined) {
      if (typeof window.width !== 'number' || window.width <= 0) {
        errors.push('Field "window.width" must be a positive number')
      } else if (window.width < 200) {
        warnings.push('Window width is quite small (<200px)')
      } else if (window.width > 2000) {
        warnings.push('Window width is quite large (>2000px)')
      }
    }

    if (window.height !== undefined) {
      if (typeof window.height !== 'number' || window.height <= 0) {
        errors.push('Field "window.height" must be a positive number')
      } else if (window.height < 150) {
        warnings.push('Window height is quite small (<150px)')
      } else if (window.height > 1500) {
        warnings.push('Window height is quite large (>1500px)')
      }
    }

    // 验证布尔属性
    const booleanProps = ['resizable', 'draggable', 'closable', 'minimizable', 'maximizable']
    for (const prop of booleanProps) {
      if (window[prop] !== undefined && typeof window[prop] !== 'boolean') {
        errors.push(`Field "window.${prop}" must be a boolean`)
      }
    }

    // 验证位置
    if (window.x !== undefined && (typeof window.x !== 'number' || window.x < 0)) {
      errors.push('Field "window.x" must be a non-negative number')
    }

    if (window.y !== undefined && (typeof window.y !== 'number' || window.y < 0)) {
      errors.push('Field "window.y" must be a non-negative number')
    }

    // 验证最小/最大尺寸
    if (window.minWidth !== undefined && (typeof window.minWidth !== 'number' || window.minWidth <= 0)) {
      errors.push('Field "window.minWidth" must be a positive number')
    }

    if (window.minHeight !== undefined && (typeof window.minHeight !== 'number' || window.minHeight <= 0)) {
      errors.push('Field "window.minHeight" must be a positive number')
    }

    if (window.maxWidth !== undefined && (typeof window.maxWidth !== 'number' || window.maxWidth <= 0)) {
      errors.push('Field "window.maxWidth" must be a positive number')
    }

    if (window.maxHeight !== undefined && (typeof window.maxHeight !== 'number' || window.maxHeight <= 0)) {
      errors.push('Field "window.maxHeight" must be a positive number')
    }

    // 验证尺寸逻辑
    if (window.width && window.minWidth && window.width < window.minWidth) {
      errors.push('Window width cannot be less than minWidth')
    }

    if (window.height && window.minHeight && window.height < window.minHeight) {
      errors.push('Window height cannot be less than minHeight')
    }

    if (window.width && window.maxWidth && window.width > window.maxWidth) {
      errors.push('Window width cannot be greater than maxWidth')
    }

    if (window.height && window.maxHeight && window.height > window.maxHeight) {
      errors.push('Window height cannot be greater than maxHeight')
    }
  }

  /**
   * 验证主题配置
   */
  private static validateThemeConfig(theme: any, errors: string[], warnings: string[]): void {
    if (typeof theme !== 'object' || theme === null) {
      errors.push('Field "theme" must be an object')
      return
    }

    // 验证颜色格式
    const colorProps = ['iconColor', 'iconBgColor', 'primaryColor', 'secondaryColor']
    for (const prop of colorProps) {
      if (theme[prop] !== undefined) {
        if (typeof theme[prop] !== 'string') {
          errors.push(`Field "theme.${prop}" must be a string`)
        } else if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(theme[prop])) {
          warnings.push(`Field "theme.${prop}" should be a valid hex color (e.g., #FF0000)`)
        }
      }
    }

    // 验证主题模式
    if (theme.mode !== undefined && !['light', 'dark', 'auto'].includes(theme.mode)) {
      errors.push('Field "theme.mode" must be one of: light, dark, auto')
    }
  }

  /**
   * 验证菜单配置
   */
  private static validateMenuConfig(menu: any, errors: string[], warnings: string[]): void {
    if (!Array.isArray(menu)) {
      errors.push('Field "menu" must be an array')
      return
    }

    menu.forEach((item: any, index: number) => {
      if (typeof item !== 'object' || item === null) {
        errors.push(`Menu item at index ${index} must be an object`)
        return
      }

      if (!item.label || typeof item.label !== 'string') {
        errors.push(`Menu item at index ${index} must have a string "label"`)
      }

      if (item.action && typeof item.action !== 'string') {
        errors.push(`Menu item at index ${index} "action" must be a string`)
      }

      if (item.shortcut && typeof item.shortcut !== 'string') {
        errors.push(`Menu item at index ${index} "shortcut" must be a string`)
      }

      if (item.disabled !== undefined && typeof item.disabled !== 'boolean') {
        errors.push(`Menu item at index ${index} "disabled" must be a boolean`)
      }

      if (item.submenu && !Array.isArray(item.submenu)) {
        errors.push(`Menu item at index ${index} "submenu" must be an array`)
      }
    })
  }

  /**
   * 验证生命周期钩子
   */
  private static validateLifecycleHooks(lifecycle: any, errors: string[], warnings: string[]): void {
    if (typeof lifecycle !== 'object' || lifecycle === null) {
      errors.push('Field "lifecycle" must be an object')
      return
    }

    const hookNames = ['onMount', 'onUnmount', 'onActivate', 'onDeactivate', 'onResize', 'onMove']
    for (const hookName of hookNames) {
      if (lifecycle[hookName] !== undefined && typeof lifecycle[hookName] !== 'function') {
        warnings.push(`Lifecycle hook "${hookName}" should be a function`)
      }
    }
  }

  /**
   * 验证业务逻辑
   */
  private static validateBusinessLogic(config: Partial<AppConfig>, errors: string[], warnings: string[]): void {
    // 检查系统应用的特殊要求
    if (config.category === 'system') {
      if (!config.permissions?.includes('system')) {
        warnings.push('System apps should typically have "system" permission')
      }

      if (config.window?.closable !== false) {
        warnings.push('System apps should typically not be closable')
      }
    }

    // 检查权限和功能的一致性
    if (config.permissions?.includes('camera') && !config.description?.toLowerCase().includes('camera')) {
      warnings.push('App requests camera permission but description doesn\'t mention camera functionality')
    }

    if (config.permissions?.includes('microphone') && !config.description?.toLowerCase().includes('microphone')) {
      warnings.push('App requests microphone permission but description doesn\'t mention microphone functionality')
    }

    // 检查组件路径
    if (config.componentPath && !config.componentPath.endsWith('.vue')) {
      warnings.push('Component path should typically end with ".vue"')
    }

    // 检查应用键的唯一性提示
    if (config.key && config.key.length < 3) {
      warnings.push('App key is quite short, consider using a more descriptive key')
    }
  }

  /**
   * 验证安全性
   */
  private static validateSecurity(config: Partial<AppConfig>, errors: string[], warnings: string[]): void {
    // 检查危险权限组合
    if (config.permissions) {
      const dangerousPermissions = ['admin', 'system']
      const hasDangerousPermissions = config.permissions.some(p => dangerousPermissions.includes(p))
      
      if (hasDangerousPermissions && config.category !== 'system') {
        warnings.push('Non-system apps with admin/system permissions require careful review')
      }

      // 检查权限过多
      if (config.permissions.length > 5) {
        warnings.push('App requests many permissions, consider if all are necessary')
      }
    }

    // 检查外部组件路径
    if (config.componentPath && (config.componentPath.startsWith('http') || config.componentPath.includes('../'))) {
      errors.push('Component path should not reference external URLs or use relative paths with "../"')
    }

    // 检查脚本注入风险
    const textFields = ['title', 'description', 'author']
    for (const field of textFields) {
      const value = config[field as keyof AppConfig] as string
      if (value && (value.includes('<script') || value.includes('javascript:'))) {
        errors.push(`Field "${field}" contains potentially dangerous content`)
      }
    }
  }

  /**
   * 计算配置质量分数
   */
  private static calculateScore(config: Partial<AppConfig>, errors: string[], warnings: string[]): number {
    let score = 100

    // 错误扣分
    score -= errors.length * 20

    // 警告扣分
    score -= warnings.length * 5

    // 完整性加分
    const optionalFields = ['version', 'author', 'description', 'window', 'theme', 'menu']
    const completedOptionalFields = optionalFields.filter(field => config[field as keyof AppConfig])
    score += completedOptionalFields.length * 2

    // 确保分数在 0-100 范围内
    return Math.max(0, Math.min(100, score))
  }

  /**
   * 快速验证（仅检查必需字段）
   */
  static quickValidate(config: Partial<AppConfig>): boolean {
    return this.REQUIRED_FIELDS.every(field => !!config[field as keyof AppConfig])
  }

  /**
   * 获取验证规则信息
   */
  static getValidationRules() {
    return {
      requiredFields: this.REQUIRED_FIELDS,
      validCategories: this.VALID_CATEGORIES,
      validPermissions: this.VALID_PERMISSIONS,
      keyPattern: /^[a-zA-Z][a-zA-Z0-9_-]*$/,
      versionPattern: /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/,
      colorPattern: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    }
  }
}
