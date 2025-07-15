<template>
  <div class="app-store">
    <!-- 顶部导航栏 -->
    <div class="store-header">
      <div class="header-nav">
        <button 
          v-for="tab in tabs" 
          :key="tab.key"
          :class="['nav-tab', { active: activeTab === tab.key }]"
          @click="activeTab = tab.key"
        >
          <i :class="tab.icon"></i>
          {{ tab.label }}
        </button>
      </div>
      
      <div class="header-search">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="搜索应用..."
            @keyup.enter="handleSearch"
          >
          <button v-if="searchQuery" @click="clearSearch" class="clear-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="store-content">
      <!-- 发现页面 -->
      <div v-if="activeTab === 'discover'" class="discover-page">
        <!-- 轮播图 -->
        <div class="featured-carousel">
          <div class="carousel-container">
            <div 
              v-for="(app, index) in featuredApps" 
              :key="app.id"
              :class="['carousel-item', { active: currentSlide === index }]"
              @click="viewAppDetail(app)"
            >
              <img :src="app.banner || app.icon" :alt="app.name">
              <div class="carousel-content">
                <h3>{{ app.name }}</h3>
                <p>{{ app.description }}</p>
                <button class="install-btn" @click.stop="installApp(app)">
                  <i class="fas fa-download"></i>
                  安装
                </button>
              </div>
            </div>
          </div>
          <div class="carousel-indicators">
            <button 
              v-for="(_, index) in featuredApps" 
              :key="index"
              :class="['indicator', { active: currentSlide === index }]"
              @click="currentSlide = index"
            ></button>
          </div>
        </div>

        <!-- 分类导航 -->
        <div class="categories-section">
          <h2>应用分类</h2>
          <div class="categories-grid">
            <div 
              v-for="category in categories" 
              :key="category.id"
              class="category-item"
              @click="browseCategory(category)"
            >
              <i :class="category.icon"></i>
              <span>{{ category.name }}</span>
              <small>{{ category.count }} 个应用</small>
            </div>
          </div>
        </div>

        <!-- 推荐应用 -->
        <div class="recommended-section">
          <h2>推荐应用</h2>
          <div class="apps-grid">
            <AppCard 
              v-for="app in recommendedApps" 
              :key="app.id"
              :app="app"
              @install="installApp"
              @view="viewAppDetail"
            />
          </div>
        </div>
      </div>

      <!-- 浏览页面 -->
      <div v-else-if="activeTab === 'browse'" class="browse-page">
        <!-- 筛选器 -->
        <div class="filters">
          <select v-model="selectedCategory" @change="loadApps">
            <option value="">所有分类</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
          
          <select v-model="sortBy" @change="loadApps">
            <option value="name">按名称排序</option>
            <option value="downloads">按下载量排序</option>
            <option value="rating">按评分排序</option>
            <option value="updated">按更新时间排序</option>
          </select>
          
          <select v-model="sortOrder" @change="loadApps">
            <option value="asc">升序</option>
            <option value="desc">降序</option>
          </select>
        </div>

        <!-- 应用列表 -->
        <div class="apps-list">
          <div v-if="loading" class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            加载中...
          </div>
          
          <div v-else-if="apps.length === 0" class="empty">
            <i class="fas fa-inbox"></i>
            <p>没有找到应用</p>
          </div>
          
          <div v-else class="apps-grid">
            <AppCard 
              v-for="app in apps" 
              :key="app.id"
              :app="app"
              @install="installApp"
              @view="viewAppDetail"
            />
          </div>
          
          <!-- 分页 -->
          <div v-if="totalPages > 1" class="pagination">
            <button 
              :disabled="currentPage === 1" 
              @click="changePage(currentPage - 1)"
            >
              <i class="fas fa-chevron-left"></i>
            </button>
            
            <span>{{ currentPage }} / {{ totalPages }}</span>
            
            <button 
              :disabled="currentPage === totalPages" 
              @click="changePage(currentPage + 1)"
            >
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- 已安装页面 -->
      <div v-else-if="activeTab === 'installed'" class="installed-page">
        <div class="installed-header">
          <h2>已安装应用</h2>
          <button class="update-all-btn" @click="updateAllApps" :disabled="updating">
            <i :class="['fas', updating ? 'fa-spinner fa-spin' : 'fa-sync-alt']"></i>
            {{ updating ? '更新中...' : '全部更新' }}
          </button>
        </div>

        <div class="installed-list">
          <div v-if="installedApps.length === 0" class="empty">
            <i class="fas fa-download"></i>
            <p>还没有安装任何应用</p>
            <button @click="activeTab = 'discover'" class="browse-btn">
              去应用商店看看
            </button>
          </div>
          
          <div v-else class="apps-grid">
            <InstalledAppCard 
              v-for="app in installedApps" 
              :key="app.appKey"
              :app="app"
              @update="updateApp"
              @uninstall="uninstallApp"
              @view="viewInstalledAppDetail"
            />
          </div>
        </div>
      </div>

      <!-- 搜索结果页面 -->
      <div v-else-if="activeTab === 'search'" class="search-page">
        <div class="search-header">
          <h2>搜索结果</h2>
          <p>"{{ searchQuery }}" 的搜索结果 ({{ searchResults.length }} 个)</p>
        </div>

        <div class="search-results">
          <div v-if="searchLoading" class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            搜索中...
          </div>
          
          <div v-else-if="searchResults.length === 0" class="empty">
            <i class="fas fa-search"></i>
            <p>没有找到相关应用</p>
          </div>
          
          <div v-else class="apps-grid">
            <AppCard 
              v-for="app in searchResults" 
              :key="app.id"
              :app="app"
              @install="installApp"
              @view="viewAppDetail"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 应用详情弹窗 -->
    <AppDetailModal 
      v-if="showAppDetail"
      :app="selectedApp"
      @close="showAppDetail = false"
      @install="installApp"
    />

    <!-- 安装进度弹窗 -->
    <InstallProgressModal 
      v-if="showInstallProgress"
      :app="installingApp"
      :progress="installProgress"
      :status="installStatus"
      @close="showInstallProgress = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { AppStoreService, createAppStoreService } from '@/services/appStoreService'
