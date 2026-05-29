import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './global.css'
import i18n from './i18n/index.js'
import {
  SfButton, SfInput, SfIconSearch, SfIconShoppingCart, SfIconViewList,
  SfBadge, SfAccordionItem, SfSelect, SfRating, SfCounter, SfLink,
  SfLoaderCircular, SfIconVisibility, SfIconVisibilityOff
} from '@storefront-ui/vue'

const app = createApp(App)

// 1. Register components and plugins immediately
app.component('SfButton', SfButton)
app.component('SfInput', SfInput)
app.component('SfIconSearch', SfIconSearch)
app.component('SfIconShoppingCart', SfIconShoppingCart)
app.component('SfIconViewList', SfIconViewList)
app.component('SfBadge', SfBadge)
app.component('SfAccordionItem', SfAccordionItem)
app.component('SfSelect', SfSelect)
app.component('SfRating', SfRating)
app.component('SfCounter', SfCounter)
app.component('SfLink', SfLink)
app.component('SfLoaderCircular', SfLoaderCircular)
app.component('SfIconVisibility', SfIconVisibility)
app.component('SfIconVisibilityOff', SfIconVisibilityOff)

app.use(createPinia())
app.use(router)
app.use(i18n)

// 强制确保生产环境下 global 实例拥有数据
if (i18n.mode === 'composition') {
  i18n.global.setLocaleMessage('zh', i18n.global.getLocaleMessage('zh'))
}

// 2. Define the async initialization process
const initializeAppData = async () => {
  try {
    const { useAppStore } = await import('./stores/app')
    const appStore = useAppStore()

    // Load critical data
    await appStore.verifyTokenEffectiveness()

    appStore.setCollectionsLoading(true)
    const { getCollections } = await import('./providers/shop/collections/collections')
    const collectionsData = await getCollections()
    if (collectionsData) {
      appStore.setCollections(collectionsData)
    }
    appStore.setCollectionsLoading(false)

    await Promise.all([
      appStore.loadAllFilters(),
      appStore.loadExchangeRates()
    ])
    
    appStore.appReady = true
  } catch (error) {
    console.error('Failed to initialize app data on startup:', error)
    const { useAppStore } = await import('./stores/app')
    useAppStore().appReady = true
  } finally {
    // 3. CRITICAL: Only mount the app after data is ready
    app.mount('#app')
  }
}

// Start the initialization
initializeAppData()