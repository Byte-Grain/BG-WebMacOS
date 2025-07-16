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
        'src/applications/built-in',     // 内置应用
        'src/applications/user-custom',  // 用户自定义应用
        'src/applications/third-party',  // 第三方应用
      ],
      outputFile: 'src/core/app-registry/system-apps.ts'
    }),
    vue(),
    AutoImport({
      imports: [
        'vue',
        'vue-router',
        'vuex'
      ],
      resolvers: [ElementPlusResolver()],
      dts: true, // 生成类型声明文件
      eslintrc: {
        enabled: true, // 生成eslint配置
        filepath: './.eslintrc-auto-import.json',
        globalsPropValue: true
      }
    }),
    Components({
      resolvers: [
        ElementPlusResolver(),
        // 自动导入图标组件
        ElementPlusResolver({
          importStyle: 'sass'
        })
      ],
      dts: true, // 生成类型声明文件
      dirs: ['src/components'], // 自动导入的组件目录
      extensions: ['vue'],
      deep: true
    })
    // eslint({
    //   include: ['src/**/*.ts', 'src/**/*.vue', 'src/**/*.js'],
    //   exclude: ['node_modules']
    // }),
    // legacy({
    //   targets: ['defaults', 'not IE 11']
    // })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@core': fileURLToPath(new URL('./src/core', import.meta.url)),
      '@platform': fileURLToPath(new URL('./src/platform', import.meta.url)),
      '@applications': fileURLToPath(new URL('./src/applications', import.meta.url)),
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
        manualChunks: {
          vendor: ['vue', 'vue-router', 'vuex'],
          elementPlus: ['element-plus']
        }
      }
    }
  }
})