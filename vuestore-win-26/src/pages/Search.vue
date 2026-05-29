<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Main Content Area -->
    <main class="max-w-7xl mx-auto px-4 py-8">
      <!-- Search Header -->
      <!-- <div class="flex gap-2 mb-4">
           <input v-model="query" type="text" placeholder="Search products..."
             class="border rounded px-3 py-2 w-64 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
             @keyup.enter="doSearch" />
           <button @click="doSearch" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
             Search
           </button>
         </div> -->

      <!-- Results Count -->
      <!-- <p v-if="results.length > 0" class="mb-4 text-gray-600">
           Found {{ totalProducts }} products ({{ totalItems }} variants)
         </p> -->

      <div class="lg:grid lg:grid-cols-4 lg:gap-x-8">
        <div class="lg:col-span-4">
          <!-- Search Results Grid - Shows product-level data -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div v-for="product in results" :key="product.productId"
              class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <router-link :to="`/products/${product.slug}`" class="block group">
                <!-- Product Image -->
                <!-- group-hover:scale-105 transition-transform duration-300 -->
                <div class="aspect-w-1 aspect-h-1 bg-gray-100">
                  <img v-if="product.productAsset?.preview" :src="formatImageUrl(product.productAsset.preview)"
                    :alt="product.productName" class="w-full h-48 object-cover" />
                  <div v-else class="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>

                <!-- Product Details -->
                <div class="p-4">
                  <h3 class="text-sm font-medium text-gray-900 mb-2 line-clamp-2">{{ product.productName }}</h3>
                  <p v-if="product.description" class="text-gray-600 text-xs mb-3 line-clamp-2">
                    {{ product.description.replace(/<[^>]*>/g, '') }}
                  </p>

                  <!-- Product Facet Tags -->
                  <div v-if="product.productFacets && product.productFacets.length > 0" class="mb-3">
                    <div class="flex flex-wrap gap-1">
                      <span v-for="facet in product.productFacets" :key="facet.id"
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        {{ facet.name }}
                      </span>
                    </div>
                  </div>

                  <!-- Price Range -->
                  <!-- {{ product.priceRange }} -->
                  <div class="mt-2">
                    <div class="text-sm text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
                      <!-- <span v-html="formatProductPrice(product)"></span> -->

                      <span v-html="formatPriceRange(product.priceRange)"></span>
                    </div>

                    <!-- Variant Count -->
                    <div v-if="product.variantCount > 1" class="text-xs text-gray-500 mt-1">
                      {{ product.variantCount }} variants
                    </div>
                  </div>
                </div>
              </router-link>

            </div>
          </div>
        </div>
      </div>




      <!-- Pagination Section -->
      <div v-if="results.length > 0"
        class="flex justify-center md:justify-between items-center py-8 border-t border-gray-200">

        <!-- Left side: Showing results info -->
        <div class="hidden md:block text-sm text-gray-600">
          Showing {{ ((page - 1) * pageSize) + 1 }} to {{ Math.min(page * pageSize, totalItems) }} of {{ totalItems }}
          products
        </div>

        <!-- Right side: Page navigation -->
        <div class="flex items-center space-x-2">
          <!-- Previous button -->
          <button v-if="page > 1" @click="goToPage(page - 1)" :disabled="loading"
            class="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            <span class="md:hidden">&lt;</span>
            <span class="hidden md:inline">Previous</span>
          </button>

          <!-- Page numbers -->
          <div class="flex space-x-1">
            <button v-for="pageNum in visiblePages" :key="pageNum" @click="goToPage(pageNum)" :class="[
              'px-3 py-1 text-sm font-medium rounded-md',
              pageNum === page
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
            ]" :disabled="loading">
              {{ pageNum }}
            </button>
          </div>

          <!-- Next button -->
          <button v-if="page < totalPages" @click="goToPage(page + 1)" :disabled="loading"
            class="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            <span class="md:hidden">&gt;</span>
            <span class="hidden md:inline">Next</span>
          </button>
        </div>

      </div>


      <!-- Loading State -->
      <div v-if="query && loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p class="text-gray-600 ml-2">Searching products...</p>
      </div>


      <!-- No Results -->
      <div v-else-if="query && !loading && results.length === 0" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.88-6.09-2.32" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No products found</h3>
        <p class="mt-1 text-sm text-gray-500">Try adjusting your search terms or browse our categories.</p>
        <div class="mt-6">
          <router-link to="/"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
            Browse all products
          </router-link>
        </div>
      </div>

      <!-- Initial State -->
      <!-- <div v-else-if="!query" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">Search for products</h3>
        <p class="mt-1 text-sm text-gray-500">Enter keywords to find products in our store.</p>
      </div> -->



    </main>

    <!-- Mobile Scroll to Top Button -->
    <button v-if="showBackToTop" @click="backToTop"
      class="lg:hidden fixed bottom-20 right-4 z-40 w-8 h-8 bg-transparent border border-gray-500 text-gray-600 rounded-full shadow-sm hover:border-gray-600 hover:text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all duration-200 flex items-center justify-center touch-manipulation opacity-80 hover:opacity-100">
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </button>
  </div>
