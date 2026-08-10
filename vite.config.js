import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: 'Car Bingo',
        short_name: 'Car Bingo',
        description: 'A road-trip bingo card — spot it, tap it, five in a row wins.',
        theme_color: '#aa3bff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        lang: 'en',
      },
      // Generates favicon/apple-touch-icon/maskable icons from public/favicon.svg
      pwaAssets: {
        preset: {
          transparent: {
            sizes: [64, 192, 512],
            favicons: [[48, 'favicon.ico']],
          },
          maskable: {
            sizes: [512],
            padding: 0.2,
            resizeOptions: { background: '#111318' },
          },
          apple: {
            sizes: [180],
            padding: 0.15,
            resizeOptions: { background: '#111318' },
          },
        },
      },
      workbox: {
        // Cache the Google Fonts request so the racing font still loads offline
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 8,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
})
