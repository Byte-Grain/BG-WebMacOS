import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { autoGenerateApps } from './plugins/auto-generate-apps.js'
// import legacy from '@vitejs/plugin-legacy'
// import eslint from 'vite-plugin-eslint'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // 使用多目录扫描功能
    autoGenerateApps({
      scanDirs: [
        'src/apps/builtIn',     // 内置应用
        'src/apps/custom',  // 用户自定义应用
        'src/apps/3rdparty',  // 第三方应用
      ],
      outputFile: 'src/apps/default-apps.ts'
    }),
    vue(),
    AutoImport({
      imports: [
        'vue',
        'vue-router',
        'vuex'
      ],
      resolvers: [
        ElementPlusResolver({
          importStyle: 'css', // 按需导入CSS样式
          directives: true, // 自动导入指令
          version: '2.10.4', // 指定版本

        })
      ],
      dts: true, // 生成类型声明文件
      eslintrc: {
        enabled: true, // 生成eslint配置
        filepath: './.eslintrc-auto-import.json',
        globalsPropValue: true
      }
    }),
    Components({
      resolvers: [
        ElementPlusResolver({
          importStyle: 'css', // 按需导入CSS样式
          directives: true, // 自动导入指令
          version: '2.10.4', // 指定版本
          resolveIcons: true, // 自动导入图标
        })
      ],
      dts: true, // 生成类型声明文件
      dirs: ['src/shared/components/**/'], // 自动导入的组件目录
      extensions: ['vue'],
      deep: true
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@core': fileURLToPath(new URL('./src/core', import.meta.url)),
      '@platform': fileURLToPath(new URL('./src/platform', import.meta.url)),
      '@apps': fileURLToPath(new URL('./src/apps', import.meta.url)),
      '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
      '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
      '@api': fileURLToPath(new URL('./src/api', import.meta.url))
    }
  },
  server: {
    port: 8080,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vue 核心库
          if (id.includes('vue')) {
            return 'vue-vendor'
          }
          // Element Plus 所有模块统一打包
          if (id.includes('element-plus') || id.includes('@element-plus')) {
            return 'element-plus'
          }
          // 第三方库
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        }
      }
    }
  }
})