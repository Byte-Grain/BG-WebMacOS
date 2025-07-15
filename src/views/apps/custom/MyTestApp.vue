<template>
    <div class="my-test-app">
        <div class="app-header">
            <h1>{{ title }}</h1>
            <p class="subtitle">这是一个动态加载的测试应用</p>
        </div>

        <div class="app-content">
            <div class="feature-card">
                <div class="card-icon">
                    <i class="fas fa-rocket"></i>
                </div>
                <h3>动态加载</h3>
                <p>此应用通过新的动态组件加载系统自动发现和注册</p>
            </div>

            <div class="feature-card">
                <div class="card-icon">
                    <i class="fas fa-cogs"></i>
                </div>
                <h3>自动配置</h3>
                <p>应用配置从组件导出或文件路径自动推断</p>
            </div>

            <div class="feature-card">
                <div class="card-icon">
                    <i class="fas fa-plug"></i>
                </div>
                <h3>即插即用</h3>
                <p>只需添加Vue文件，无需手动导入或注册</p>
            </div>
        </div>

        <div class="app-actions">
            <button class="action-btn primary" @click="showInfo">
                <i class="fas fa-info-circle"></i>
                应用信息
            </button>
            <button class="action-btn secondary" @click="testFeature">
                <i class="fas fa-play"></i>
                测试功能
            </button>
        </div>

        <div v-if="showDetails" class="app-details">
            <h4>应用详情</h4>
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="label">应用Key:</span>
                    <span class="value">{{ appConfig.key }}</span>
                </div>
                <div class="detail-item">
                    <span class="label">版本:</span>
                    <span class="value">{{ appConfig.version }}</span>
                </div>
                <div class="detail-item">
                    <span class="label">作者:</span>
                    <span class="value">{{ appConfig.author }}</span>
                </div>
                <div class="detail-item">
                    <span class="label">分类:</span>
                    <span class="value">{{ appConfig.category }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import type { AppConfig } from '@/types/app.d'

// 应用配置
export const appConfig: AppConfig = {
        key: 'MyTestApp',
        title: '我的测试应用',
        icon: '🧪',
        iconColor: '#667eea',
        iconBgColor: 'rgba(102, 126, 234, 0.1)',
        
        // 窗口尺寸
        width: 900,
        height: 700,
        minWidth: 320,
        minHeight: 240,
        
        // 窗口行为
        resizable: true,
        draggable: true,
        closable: true,
        minimizable: true,
        maximizable: true,
        alwaysOnTop: false,
        modal: false,
        transparent: false,
        frame: true,
        titleBarStyle: 'default',
        
        // 外观
        backgroundColor: '#ffffff',
        opacity: 1,
        shadow: true,
        animation: true,
        
        // 显示设置
        keepInDock: true,
        hideInDesktop: false,
        hideWhenClose: false,
        autoFocus: true,
        
        // 分类和标签
        category: 'custom',
        tags: [],
        
        // 版本信息
        version: '1.0.0',
        author: '动态加载系统',
        description: '这是一个用于测试动态加载功能的示例应用',
        
        // 权限
        permissions: ['storage'],
        dependencies: []
    }
</script>

<script setup lang="ts">
    import { ref, reactive } from 'vue'

    // 组件数据
    const title = ref('我的测试应用')
    const showDetails = ref(false)
    const testResult = ref('')

    // 方法
    const showInfo = () => {
        showDetails.value = !showDetails.value
    }

    const testFeature = () => {
        const features = [
            '✅ 动态组件加载',
            '✅ 自动应用发现',
            '✅ 配置自动推断',
            '✅ 热重载支持',
            '✅ 错误处理机制'
        ]

        alert(`测试功能运行成功！\n\n支持的特性：\n${features.join('\n')}`)
    }
</script>

<style scoped lang="scss">
    .my-test-app {
        padding: 2rem;
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        overflow-y: auto;

        .app-header {
            text-align: center;
            margin-bottom: 2rem;

            h1 {
                font-size: 2.5rem;
                font-weight: 700;
                margin-bottom: 0.5rem;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            }

            .subtitle {
                font-size: 1.1rem;
                opacity: 0.9;
                margin: 0;
            }
        }

        .app-content {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;

            .feature-card {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border-radius: 16px;
                padding: 1.5rem;
                text-align: center;
                transition: transform 0.3s ease, box-shadow 0.3s ease;

                &:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                }

                .card-icon {
                    font-size: 2.5rem;
                    margin-bottom: 1rem;
                    color: #FFD93D;
                }

                h3 {
                    font-size: 1.3rem;
                    margin-bottom: 0.5rem;
                    font-weight: 600;
                }

                p {
                    font-size: 0.9rem;
                    opacity: 0.9;
                    line-height: 1.5;
                    margin: 0;
                }
            }
        }

        .app-actions {
            display: flex;
            gap: 1rem;
            justify-content: center;
            margin-bottom: 2rem;

            .action-btn {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 12px;
                font-size: 1rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;

                &:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                }

                &.primary {
                    background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
                    color: white;
                }

                &.secondary {
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                }
            }
        }

        .app-details {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 1.5rem;

            h4 {
                font-size: 1.3rem;
                margin-bottom: 1rem;
                text-align: center;
            }

            .detail-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;

                .detail-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.5rem 0;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.2);

                    .label {
                        font-weight: 600;
                        opacity: 0.8;
                    }

                    .value {
                        font-weight: 500;
                        color: #FFD93D;
                    }
                }
            }
        }
    }

    // 响应式设计
    @media (max-width: 768px) {
        .my-test-app {
            padding: 1rem;

            .app-header h1 {
                font-size: 2rem;
            }

            .app-content {
                grid-template-columns: 1fr;
            }

            .app-actions {
                flex-direction: column;
                align-items: center;
            }
        }
    }
</style>