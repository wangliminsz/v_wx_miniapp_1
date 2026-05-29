<template>
  <div class="container mx-auto px-4 py-8">

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-4 text-gray-600">Loading...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">Error loading variant</h3>
      <p class="mt-1 text-sm text-gray-500">{{ error }}</p>
      <div class="mt-6">
        <button @click="$router.back()"
          class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
          Go Back
        </button>
      </div>
    </div>




    <!-- Variant Details -->
    <div v-else-if="variant" class="max-w-6xl mx-auto px-4">
      <!-- Breadcrumb -->

      <!-- {{ truncateText("abcdefghijklmnopqrstuvwxyz" )}} -->

      <div class="mb-8">
        <nav class="flex space-x-2 text-sm text-gray-500">
          <router-link to="/" class="hover:text-gray-700">Home</router-link>
          <span>/</span>
          <template v-if="variant.product?.collections && variant.product.collections.length > 0">
            <!-- Mobile: Show first collection with ellipsis if more than 1 -->
            <div v-if="isMobile" class="contents">
              <router-link :to="`/collections/${variant.product.collections[0].slug}`" class="hover:text-gray-700">
                {{ truncateText(variant.product.collections[0].name, 4) }}
              </router-link>
              <span v-if="variant.product.collections.length > 1">...</span>
            </div>
            <!-- Desktop: Show collections with truncation if too many -->
            <div v-else class="contents">
              <router-link v-for="(collection, index) in truncatedCollections" :key="collection.id"
                :to="`/collections/${collection.slug}`" class="hover:text-gray-700">
                {{ collection.name }}
              </router-link>
              <span v-if="shouldShowCollectionEllipsis">...</span>
            </div>
            <span>/</span>
          </template>
          <router-link :to="`/products/${variant.product?.slug}`" class="hover:text-gray-700">
            <span v-if="isMobile">{{ truncateText(variant.product?.name, 4) }}</span>
            <span v-else>{{ truncateText(variant.product?.name, 8) }}</span>
          </router-link>
          <span>/</span>
          <span class="text-gray-900 font-medium">
            <span v-if="isMobile">{{ truncateText(variant.name, 6) }}</span>
            <span v-else>{{ truncateText(variant.name, 12) }}</span>
          </span>
        </nav>
      </div>

      <div class="flex">

        <div class="flex flex-col lg:grid lg:grid-cols-2 lg:gap-x-20 lg:items-start mt-4 md:mt-12">

          <!-- Product Images (shows second on mobile) -->
          <div class="order-2 lg:order-1">
            <!-- Product Images -->
            <div class="w-full max-w-2xl mx-auto sm:block lg:max-w-none">
              <!-- Image Container with Navigation -->
              <div class="flex items-center justify-center">
                <!-- Previous button -->
                <button v-if="variantImages.length > 1" @click="previousImage"
                  class="mr-4 bg-gray-200 hover:bg-gray-300 text-gray-700 p-3 rounded-full transition-colors shadow-sm flex-shrink-0">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <!-- Main Image -->
                <div class="h-[400px] w-full md:w-[400px] mx-auto relative flex-shrink-0">
                  <img v-if="currentImage" :src="currentImage.preview + '?w=400&h=400&format=webp'" :alt="variant.name"
                    class="object-center object-cover rounded-lg mx-auto w-full h-full" />
                  <div v-else class="bg-gray-100 rounded-lg h-full w-full flex items-center justify-center">
                    <div class="text-center text-gray-400">
                      <svg class="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p>No image available</p>
                    </div>
                  </div>
                </div>

                <!-- Next button -->
                <button v-if="variantImages.length > 1" @click="nextImage"
                  class="ml-4 bg-gray-200 hover:bg-gray-300 text-gray-700 p-3 rounded-full transition-colors shadow-sm flex-shrink-0">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <!-- Thumbnail Images -->
              <div v-if="variantImages.length > 1"
                class="w-full md:w-[400px] my-2 flex flex-wrap gap-3 justify-center mx-auto">
                <div v-for="asset in variantImages" :key="asset.id" @click="selectImage(asset)" :class="[
                  'cursor-pointer border-2 rounded-lg overflow-hidden hover:border-primary-600',
                  currentImage && currentImage.id === asset.id
                    ? 'border-primary-600'
                    : 'border-transparent'
                ]">
                  <img :src="asset.preview + '?w=80&h=80&format=webp'" :alt="variant.name"
                    class="w-20 h-20 object-cover object-center" />
                </div>
              </div>
            </div>

          </div>


          <!-- Product Details (shows first on mobile) -->
          <div class="order-1 lg:order-2 mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
            <!-- Product Title -->
            <h1 class="text-3xl sm:text-4xl font-light tracking-tight text-gray-900 mb-4">
              {{ variant.name }}
            </h1>
            <h2 class="text-xl text-gray-600 mb-4">{{ variant.product?.name }}</h2>

            <!-- Product Description -->
            <div v-if="variant.product?.description" class="mb-6">
              <h3 class="sr-only">Description</h3>
              <div class="text-base text-gray-700" v-html="variant.product.description" />
            </div>

            <!-- Price and Add to Cart -->
            <div class="mt-10 flex flex-col sm:flex-row sm:items-center">
              <!-- Price -->
              <div class="text-3xl text-gray-900 mr-4 mb-4 sm:mb-0">
                <PriceDisplay :price="variant.priceWithTax" :currencyCode="variant.currencyCode" />
              </div>

              <!-- Add to Cart Button -->
              <div class="flex sm:flex-col1 align-baseline">
                <button @click="addToCart" :disabled="variant.stockLevel <= 0" :class="[
                  'max-w-xs flex-1 transition-colors border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-primary-500 sm:w-full',
                  variant.stockLevel <= 0 ? 'bg-gray-600 cursor-not-allowed' :
                    quantityInCart === 0 ? 'bg-primary-600 hover:bg-primary-700' :
                      'bg-green-600 hover:bg-green-700'
                ]">
                  <span v-if="variant.stockLevel <= 0">
                    Out of Stock
                  </span>
                  <span v-else-if="quantityInCart > 0" class="flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {{ quantityInCart }} in cart
                  </span>
                  <span v-else>
                    Add to cart
                  </span>
                </button>

                <!-- Wishlist Button -->
                <!-- <button type="button"
                class="ml-4 py-3 px-3 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-500">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span class="sr-only">Add to favorites</span>
              </button> -->
              </div>
            </div>

            <!-- SKU, Cart Quantity and Stock Level -->
            <div class="mt-2 flex items-center space-x-2">
              <span v-if="variant.sku" class="text-gray-500">{{ variant.sku }}</span>

              <!-- Cart Quantity -->
              <!-- <span v-if="quantityInCart > 0" class="text-sm text-green-600 font-medium">
              {{ quantityInCart }} in cart
            </span> -->

              <!-- Stock Status -->
              <span v-if="variant.stockLevel !== undefined" :class="[
                'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                getStockLevelColor(variant.stockLevel)
              ]">
                {{ getStockLevelText(variant.stockLevel) }}
              </span>
            </div>

            <!-- Add to Cart Error Display -->
            <div v-if="addToCartError" class="mt-4">
              <div class="bg-amber-50 border border-amber-200 rounded-md p-4">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div class="ml-3 flex-1">
                    <h3 class="text-sm font-medium text-amber-800">Unable to Add to Cart</h3>
                    <div class="mt-1 text-sm text-amber-700">
                      <p>{{ addToCartError }}</p>
                    </div>
                  </div>
                  <div class="ml-auto pl-3">
                    <div class="-mx-1.5 -my-1.5">
                      <button @click="closeError" type="button"
                        class="inline-flex rounded-md bg-amber-50 p-1.5 text-amber-500 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2 focus:ring-offset-amber-50">
                        <span class="sr-only">Dismiss</span>
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Shipping & Returns -->
            <!-- <section class="mt-12 pt-12 border-t text-xs">
              <h3 class="text-gray-600 font-bold mb-2">Shipping & Returns</h3>
              <div class="text-gray-500 space-y-1">
                <p>Standard shipping: 3 - 5 working days. Express shipping: 1 - 3 working days.</p>
                <p>Shipping costs depend on delivery address and will be calculated during checkout.</p>
                <p>Returns are subject to terms. Please see the <span class="underline cursor-pointer">returns
                    page</span>
                  for
                  further information.</p>
              </div>
            </section> -->
          </div>

        </div>

      </div>



    </div>




    <!-- Product Reviews Section -->
    <div>
      <!-- <div v-if="showReviews && variant && variant.product" class="mt-16  pt-6 border-t border-gray-200"> -->
      <ProductReviews :product-id="variant.product.id" />
    </div>

  </div>

