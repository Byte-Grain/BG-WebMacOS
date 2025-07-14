import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
// import legacy from '@vitejs/plugin-legacy'
// import eslint from 'vite-plugin-eslint'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue()
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
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 8080,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  // css: {
  //   preprocessorOptions: {
  //     scss: {
  //       additionalData: `@import "@/asset/css/variables.scss";`
  //     }
  //   }
  // }
})