import { StoreAppInfo, InstalledAppInfo, AppCategoryInfo } from '@/types/app-package'
import AppCard from '@/components/store/AppCard.vue'
import InstalledAppCard from '@/components/store/InstalledAppCard.vue'
import AppDetailModal from '@/components/store/AppDetailModal.vue'
import InstallProgressModal from '@/components/store/InstallProgressModal.vue'

// 组件状态
const activeTab = ref('discover')
const searchQuery = ref('')
const loading = ref(false)
const searchLoading = ref(false)
const updating = ref(false)

// 轮播图
const currentSlide = ref(0)
const featuredApps = ref<StoreAppInfo[]>([])

// 分类
const categories = ref<AppCategoryInfo[]>([])
const selectedCategory = ref('')

// 应用列表
const apps = ref<StoreAppInfo[]>([])
const recommendedApps = ref<StoreAppInfo[]>([])
const installedApps = ref<InstalledAppInfo[]>([])
const searchResults = ref<StoreAppInfo[]>([])

// 分页
const currentPage = ref(1)
const totalPages = ref(1)
const pageSize = ref(20)

// 排序
const sortBy = ref('name')
const sortOrder = ref('asc')

// 弹窗状态
const showAppDetail = ref(false)
const showInstallProgress = ref(false)
const selectedApp = ref<StoreAppInfo | null>(null)
const installingApp = ref<StoreAppInfo | null>(null)
const installProgress = ref(0)
const installStatus = ref('')

// 服务实例
const storeService = createAppStoreService()

// 标签页配置
const tabs = [
  { key: 'discover', label: '发现', icon: 'fas fa-compass' },
  { key: 'browse', label: '浏览', icon: 'fas fa-th-large' },
  { key: 'installed', label: '已安装', icon: 'fas fa-download' },
  { key: 'search', label: '搜索', icon: 'fas fa-search' }
]

// 初始化
onMounted(async () => {
  await Promise.all([
    loadCategories(),
    loadFeaturedApps(),
    loadRecommendedApps(),
    loadInstalledApps()
  ])
  
  // 启动轮播图自动播放
  startCarousel()
})

// 监听搜索查询变化
watch(searchQuery, (newQuery) => {
  if (newQuery.trim()) {
    activeTab.value = 'search'
    handleSearch()
  } else if (activeTab.value === 'search') {
    activeTab.value = 'discover'
  }
})

// 加载分类
async function loadCategories() {
  try {
    categories.value = await storeService.getCategories()
  } catch (error) {
    console.error('加载分类失败:', error)
    ElMessage.error('加载分类失败')
  }
}

// 加载热门应用
async function loadFeaturedApps() {
  try {
    featuredApps.value = await storeService.getFeaturedApps(5)
  } catch (error) {
    console.error('加载热门应用失败:', error)
  }
}

// 加载推荐应用
async function loadRecommendedApps() {
  try {
    recommendedApps.value = await storeService.getRecommendedApps(8)
  } catch (error) {
    console.error('加载推荐应用失败:', error)
  }
}

