<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 py-8 lg:py-12">
      <!-- Mobile Sidebar Toggle -->
      <div class="lg:hidden mb-4">
        <button @click="isMobileMenuOpen = !isMobileMenuOpen"
                class="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
          <div class="flex items-center">
            <svg class="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span class="font-medium text-gray-900">导航菜单</span>
          </div>
          <svg class="w-5 h-5 text-gray-500 transform transition-transform" :class="{ 'rotate-180': isMobileMenuOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        <!-- Mobile Menu Dropdown -->
        <div v-show="isMobileMenuOpen" class="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <nav class="py-2">
            <div v-for="(category, categoryKey) in navigationMenu" :key="categoryKey" class="border-b border-gray-100 last:border-0">
              <div class="px-4 py-2 bg-gray-50">
                <span class="text-sm font-semibold text-gray-700">{{ category.title }}</span>
              </div>
              <div class="py-1">
                <router-link v-for="link in category.links" 
                             :key="link.path"
                             :to="link.path"
                             @click="isMobileMenuOpen = false"
                             class="block pl-8 pr-4 py-2 text-sm transition-colors"
                             :class="isActive(link.path) ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'">
                  {{ link.label }}
                </router-link>
              </div>
            </div>
          </nav>
        </div>
      </div>

      <!-- Breadcrumb -->
      <nav class="mb-6 lg:mb-8 text-sm text-gray-500">
        <router-link to="/" class="hover:text-primary-600 transition-colors">首页</router-link>
        <span class="mx-2">/</span>
        <router-link 
          v-if="categoryFirstLink" 
          :to="categoryFirstLink"
          class="text-gray-400 hover:text-primary-600 transition-colors cursor-pointer">
          {{ currentCategory }}
        </router-link>
        <span v-else class="text-gray-400">{{ currentCategory }}</span>
        <span class="mx-2">/</span>
        <span class="text-gray-900">{{ pageTitle }}</span>
      </nav>

      <!-- Two Column Layout -->
      <div class="flex flex-col lg:flex-row gap-8">
        <!-- Sidebar Navigation (Desktop) -->
        <aside class="hidden lg:block lg:w-72 lg:flex-shrink-0">
          <div class="sticky top-24 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div class="p-4 bg-primary-600">
              <h2 class="text-lg font-semibold text-white flex items-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                帮助中心
              </h2>
            </div>
            <nav class="p-4">
              <div v-for="(category, categoryKey) in navigationMenu" :key="categoryKey" class="mb-6 last:mb-0">
                <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
                  {{ category.title }}
                </h3>
                <ul class="space-y-1">
                  <li v-for="link in category.links" :key="link.path">
                    <router-link :to="link.path"
                                 class="block px-3 py-2 rounded-md text-sm transition-all duration-200"
                                 :class="isActive(link.path) 
                                   ? 'bg-primary-50 text-primary-600 font-medium border-l-4 border-primary-600' 
                                   : 'text-gray-600 hover:text-primary-600'">
                      {{ link.label }}
                    </router-link>
                  </li>
                </ul>
              </div>
            </nav>
          </div>
        </aside>

        <!-- Main Content Area -->
        <main class="flex-1 min-w-0">
          <!-- Page Header -->
          <div class="mb-6 lg:mb-8">
            <h1 class="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">{{ pageTitle }}</h1>
            <div class="w-20 h-1 bg-primary-600 rounded"></div>
          </div>

          <!-- Loading State -->
          <div v-if="isLoading" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:p-8">
            <div class="flex items-center justify-center py-12">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span class="ml-3 text-gray-600">加载中...</span>
            </div>
          </div>

          <!-- Error State -->
          <div v-else-if="hasError" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:p-8">
            <div class="text-center py-8">
              <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 class="text-lg font-medium text-gray-900 mb-2">内容加载失败</h3>
              <p class="text-gray-600">抱歉，该页面内容暂时无法加载，请稍后再试。</p>
            </div>
          </div>

          <!-- Content -->
          <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:p-8">
            <div class="text-sm prose prose-lg max-w-none text-gray-700" style="line-height: 180%; letter-spacing: 0.5px;" v-html="pageContent"></div>
          </div>

          <!-- Contact CTA -->
          <div class="mt-8 lg:mt-12 bg-primary-50 rounded-lg p-6 text-center border border-primary-100">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">还有疑问？</h3>
            <p class="text-gray-600 mb-4">我们的客服团队随时为您解答</p>
            <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
              
              <div class="hidden sm:block">
                <span
                  class="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm">
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {{ customerServicePhone }}
                </span>
              </div>
              <div class="sm:hidden">
                <a :href="`tel:${customerServicePhone}`"
                  class="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm">
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {{ customerServicePhone }}
                </a>
              </div>
              <button @click="showCustomerServiceModal"
                class="inline-flex items-center px-6 py-3 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                联系我们
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>

    <!-- Scroll to Top Button -->
    <button v-if="showScrollToTop" @click="scrollToTop"
      class="fixed bottom-20 right-4 z-40 w-8 h-8 bg-transparent border border-gray-500 text-gray-600 rounded-full shadow-sm hover:border-gray-600 hover:text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all duration-200 flex items-center justify-center touch-manipulation opacity-80 hover:opacity-100">
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </button>
  </div>
