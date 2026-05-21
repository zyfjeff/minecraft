import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.svg'],
      manifest: {
        name: 'CraftWords - Minecraft English Learning',
        short_name: 'CraftWords',
        description: 'Learn English through Minecraft-themed lessons, vocabulary, and quests!',
        theme_color: '#5B8731',
        background_color: '#FFF8F0',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['education', 'games'],
        icons: [
          {
            src: 'icon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Cache Google Fonts
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
        // Don't precache Supabase API calls
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/],
      },
    }),
  ],
  server: {
    host: '127.0.0.1',
    port: 5173
  },
  build: {
    // 手动 chunk 拆分：把不同负载路径的依赖拆出，避免普通用户
    // 首屏拉取完整的 admin、supabase、PWA workbox 等 vendor 代码。
    // - react-vendor: React 核心运行时，全局必需
    // - supabase-vendor: Supabase JS SDK，只在调用服务的页面需要
    // - admin-pages: 后台 /admin/* 路由，普通用户从不访问
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules') && !id.includes('/src/')) return
          if (id.includes('node_modules')) {
            if (id.includes('@supabase')) return 'supabase-vendor'
            if (id.includes('react-router')) return 'router-vendor'
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('scheduler')) {
              return 'react-vendor'
            }
            if (id.includes('workbox')) return 'workbox-vendor'
            return 'vendor'
          }
          // 把所有 admin 路由（src/admin/）合起来成一个懒加载 chunk。
          // 只有实际访问 /admin/* 的用户才会拉。
          if (id.includes('/src/admin/')) return 'admin-pages'
        },
      },
    },
  },
  // Vitest configuration. Tests live next to the modules they cover under
  // src/lib/__tests__/ as `*.test.js`. We default to a node environment because
  // every helper covered today is pure (no DOM); flip individual files to
  // jsdom via a `// @vitest-environment jsdom` header when needed.
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/__tests__/**/*.test.{js,jsx}'],
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/lib/**'],
    },
  },
})