// 加载应用列表
async function loadApps() {
  loading.value = true
  try {
    const result = await storeService.getApps({
      category: selectedCategory.value,
      page: currentPage.value,
      limit: pageSize.value,
      sort: sortBy.value as any,
      order: sortOrder.value as any
    })
    
    apps.value = result.apps
    totalPages.value = Math.ceil(result.total / pageSize.value)
  } catch (error) {
    console.error('加载应用失败:', error)
    ElMessage.error('加载应用失败')
  } finally {
    loading.value = false
  }
}

// 加载已安装应用
async function loadInstalledApps() {
  try {
    installedApps.value = await storeService.getInstalledApps()
  } catch (error) {
    console.error('加载已安装应用失败:', error)
  }
}

// 搜索应用
async function handleSearch() {
  if (!searchQuery.value.trim()) return
  
  searchLoading.value = true
  try {
    searchResults.value = await storeService.searchApps(searchQuery.value.trim())
  } catch (error) {
    console.error('搜索失败:', error)
    ElMessage.error('搜索失败')
  } finally {
    searchLoading.value = false
  }
}

// 清除搜索
function clearSearch() {
  searchQuery.value = ''
  searchResults.value = []
  activeTab.value = 'discover'
}

// 浏览分类
function browseCategory(category: AppCategoryInfo) {
  selectedCategory.value = category.id
  activeTab.value = 'browse'
  currentPage.value = 1
  loadApps()
}

// 查看应用详情
function viewAppDetail(app: StoreAppInfo) {
  selectedApp.value = app
  showAppDetail.value = true
}

// 查看已安装应用详情
function viewInstalledAppDetail(app: InstalledAppInfo) {
  // 转换为 StoreAppInfo 格式
  const storeApp: StoreAppInfo = {
    id: app.manifest.id,
    name: app.manifest.name,
    version: app.manifest.version,
    description: app.manifest.description,
    icon: app.manifest.icon,
    author: app.manifest.author,
    category: app.manifest.category,
    tags: app.manifest.tags || [],
    screenshots: app.manifest.screenshots || [],
    downloadUrl: '',
    size: 0,
    downloads: 0,
    rating: 0,
    reviews: 0,
    createdAt: app.installedAt,
    updatedAt: app.installedAt
  }
  
  viewAppDetail(storeApp)
}

