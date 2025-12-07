// https://nuxt.com/docs/api/configuration/nuxt-config
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineNuxtConfig({
  modules: ['@pinia/nuxt'],
  ssr: false,
  nitro: {
    preset: 'static'
  },
  app: {
    baseURL: './',
    buildAssetsDir: '_nuxt/',
    cdnURL: './' 
  },
  vite: {
    plugins: [tsconfigPaths()]
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE
    }
  },
  css: [
    '~/assets/css/main.css'
  ],
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true }
})
