import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: './',
  // 沙箱环境禁止清空目录的删除操作，改为覆盖写入
  emptyOutDir: false,
  server: { host: true, port: 5173 }
})