// 安装应用
async function installApp(app: StoreAppInfo) {
  // 检查是否已安装
  const isInstalled = installedApps.value.some(installed => 
    installed.manifest.id === app.id
  )
  
  if (isInstalled) {
    ElMessage.warning('应用已安装')
    return
  }
  
  installingApp.value = app
  installProgress.value = 0
  installStatus.value = '准备安装...'
  showInstallProgress.value = true
  
  try {
    const result = await storeService.installApp(app.id, undefined, (progress) => {
      installProgress.value = progress
      if (progress < 70) {
        installStatus.value = '下载中...'
      } else {
        installStatus.value = '安装中...'
      }
    })
    
    if (result.success) {
      installStatus.value = '安装完成'
      ElMessage.success(`${app.name} 安装成功`)
      await loadInstalledApps()
      
      setTimeout(() => {
        showInstallProgress.value = false
      }, 1000)
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    console.error('安装失败:', error)
    installStatus.value = '安装失败'
    ElMessage.error(`安装失败: ${error instanceof Error ? error.message : '未知错误'}`)
    
    setTimeout(() => {
      showInstallProgress.value = false
    }, 2000)
  }
}

// 更新应用
async function updateApp(app: InstalledAppInfo) {
  try {
    const result = await storeService.updateApp(app.appKey)
    
    if (result.success) {
      ElMessage.success(`${app.manifest.name} 更新成功`)
      await loadInstalledApps()
    } else {
      ElMessage.warning(result.message)
    }
  } catch (error) {
    console.error('更新失败:', error)
    ElMessage.error(`更新失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

// 卸载应用
async function uninstallApp(app: InstalledAppInfo) {
  try {
    await ElMessageBox.confirm(
      `确定要卸载 ${app.manifest.name} 吗？`,
      '确认卸载',
      {
        confirmButtonText: '卸载',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await storeService.uninstallApp(app.appKey)
    ElMessage.success(`${app.manifest.name} 卸载成功`)
    await loadInstalledApps()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('卸载失败:', error)
      ElMessage.error(`卸载失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
}

// 全部更新
async function updateAllApps() {
  updating.value = true
  
  try {
    const results = await storeService.updateAllApps((appKey, progress) => {
      console.log(`更新 ${appKey}: ${progress}%`)
    })
    
    if (results.success.length > 0) {
      ElMessage.success(`成功更新 ${results.success.length} 个应用`)
    }
    
    if (results.failed.length > 0) {
      ElMessage.warning(`${results.failed.length} 个应用更新失败`)
    }
    
    if (results.success.length === 0 && results.failed.length === 0) {
      ElMessage.info('所有应用都是最新版本')
    }
    
    await loadInstalledApps()
  } catch (error) {
    console.error('批量更新失败:', error)
    ElMessage.error('批量更新失败')
  } finally {
    updating.value = false
  }
}

// 分页
function changePage(page: number) {
  currentPage.value = page
  loadApps()
}

// 轮播图自动播放
function startCarousel() {
  setInterval(() => {
    if (featuredApps.value.length > 0) {
      currentSlide.value = (currentSlide.value + 1) % featuredApps.value.length
    }
  }, 5000)
}

// 监听标签页切换
watch(activeTab, (newTab) => {
  if (newTab === 'browse' && apps.value.length === 0) {
    loadApps()
  }
})
</script>

<script lang="ts">
import type { AppConfig } from '@/types/app.d'

// 应用配置
export const appConfig: AppConfig = {
  key: 'system_store',
  title: 'App Store',
  icon: '🛍️',
  iconColor: '#fff',
  iconBgColor: '#007AFF',
  width: 1000,
  height: 700,
  resizable: true,
  draggable: true,
  closable: true,
  minimizable: true,
  maximizable: true,
  keepInDock: true,
  category: 'system',
  description: '应用商店',
  version: '1.0.0',
  author: 'System',
  tags: ['store', 'apps', 'download'],
  permissions: ['network'],
  system: true,
  essential: false,
  singleton: true
}
</script>

<style scoped>
.app-store {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f7;
}

.store-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: white;
  border-bottom: 1px solid #e5e5e7;
}

.header-nav {
  display: flex;
  gap: 8px;
}

.nav-tab {
  padding: 8px 16px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
}

.nav-tab:hover {
  background: #f0f0f0;
}

.nav-tab.active {
  background: #007aff;
  color: white;
}

.header-search {
  flex: 1;
  max-width: 400px;
  margin-left: 20px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-box i {
  position: absolute;
  left: 12px;
  color: #999;
  z-index: 1;
}

.search-box input {
  width: 100%;
  padding: 10px 40px 10px 40px;
  border: 1px solid #ddd;
  border-radius: 20px;
  outline: none;
  transition: border-color 0.2s;
}

.search-box input:focus {
  border-color: #007aff;
}

.clear-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 4px;
}

.store-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

/* 发现页面样式 */
.featured-carousel {
  position: relative;
  height: 200px;
  margin-bottom: 40px;
  border-radius: 12px;
  overflow: hidden;
}

.carousel-container {
  position: relative;
  height: 100%;
}

.carousel-item {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.5s;
  cursor: pointer;
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px;
}

.carousel-item.active {
  opacity: 1;
}

.carousel-item img {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  margin-right: 30px;
}

.carousel-content h3 {
  font-size: 24px;
  margin-bottom: 8px;
}

.carousel-content p {
  font-size: 16px;
  opacity: 0.9;
  margin-bottom: 20px;
}

.install-btn {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.install-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.carousel-indicators {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: background 0.2s;
}

.indicator.active {
  background: white;
}

.categories-section,
.recommended-section {
  margin-bottom: 40px;
}

.categories-section h2,
.recommended-section h2 {
  font-size: 24px;
  margin-bottom: 20px;
  color: #333;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.category-item {
  padding: 20px;
  background: white;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #e5e5e7;
}

.category-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.category-item i {
  font-size: 32px;
  color: #007aff;
  margin-bottom: 12px;
}

.category-item span {
  display: block;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
}

.category-item small {
  color: #666;
}

.apps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

/* 浏览页面样式 */
.filters {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 12px;
}

.filters select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  outline: none;
}

.apps-list {
  min-height: 400px;
}

.loading,
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #666;
}

.loading i {
  font-size: 24px;
  margin-bottom: 12px;
}

.empty i {
  font-size: 48px;
  margin-bottom: 16px;
  color: #ccc;
}

.browse-btn {
  margin-top: 16px;
  padding: 10px 20px;
  background: #007aff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 40px;
}

.pagination button {
  padding: 8px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination button:hover:not(:disabled) {
  background: #f0f0f0;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 已安装页面样式 */
.installed-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.installed-header h2 {
  font-size: 24px;
  color: #333;
}

.update-all-btn {
  padding: 10px 20px;
  background: #007aff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.update-all-btn:hover:not(:disabled) {
  background: #0056b3;
}

.update-all-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 搜索页面样式 */
.search-header {
  margin-bottom: 20px;
}

.search-header h2 {
  font-size: 24px;
  color: #333;
  margin-bottom: 8px;
}

.search-header p {
  color: #666;
}
</style>