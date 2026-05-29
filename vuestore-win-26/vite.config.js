import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export default defineConfig({
  base: '/',  // 👈 必须加这一行
  plugins: [vue()],
  define: {
    __VUE_I18N_FULL_INSTALL__: true,
    __VUE_I18N_LEGACY_API__: true,
    __INTLIFY_PROD_DEVTOOLS__: false,
    __VUE_I18N_PROD_DEVTOOLS__: false, // 新增这一行
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '~': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 8080,
    host: true,
    proxy: {
      '/api': {
        target: process.env.VITE_GRAPHQL_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/shop-api')
      }
    },
    allowedHosts: ['all', '.ngrok-free.app', '.ngrok-free.dev', 'felisa-predigital-virgilio.ngrok-free.dev']
  }
})