</template>

<script>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '../stores/app'

// Navigation menu structure
const navigationMenu = {
  about: {
    title: '关于我们',
    links: [
      { path: '/about/company', label: '公司资质' },
      { path: '/about/contact', label: '联系我们' },
      { path: '/about/pharmacy', label: '药房介绍' }
    ]
  },
  guide: {
    title: '购买指南',
    links: [
      { path: '/guide/faq', label: '常见问题' },
      { path: '/guide/payment', label: '支付方式' },
      { path: '/guide/process', label: '购买流程' },
      { path: '/guide/authenticity', label: '辨别真伪' }
    ]
  },
  service: {
    title: '售后服务',
    links: [
      { path: '/service/returns', label: '退换货物' },
      { path: '/service/receipt', label: '票据收据' },
      { path: '/service/customs', label: '清关协助' }
    ]
  },
  shipping: {
    title: '物流配送',
    links: [
      { path: '/shipping/methods', label: '邮寄方式' },
      { path: '/shipping/privacy', label: '隐私配送' },
      { path: '/shipping/tracking', label: '物流查询' },
      { path: '/shipping/fees', label: '运费标准' }
    ]
  },
  policy: {
    title: '服务政策',
    links: [
      { path: '/policy/privacy', label: '隐私保护' },
      { path: '/policy/legal', label: '法律声明' },
      { path: '/policy/disclaimer', label: '免责声明' },
      { path: '/policy/terms', label: '服务条款' }
    ]
  }
}

// Page titles and categories mapping
const pageMetadata = {
  'about-company': { title: '公司资质', category: '关于我们' },
  'about-contact': { title: '联系我们', category: '关于我们' },
  'about-pharmacy': { title: '药房介绍', category: '关于我们' },
  'guide-faq': { title: '常见问题', category: '购买指南' },
  'guide-payment': { title: '支付方式', category: '购买指南' },
  'guide-process': { title: '购买流程', category: '购买指南' },
  'guide-authenticity': { title: '辨别真伪', category: '购买指南' },
  'service-returns': { title: '退换货物', category: '售后服务' },
  'service-receipt': { title: '票据收据', category: '售后服务' },
  'service-customs': { title: '清关协助', category: '售后服务' },
  'shipping-methods': { title: '邮寄方式', category: '物流配送' },
  'shipping-privacy': { title: '隐私配送', category: '物流配送' },
  'shipping-tracking': { title: '物流查询', category: '物流配送' },
  'shipping-fees': { title: '运费标准', category: '物流配送' },
  'policy-privacy': { title: '隐私保护', category: '服务政策' },
  'policy-legal': { title: '法律声明', category: '服务政策' },
  'policy-disclaimer': { title: '免责声明', category: '服务政策' },
  'policy-terms': { title: '服务条款', category: '服务政策' }
}

