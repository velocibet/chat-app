// https://nuxt.com/docs/api/configuration/nuxt-config
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineNuxtConfig({
  modules: ['@pinia/nuxt', '@vite-pwa/nuxt'],
  imports: {
    dirs: [
      'composables/**',
      'types/**',
      'utils/**'
    ]
  },
  app: {
    head: {
      title: '벨로시벳 - 빠르고 가볍게 연결되는 대화',
      meta: [
        { name: 'description', content: 'Velocibet은 빠르고 가벼운 구조로 설계된 실시간 메신저로, 안정적인 연결을 바탕으로 끊김 없는 대화를 제공합니다.' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'manifest', href: '/manifest.webmanifest' }
      ]
    }
  },
  pwa: {
    registerType: 'autoUpdate',
    injectRegister: 'script',
    manifest: {
      name: '벨로시벳',
      short_name: '벨로시벳',
      description: '실시간 채팅 애플리케이션',
      theme_color: '#ffffff',
      display: 'standalone',
      icons: [
        {
          src: 'pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        }
      ]
    },
    workbox: {
      navigateFallback: '/',
      importScripts: ['/firebase-messaging-sw.js'],
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
    },
    devOptions: {
      enabled: true,
      type: 'module',
      suppressWarnings: true
    }
  },
  vite: {
    plugins: [tsconfigPaths()]
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE,
      wsBase: process.env.NUXT_PUBLIC_WS_BASE,
      hmacSecret: process.env.HMAC_SECRET,
      imgBase: process.env.NUXT_PUBLIC_IMG_BASE,
      vapidKey: process.env.NUXT_PUBLIC_VAPID_KEY,
      firebaseApiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID,
    }
  },
  css: [
    '~/assets/css/main.css'
  ],
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true }
})