</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { graphqlRequest } from '../utils/api'
import { addItemToOrderMutation, getActiveOrderQuery } from '../providers/shop/orders/order'
import { gql } from 'graphql-tag'
import ProductReviews from '../components/ProductReviews.vue'
import PriceDisplay from '../components/PriceDisplay.vue'

const GET_PRODUCT_WITH_VARIANTS = gql`
  query GetProductWithVariants($slug: String!) {
    product(slug: $slug) {
      id
      name
      slug
      description
      collections {
        id
        slug
        name
      }
      featuredAsset { id preview }
      assets { id preview }
      variants {
        id
        name
        sku
        priceWithTax
        currencyCode
        stockLevel
        featuredAsset { id preview }
        assets { id preview }
        options { id name code }
      }
    }
  }
`

export default {
  name: 'Variant',
  components: {
    ProductReviews,
    PriceDisplay
  },
  components: {
    ProductReviews
  },

  setup() {
    const route = useRoute()
    const appStore = useAppStore()
    const variant = ref(null)
    const loading = ref(true)
    const error = ref(null)
    const currentImage = ref(null)
    const addToCartError = ref(null)

    async function fetchVariant() {
      try {
        loading.value = true
        error.value = null

        const productSlug = route.params.productSlug
        const variantId = route.params.variantId

        // Fetch product with all variants using slug
        const data = await graphqlRequest(GET_PRODUCT_WITH_VARIANTS, { slug: productSlug })
        const product = data.product

        if (!product) {
          error.value = 'Product not found'
          return
        }

        // Find the specific variant by ID
        const foundVariant = product.variants.find(v => v.id === variantId)
        if (!foundVariant) {
          error.value = 'Variant not found'
          return
        }

        // Combine variant data with product info
        variant.value = { ...foundVariant, product }

        // Debug logging
        // console.log('🔍 Variant data:', variant.value)
        // console.log('🔍 Variant featuredAsset:', variant.value.featuredAsset)
        // console.log('🔍 Variant assets:', variant.value.assets)
        // console.log('🔍 Product featuredAsset:', variant.value.product?.featuredAsset)
        // console.log('🔍 Product assets:', variant.value.product?.assets)

        // Initialize currentImage with the first available image
        const images = variantImages.value
        // console.log('🔍 Computed variantImages:', images)
        if (images.length > 0) {
          currentImage.value = images[0]
          // console.log('🔍 Set currentImage to:', currentImage.value)
        }

      } catch (err) {
        error.value = err.message || 'Failed to load variant'
        console.error('Error fetching variant:', err)
      } finally {
        loading.value = false
      }
    }

    // Cart quantity for the current variant
    const quantityInCart = computed(() => {
      if (!variant.value || !appStore.activeOrder?.lines) return 0
      const orderLine = appStore.activeOrder.lines.find(
        line => line.productVariant.id === variant.value.id
      )
      return orderLine?.quantity || 0
    })

    // Function to get human-friendly error message
    function getHumanFriendlyErrorMessage(errorCode) {
      const errorMessages = {
        'INSUFFICIENT_STOCK_ERROR': 'This item is currently out of stock and cannot be added to your cart.',
        'ORDER_LIMIT_ERROR': 'You have reached the maximum quantity for this item.',
        'NEGATIVE_QUANTITY_ERROR': 'Invalid quantity requested.',
        'INSUFFICIENT_STOCK': 'Sorry, this item is no longer available in the requested quantity.'
      }
      return errorMessages[errorCode] || 'Failed to add item to cart. Please try again.'
    }

    // Function to close error message
    function closeError() {
      addToCartError.value = null
    }

    // Helper function to truncate text
    function truncateText(text, maxLength) {
      if (!text || text.length <= maxLength) return text
      return text.substring(0, maxLength) + '...'
    }

    // Check if device is mobile (reactive)
    const isMobile = ref(window.innerWidth < 768)

    // Update mobile state on window resize
    const updateMobileState = () => {
      isMobile.value = window.innerWidth < 768
    }

    // Watch for window resize
    onMounted(() => {
      window.addEventListener('resize', updateMobileState)
    })

    onUnmounted(() => {
      window.removeEventListener('resize', updateMobileState)
    })

    // Truncated collections for desktop (show max 3 collections)
    const truncatedCollections = computed(() => {
      if (!variant.value?.product?.collections) return []
      const collections = variant.value.product.collections
      return collections.slice(0, 3) // Show only first 3 collections on desktop
    })

    // Check if we should show ellipsis for collections
    const shouldShowCollectionEllipsis = computed(() => {
      return variant.value?.product?.collections?.length > 3
    })

    // Variant images with fallback to product images
    const variantImages = computed(() => {
      if (!variant.value) return []

      const variantFeaturedAsset = variant.value.featuredAsset
      const variantAssets = variant.value.assets || []
      const productAssets = variant.value.product?.assets || []
      const productFeaturedAsset = variant.value.product?.featuredAsset

      // console.log('🔍 variantImages computed - variantFeaturedAsset:', variantFeaturedAsset)
      // console.log('🔍 variantImages computed - variantAssets:', variantAssets)
      // console.log('🔍 variantImages computed - productFeaturedAsset:', productFeaturedAsset)
      // console.log('🔍 variantImages computed - productAssets:', productAssets)

      let allImages = []

      // If variant has assets, use them
      if (variantAssets.length > 0) {
        allImages = [...variantAssets]
        // Add variant featured asset if not already included
        if (variantFeaturedAsset && !variantAssets.some(asset => asset.id === variantFeaturedAsset.id)) {
          allImages = [variantFeaturedAsset, ...allImages]
        }
      }
      // If variant has only featured asset, use that
      else if (variantFeaturedAsset) {
        allImages = [variantFeaturedAsset]
      }

      // If we have variant images, also include product images as fallback
      if (allImages.length > 0) {
        // Add product assets that aren't already in the variant images
        productAssets.forEach(productAsset => {
          if (!allImages.some(variantAsset => variantAsset.id === productAsset.id)) {
            allImages.push(productAsset)
          }
        })
        // Add product featured asset if not already included
        if (productFeaturedAsset && !allImages.some(asset => asset.id === productFeaturedAsset.id)) {
          allImages.push(productFeaturedAsset)
        }
        // console.log('🔍 variantImages computed - result (variant + product images):', allImages)
        return allImages
      }

      // If no variant images, use product images
      if (productAssets.length > 0) {
        // console.log('🔍 variantImages computed - result (product assets):', productAssets)
        return productAssets
      }
      // Final fallback to product featured asset
      else if (productFeaturedAsset) {
        // console.log('🔍 variantImages computed - result (product featuredAsset):', [productFeaturedAsset])
        return [productFeaturedAsset]
      }

      // console.log('🔍 variantImages computed - result (empty):', [])
      return []
    })

    function formatPrice(variant) {
      if (!variant.priceWithTax) return 'N/A'
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: variant.currencyCode || 'USD'
      }).format(variant.priceWithTax / 100)
    }

    function getStockLevelText(stockLevel) {
      if (typeof stockLevel === 'number') {
        if (stockLevel > 10) return 'In stock'
        if (stockLevel > 0) return `${stockLevel} left in stock`
        return 'Out of stock'
      } else if (typeof stockLevel === 'string') {
        if (stockLevel === 'IN_STOCK') return 'In stock'
        if (stockLevel === 'OUT_OF_STOCK') return 'Out of stock'
        if (stockLevel === 'LOW_STOCK') return 'Low stock'
        return stockLevel // fallback
      }
      return 'Unknown'
    }

    function getStockLevelColor(stockLevel) {
      if (typeof stockLevel === 'number') {
        if (stockLevel > 10) return 'bg-green-100 text-green-800'
        if (stockLevel > 0) return 'bg-yellow-100 text-yellow-800'
        return 'bg-red-100 text-red-800'
      } else if (typeof stockLevel === 'string') {
        if (stockLevel === 'IN_STOCK') return 'bg-green-100 text-green-800'
        if (stockLevel === 'OUT_OF_STOCK') return 'bg-red-100 text-red-800'
        if (stockLevel === 'LOW_STOCK') return 'bg-yellow-100 text-yellow-800'
        return 'bg-gray-100 text-gray-800'
      }
      return 'bg-gray-100 text-gray-800'
    }

    async function addToCart() {
      if (!variant.value || variant.value.stockLevel <= 0) return

      addToCartError.value = null

      try {
        // Check active order state before adding item
        const activeOrder = await getActiveOrderQuery()

        if (activeOrder) {
          // Check order state
          if (activeOrder.state !== 'AddingItems') {
            if (activeOrder.state === 'ArrangingPayment') {
              addToCartError.value = 'You already have an order awaiting payment. Please finish or cancel it.'
              return
            }
            if (activeOrder.state === 'PaymentAuthorized') {
              addToCartError.value = 'This order is already authorized. Please create a new cart.'
              return
            }
            // fallback
            addToCartError.value = `Order cannot be modified in state: ${activeOrder.state}`
            return
          }
        }

        const result = await addItemToOrderMutation(variant.value.id, 1)

        if (result.__typename !== 'Order') {
          // Handle error case
          console.error('Add to cart error:', result.errorCode, result.message)
          addToCartError.value = getHumanFriendlyErrorMessage(result.errorCode)
        } else {
          // Success case - update the active order in the store
          appStore.setActiveOrder(result)
          // console.log('Successfully added to cart:', variant.value.name)
        }
      } catch (error) {
        console.error('Error adding item to cart:', error)
        addToCartError.value = 'Failed to add item to cart. Please try again.'
      }
    }

    function selectImage(asset) {
      currentImage.value = asset
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    function nextImage() {
      if (!currentImage.value || variantImages.value.length <= 1) return
      const currentIndex = variantImages.value.findIndex(img => img.id === currentImage.value.id)
      const nextIndex = (currentIndex + 1) % variantImages.value.length
      currentImage.value = variantImages.value[nextIndex]
    }

    function previousImage() {
      if (!currentImage.value || variantImages.value.length <= 1) return
      const currentIndex = variantImages.value.findIndex(img => img.id === currentImage.value.id)
      const prevIndex = currentIndex === 0 ? variantImages.value.length - 1 : currentIndex - 1
      currentImage.value = variantImages.value[prevIndex]
    }

    onMounted(() => {
      fetchVariant()
      window.addEventListener('resize', updateMobileState)
    })

    // Check if reviews should be shown
    const showReviews = computed(() => {
      return import.meta.env.VITE_SHOW_REVIEWS === 'true'
    })

    return {
      variant,
      loading,
      error,
      quantityInCart,
      variantImages,
      currentImage,
      showReviews,
      addToCartError,
      formatPrice,
      getStockLevelText,
      getStockLevelColor,
      addToCart,
      selectImage,
      nextImage,
      previousImage,
      closeError,
      truncateText,
      isMobile,
      truncatedCollections,
      shouldShowCollectionEllipsis
    }
  }
}
</script>

<style scoped>
.prose {
  max-width: none;
}
</style>