export default {
  name: 'InfoPage',
  setup() {
    const route = useRoute()
    const appStore = useAppStore()
    const isMobileMenuOpen = ref(false)
    const pageContent = ref('')
    const isLoading = ref(true)
    const hasError = ref(false)
    const showScrollToTop = ref(false)

    const customerServicePhone = computed(() => {
      return import.meta.env.VITE_CUSTOMER_SERVICE_TELEPHONE || '+91-9599761322'
    })

    // Scroll to top function
    const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // Handle scroll events for scroll-to-top button
    const handleScroll = () => {
      showScrollToTop.value = window.scrollY > 300
    }

    const showCustomerServiceModal = () => {
      appStore.toggleCustomerServiceModal()
    }

    const pageId = computed(() => {
      // Extract category from route path (e.g., /about/company -> about)
      const pathParts = route.path.split('/').filter(Boolean)
      const category = pathParts[0]
      const subcategory = route.params.subcategory
      return `${category}-${subcategory}`
    })

    const pageTitle = computed(() => {
      return pageMetadata[pageId.value]?.title || '页面未找到'
    })

    const currentCategory = computed(() => {
      return pageMetadata[pageId.value]?.category || ''
    })

    // Get the current category key (e.g., 'about', 'guide', etc.)
    const currentCategoryKey = computed(() => {
      const pathParts = route.path.split('/').filter(Boolean)
      return pathParts[0] || ''
    })

    // Get the first link of the current category for breadcrumb navigation
    const categoryFirstLink = computed(() => {
      const categoryKey = currentCategoryKey.value
      if (categoryKey && navigationMenu[categoryKey]) {
        return navigationMenu[categoryKey].links[0]?.path || ''
      }
      return ''
    })

    const isActive = (path) => {
      return route.path === path
    }

    // Fetch content from HTML file
    const fetchContent = async () => {
      isLoading.value = true
      hasError.value = false
      
      try {
        const response = await fetch(`/info-pages/${pageId.value}.html`)
        if (response.ok) {
          const html = await response.text()
          pageContent.value = html
        } else {
          hasError.value = true
          pageContent.value = '<p class="text-center text-gray-500 py-8">页面内容暂未添加</p>'
        }
      } catch (error) {
        console.error('Error fetching page content:', error)
        hasError.value = true
        pageContent.value = '<p class="text-center text-gray-500 py-8">页面内容加载失败</p>'
      } finally {
        isLoading.value = false
      }
    }

    // Watch for route changes and fetch new content
    watch(() => route.path, () => {
      fetchContent()
    }, { immediate: true })

    // Add scroll listener for scroll-to-top button
    onMounted(() => {
      window.addEventListener('scroll', handleScroll)
    })

    // Clean up scroll listener
    onUnmounted(() => {
      window.removeEventListener('scroll', handleScroll)
    })

    return {
      pageTitle,
      currentCategory,
      categoryFirstLink,
      pageContent,
      isLoading,
      hasError,
      customerServicePhone,
      showCustomerServiceModal,
      navigationMenu,
      isActive,
      isMobileMenuOpen,
      showScrollToTop,
      scrollToTop
    }
  }
}
</script>

<style scoped>
/* Custom scrollbar for sidebar */
aside::-webkit-scrollbar {
  width: 6px;
}

aside::-webkit-scrollbar-track {
  background: #f1f1f1;
}

aside::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

aside::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Prose styles for HTML content */
/* .prose h2 {
  @apply text-xl font-semibold text-gray-900 mt-8 mb-4;
}

.prose h3 {
  @apply text-lg font-semibold text-gray-800 mt-6 mb-3;
}

.prose p {
  @apply mb-4 leading-relaxed;
}

.prose ul {
  @apply list-disc pl-6 mb-4;
}

.prose li {
  @apply mb-2;
}

.prose strong {
  @apply font-semibold text-gray-900;
} */
</style>
