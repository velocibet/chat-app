// https://nuxt.com/docs/api/configuration/nuxt-config
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineNuxtConfig({
  modules: ['@pinia/nuxt'],
  ssr: false,
  app: {
    head: {
      title: 'Velocibet - 빠르고 가볍게 연결되는 대화',
      meta: [
        { name: 'description', content: 'Velocibet은 빠르고 가벼운 구조로 설계된 실시간 메신저로, 안정적인 연결을 바탕으로 끊김 없는 대화를 제공합니다.' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' }
      ]
    },
    baseURL: './'
  },
  vite: {
    plugins: [tsconfigPaths()]
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE,
      wsBase: process.env.NUXT_PUBLIC_WS_BASE
    }
  },
  css: [
    '~/assets/css/main.css'
  ],
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true }
})
