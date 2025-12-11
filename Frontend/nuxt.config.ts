// https://nuxt.com/docs/api/configuration/nuxt-config
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineNuxtConfig({
  modules: ['@pinia/nuxt'],
  ssr: false,
  app: {
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