</template>


<script>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { searchProductsWithOptionsProductLevel } from '../providers/shop/search/search'
import { getActiveChannelQuery } from '../providers/shop/collections/collections'
import { useAppStore } from '../stores/app'

export default {
  name: 'Search',

  setup() {
    const route = useRoute()
    const router = useRouter()
    const appStore = useAppStore()

    const query = ref('')
    const results = ref([])              // product search results
    const totalItems = ref(0)            // total product items
    const totalProducts = ref(0)         // total product items (alias for consistency)
    const page = ref(1)
    const pageSize = parseInt(import.meta.env.VITE_PRODUCTS_NUMBER_IN_A_PAGE) || 12
    const loading = ref(false)
    const showBackToTop = ref(false)
    const channelCurrency = ref('USD') // Default currency



    async function doSearch() {
      // Only reset page to 1 if this is a new search (not pagination)
      if (page.value === 1) {
        results.value = []
      }

      if (!query.value.trim()) {
        totalItems.value = 0
        totalProducts.value = 0
        return
      }

      loading.value = true
      try {
        // Use the new searchProductsWithOptionsProductLevel plugin for product-level data with pagination
        const data = await searchProductsWithOptionsProductLevel(query.value, page.value, pageSize)
        // console.log('✅✅✅✅✅ searchProductsWithOptionsProductLevel plugin response:', data)

        // // Plugin returns product-level items directly
        // if (data.items.length > 0) {
        //   // console.log('🎯 Product-level items from plugin:', data.items)
        //   results.value = data.items
        // } else {
        //   results.value = []
        // }

        if (data.items.length > 0) {
          // Map over items to add computed priceRange and ensure variants
          results.value = data.items.map(item => ({
            ...item,
            priceRange: item.variants ? {
              min: Math.min(...item.variants.map(v => v.priceWithTax || 0)),
              max: Math.max(...item.variants.map(v => v.priceWithTax || 0))
            } : { min: 0, max: 0 },
            variants: item.variants || []
          }))
        } else {
          results.value = []
        }

        totalItems.value = data.totalItems
        totalProducts.value = data.totalProducts

        // console.log('🔍 Final product results count:', results.value.length)
        // console.log('🔍 Plugin returned totalItems:', data.totalItems)
        // console.log('🔍 Plugin returned totalProducts:', data.totalProducts)
      } catch (error) {
        console.error('❌ Error searching products:', error)
        results.value = []
        totalItems.value = 0
        totalProducts.value = 0
      } finally {
        loading.value = false
      }
    }


    // function formatImageUrl(previewUrl) {
    //   if (!previewUrl) return ''
    //   // If it's a relative path (no http/https), prefix with S3 domain
    //   let formattedUrl
    //   if (previewUrl.startsWith('http')) {
    //     // It's already a full URL, replace local domain with S3
    //     formattedUrl = previewUrl.replace('http://192.168.0.52:8080/', 'https://vendure-1304214433.cos.ap-guangzhou.myqcloud.com/')
    //   } else {
    //     // It's a relative path, prefix with S3 domain
    //     formattedUrl = 'https://vendure-1304214433.cos.ap-guangzhou.myqcloud.com/' + previewUrl
    //   }
    //   // Add query parameters only if they don't already exist
    //   if (!formattedUrl.includes('?')) {
    //     formattedUrl += '?w=200&h=200&format=webp'
    //   }
    //   return formattedUrl
    // }

    function formatImageUrl(previewUrl) {
      if (!previewUrl) return ''

      let formattedUrl
      formattedUrl = vendureBackendUrl.value + "/assets/" + previewUrl + '?w=400&h=400&format=webp'
      // console.log("------------------>>>>>>", formattedUrl)
      return formattedUrl

      // let formattedUrl
      // if (previewUrl.startsWith('http')) {
      //   // formattedUrl = previewUrl.replace('http://192.168.0.52:8080/', 'https://vendure-1304214433.cos.ap-guangzhou.myqcloud.com/')
      //   formattedUrl = previewUrl
      // } else {
      //   // It's a relative path, prefix with S3 domain
      //   // formattedUrl = 'https://vendure-1304214433.cos.ap-guangzhou.myqcloud.com/' + previewUrl
      //   formattedUrl = previewUrl
      // }
      // // Add query parameters only if they don't already exist
      // if (!formattedUrl.includes('?')) {
      //   formattedUrl += '?w=200&h=200&format=webp'
      // }
      // return formattedUrl
    }

    function formatProductPrice(product) {
      if (!product.priceWithTax) return 'N/A'

      const showCny = import.meta.env.VITE_SHOW_CNY_AMOUNT === 'true' && (channelCurrency.value === 'THB' || channelCurrency.value === 'USD')
      const cnyRate = channelCurrency.value === 'THB' ? (appStore.thbRates?.CNY || 0) : (appStore.usdRates?.CNY || 0)

      // Handle price range format (min/max) with tax

      if (product.priceWithTax.min !== undefined && product.priceWithTax.max !== undefined) {
        const minPrice = product.priceWithTax.min
        const maxPrice = product.priceWithTax.max
        if (minPrice === maxPrice) {
          const thbPrice = new Intl.NumberFormat('en-US', { style: 'currency', currency: channelCurrency.value }).format(minPrice)
          if (showCny && cnyRate) {
            const cnyPriceRaw = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'CNY'
            }).format(minPrice * cnyRate)
            // Format CNY with space between symbol and number
            const cnySymbolMatch = cnyPriceRaw.match(/^([^\d]+)(.+)$/)
            const cnyCurrencySymbol = cnySymbolMatch ? cnySymbolMatch[1] : 'CN¥'
            const cnyNumeric = cnySymbolMatch ? cnySymbolMatch[2] : cnyPriceRaw
            const cnyPrice = `${cnyCurrencySymbol} ${cnyNumeric}`
            return `<span class="whitespace-nowrap">${thbPrice}</span><br><span class="text-sm text-gray-500">≈ ${cnyPrice}</span>`
          }
          return thbPrice
        } else {
          const minFormatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: channelCurrency.value }).format(minPrice)
          const maxFormatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: channelCurrency.value }).format(maxPrice)
          // Extract currency symbol and numeric parts for consistent formatting
          const minParts = minFormatted.split(/\s+/)
          const currencySymbol = minParts.length > 1 ? minParts[0] : ''
          const minNumeric = minParts.length > 1 ? minParts.slice(1).join(' ') : minFormatted
          const maxParts = maxFormatted.split(/\s+/)
          const maxNumeric = maxParts.length > 1 ? maxParts.slice(1).join(' ') : maxFormatted
          const thbRange = `${currencySymbol} ${minNumeric} - ${maxNumeric}`
          if (showCny && cnyRate) {
            const cnyMin = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'CNY'
            }).format(minPrice * cnyRate)
            const cnyMax = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'CNY'
            }).format(maxPrice * cnyRate)
            // For CNY, extract symbol and number differently since it doesn't have spaces
            const cnySymbolMatch = cnyMin.match(/^([^\d]+)(.+)$/)
            const cnyCurrencySymbol = cnySymbolMatch ? cnySymbolMatch[1] : 'CN¥'
            const cnyMinNumeric = cnySymbolMatch ? cnySymbolMatch[2] : cnyMin
            const cnyMaxMatch = cnyMax.match(/^([^\d]+)(.+)$/)
            const cnyMaxNumeric = cnyMaxMatch ? cnyMaxMatch[2] : cnyMax
            const cnyRange = `≈ ${cnyCurrencySymbol} ${cnyMinNumeric} - ${cnyMaxNumeric}`
            return `<span class="whitespace-nowrap">${thbRange}</span><br><span class="text-sm text-gray-500">${cnyRange}</span>`
          }
          return thbRange
        }
      }

      // Handle single price format with tax
      if (product.priceWithTax.value !== undefined) {
        const thbPrice = new Intl.NumberFormat('en-US', { style: 'currency', currency: channelCurrency.value }).format(product.priceWithTax.value)
        if (showCny && cnyRate) {
          const cnyPriceRaw = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'CNY'
          }).format(product.priceWithTax.value * cnyRate)
          // Format CNY with space between symbol and number
          const cnySymbolMatch = cnyPriceRaw.match(/^([^\d]+)(.+)$/)
          const cnyCurrencySymbol = cnySymbolMatch ? cnySymbolMatch[1] : 'CN¥'
          const cnyNumeric = cnySymbolMatch ? cnySymbolMatch[2] : cnyPriceRaw
          const cnyPrice = `${cnyCurrencySymbol} ${cnyNumeric}`
          return `<span class="whitespace-nowrap">${thbPrice}</span><br><span class="text-sm text-gray-500">≈ ${cnyPrice}</span>`
        }
        return thbPrice
      }

      return 'N/A'
    }

    // 没有除以 100 版本
    const formatCurrency = (amount) => {
      if (!amount) return 'N/A'
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: channelCurrency.value
      }).format(amount)

      // Insert a space after the currency symbol if missing 
      return formatted.replace(/^(\D+)(\d)/, '$1 $2')

    }

    const formatPriceRange = (priceRange) => {
      if (!priceRange || !priceRange.min || !priceRange.max) return 'N/A'

      const showCny = import.meta.env.VITE_SHOW_CNY_AMOUNT === 'true' && (channelCurrency.value === 'THB' || channelCurrency.value === 'USD')
      const cnyRate = channelCurrency.value === 'THB' ? (appStore.thbRates?.CNY || 0) : (appStore.usdRates?.CNY || 0)

      if (priceRange.min === priceRange.max) {
        // console.log('1 Hello Price----------->')
        const thbPrice = formatCurrency(priceRange.min)
        if (showCny && cnyRate) {
          const cnyPriceRaw = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'CNY'
          }).format((priceRange.min / 100) * cnyRate)
          // Format CNY with space between symbol and number
          const cnySymbolMatch = cnyPriceRaw.match(/^([^\d]+)(.+)$/)
          const cnyCurrencySymbol = cnySymbolMatch ? cnySymbolMatch[1] : 'CN¥'
          const cnyNumeric = cnySymbolMatch ? cnySymbolMatch[2] : cnyPriceRaw
          const cnyPrice = `${cnyCurrencySymbol} ${cnyNumeric}`
          return `<span class="whitespace-nowrap">${thbPrice}</span><br><span class="text-sm text-gray-500">≈ ${cnyPrice}</span>`
        }
        // console.log('10 Hello Price----------->', priceRange.min)
        // console.log('11 Hello Price----------->', thbPrice)
        return thbPrice
      } else {
        // console.log('2 Hello Range----------->')
        const thbMin = formatCurrency(priceRange.min)
        const thbMax = formatCurrency(priceRange.max)
        // Extract currency symbol and numeric parts (handle different currency formats)
        const thbMinParts = thbMin.split(/\s+/)
        const currencySymbol = thbMinParts.length > 1 ? thbMinParts[0] : ''
        const thbMinNumeric = thbMinParts.length > 1 ? thbMinParts.slice(1).join(' ') : thbMin
        const thbMaxParts = thbMax.split(/\s+/)
        const thbMaxNumeric = thbMaxParts.length > 1 ? thbMaxParts.slice(1).join(' ') : thbMax
        const thbRange = `${currencySymbol} ${thbMinNumeric} - ${thbMaxNumeric}`
        if (showCny && cnyRate) {
          const cnyMin = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'CNY'
          }).format((priceRange.min / 100) * cnyRate)
          const cnyMax = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'CNY'
          }).format((priceRange.max / 100) * cnyRate)
          // For CNY, extract symbol and number differently since it doesn't have spaces
          const cnySymbolMatch = cnyMin.match(/^([^\d]+)(.+)$/)
          const cnyCurrencySymbol = cnySymbolMatch ? cnySymbolMatch[1] : 'CN¥'
          const cnyMinNumeric = cnySymbolMatch ? cnySymbolMatch[2] : cnyMin
          const cnyMaxMatch = cnyMax.match(/^([^\d]+)(.+)$/)
          const cnyMaxNumeric = cnyMaxMatch ? cnyMaxMatch[2] : cnyMax
          const cnyRange = `≈ ${cnyCurrencySymbol} ${cnyMinNumeric} - ${cnyMaxNumeric}`
          return `<span class="whitespace-nowrap">${thbRange}</span><br><span class="text-sm text-gray-500">${cnyRange}</span>`
        }
        return thbRange
      }
    }

    const getPriceRange = (variants) => {
      if (!variants || variants.length === 0) return 'N/A'

      const prices = variants.map(v => v.priceWithTax).filter(price => price != null)
      if (prices.length === 0) return 'N/A'

      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)

      const showCny = import.meta.env.VITE_SHOW_CNY_AMOUNT === 'true' && (channelCurrency.value === 'THB' || channelCurrency.value === 'USD')
      const cnyRate = channelCurrency.value === 'THB' ? (appStore.thbRates?.CNY || 0) : (appStore.usdRates?.CNY || 0)

      if (minPrice === maxPrice) {
        const thbPrice = formatCurrency(minPrice)
        if (showCny && cnyRate) {
          const cnyPriceRaw = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'CNY'
          }).format((minPrice / 100) * cnyRate)
          // Format CNY with space between symbol and number
          const cnySymbolMatch = cnyPriceRaw.match(/^([^\d]+)(.+)$/)
          const cnyCurrencySymbol = cnySymbolMatch ? cnySymbolMatch[1] : 'CN¥'
          const cnyNumeric = cnySymbolMatch ? cnySymbolMatch[2] : cnyPriceRaw
          const cnyPrice = `${cnyCurrencySymbol} ${cnyNumeric}`
          return `<span class="whitespace-nowrap">${thbPrice}</span><br><span class="text-sm text-gray-500">≈ ${cnyPrice}</span>`
        }
        return thbPrice
      } else {
        const thbMin = formatCurrency(minPrice)
        const thbMax = formatCurrency(maxPrice)
        // Extract currency symbol and numeric parts (handle different currency formats)
        const thbMinParts = thbMin.split(/\s+/)
        const currencySymbol = thbMinParts.length > 1 ? thbMinParts[0] : ''
        const thbMinNumeric = thbMinParts.length > 1 ? thbMinParts.slice(1).join(' ') : thbMin
        const thbMaxParts = thbMax.split(/\s+/)
        const thbMaxNumeric = thbMaxParts.length > 1 ? thbMaxParts.slice(1).join(' ') : thbMax
        const thbRange = `${currencySymbol} ${thbMinNumeric} - ${thbMaxNumeric}`
        if (showCny && cnyRate) {
          const cnyMin = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'CNY'
          }).format((minPrice / 100) * cnyRate)
          const cnyMax = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'CNY'
          }).format((maxPrice / 100) * cnyRate)
          // For CNY, extract symbol and number differently since it doesn't have spaces
          const cnySymbolMatch = cnyMin.match(/^([^\d]+)(.+)$/)
          const cnyCurrencySymbol = cnySymbolMatch ? cnySymbolMatch[1] : 'CN¥'
          const cnyMinNumeric = cnySymbolMatch ? cnySymbolMatch[2] : cnyMin
          const cnyMaxMatch = cnyMax.match(/^([^\d]+)(.+)$/)
          const cnyMaxNumeric = cnyMaxMatch ? cnyMaxMatch[2] : cnyMax
          const cnyRange = `≈ ${cnyCurrencySymbol} ${cnyMinNumeric} - ${cnyMaxNumeric}`
          return `<span class="whitespace-nowrap">${thbRange}</span><br><span class="text-sm text-gray-500">${cnyRange}</span>`
        }
        return thbRange
      }
    }

    function backToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    onMounted(async () => {
      // Fetch active channel currency
      try {
        const channel = await getActiveChannelQuery()
        if (channel?.currencyCode) {
          channelCurrency.value = channel.currencyCode
          // console.log('💱 Search page channel currency loaded:', channelCurrency.value)
        }
      } catch (error) {
        console.error('Error fetching channel currency:', error)
      }

      if (route.query.q) {
        query.value = route.query.q
        await doSearch()
      }


      window.addEventListener('scroll', () => {
        showBackToTop.value = window.scrollY > 300
      })
    })

    watch(() => route.query.q, (newQuery) => {
      if (newQuery) {
        query.value = newQuery
        page.value = 1 // Reset to first page for new search
        doSearch()
      }
    })

    // Pagination computed properties
    const totalPages = computed(() => {
      return Math.ceil(totalItems.value / pageSize)
    })

    const visiblePages = computed(() => {
      const current = page.value
      const total = totalPages.value
      const maxVisible = 5 // Show maximum 5 page numbers

      if (total <= maxVisible) {
        // Show all pages if total is less than maxVisible
        return Array.from({ length: total }, (_, i) => i + 1)
      }

      // Calculate range of pages to show
      let start = Math.max(1, current - Math.floor(maxVisible / 2))
      let end = Math.min(total, start + maxVisible - 1)

      // Adjust start if we're near the end
      if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1)
      }

      return Array.from({ length: end - start + 1 }, (_, i) => start + i)
    })

    // Pagination methods
    const goToPage = (pageNum) => {
      if (pageNum === page.value || loading.value) return

      // console.log('Going to page:', pageNum)
      page.value = pageNum
      doSearch()

      // Scroll to top of the page
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // const storefrontUrl = computed(() => {
    //   return import.meta.env.VITE_STOREFRONT_URL || ''
    // })

    const vendureBackendUrl = computed(() => {
      return import.meta.env.VITE_GRAPHQL_URL || ''
    })

    return {
      query,
      results,
      totalItems,
      totalProducts,
      page,
      pageSize,
      loading,
      showBackToTop,
      doSearch,
      formatImageUrl,
      formatProductPrice,
      formatPriceRange,
      formatCurrency,
      getPriceRange,
      backToTop,
      channelCurrency,
      appStore,
      // Pagination
      totalPages,
      visiblePages,
      goToPage,
      // storefrontUrl,
      vendureBackendUrl,
    }
  }
}

</script>