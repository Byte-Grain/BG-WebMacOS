import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
// import legacy from '@vitejs/plugin-legacy'
// import eslint from 'vite-plugin-eslint'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
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
      '@': fileURLToPath(new URL('./src', import.meta.url))
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