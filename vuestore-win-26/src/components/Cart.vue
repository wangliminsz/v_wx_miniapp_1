<template>
  <div>
    <div v-if="appStore.showCart" class="fixed inset-0 overflow-hidden z-20">
      <div class="absolute inset-0 overflow-hidden">
        <div class="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity opacity-100"></div>
        <div class="fixed inset-y-0 right-0 pl-0 max-w-full flex">
          <div class="w-screen max-w-md translate-x-0">
            <div class="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
              <div class="flex-1 py-6 overflow-y-auto pl-4 pr-8 sm:px-6">
                <div class="flex items-start justify-between">
                  <h2 class="text-lg font-medium text-gray-900">{{ t('cart.yourCart') }}</h2>
                  <div class="ml-3 h-7 flex items-center">
                    <SfButton type="button" variant="tertiary" square class="-m-2 p-2 text-gray-400 hover:text-gray-500"
                      @click="appStore.setShowCart(false)">
                      <span class="sr-only">{{ t('common.close') }}</span>
                      <CloseIcon />
                    </SfButton>
                  </div>
                </div>
                <div class="mt-8">
                  <CartContents v-if="appStore.activeOrder && appStore.activeOrder.totalQuantity"
                    @close-cart="handleCloseCart" />
                  <div v-else class="flex items-center justify-center h-48 text-xl text-gray-400">
                    {{ t('cart.emptyCart') }}
                  </div>
                </div>
              </div>
              <div v-if="appStore.activeOrder?.totalQuantity && isInEditableUrl"
                class="border-t border-gray-200 py-6 px-6 sm:px-8">
                <div class="flex justify-between text-base font-medium text-gray-900 mr-4">
                  <p>{{ t('cart.subtotal') }}</p>
                  <p>
                    <CartPrice field="subTotalWithTax" :order="appStore.activeOrder" />
                  </p>
                </div>
                <p class="mt-0.5 text-sm text-gray-500">
                  {{ t('cart.shippingAtCheckout') }}
                </p>

                <!-- Stock Validation Error -->
                <div v-if="stockValidationError" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <div class="flex">
                    <div class="flex-shrink-0">
                      <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div class="ml-3 flex-1">
                      <h3 class="text-sm font-medium text-red-800">{{ t('cart.stockIssues') }}</h3>
                      <div class="mt-1 text-sm text-red-700">
                        <p>{{ stockValidationError }}</p>
                      </div>
                    </div>
                    <div class="ml-auto pl-3">
                      <div class="-mx-1.5 -my-1.5">
                        <button @click="stockValidationError = ''" type="button"
                          class="inline-flex rounded-md p-1.5 bg-red-50 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50">
                          <span class="sr-only">{{ t('common.close') }}</span>
                          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="mt-6">
                  <button @click="handleCheckout" :disabled="isCheckingOut" :class="[
                    'flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium w-full transition-colors',
                    isCheckingOut
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  ]">
                    <span v-if="!isCheckingOut">{{ t('cart.proceedToCheckout') }}</span>
                    <span v-else class="flex items-center">
                      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {{ t('cart.validatingStock') }}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '../stores/app'
import { isCheckoutPage } from '../utils'
import { getProductById } from '../providers/shop/products/products'
import CartContents from './CartContents.vue'
import CartPrice from './CartPrice.vue'
import CloseIcon from './icons/CloseIcon.vue'

export default {
  name: 'Cart',
  components: {
    CartContents,
    CartPrice,
    CloseIcon
  },
  setup() {
    const { t } = useI18n()
    const appStore = useAppStore()
    const route = useRoute()
    const router = useRouter()
    const stockValidationError = ref('')
    const isCheckingOut = ref(false)

    const isInEditableUrl = computed(() => {
      return !isCheckoutPage(route.path)
    })

    // Function to validate stock levels for all items in the cart
    async function validateStockLevels() {
      // console.log('🛒 validateStockLevels called')
      if (!appStore.activeOrder?.lines?.length) {
        // console.log('🛒 Cart is empty')
        return { isValid: false, message: 'Cart is empty' }
      }

      // console.log(`🛒 Validating ${appStore.activeOrder.lines.length} cart items`)
      const stockIssues = []

      for (const line of appStore.activeOrder.lines) {
        const productId = line.productVariant.product?.id || line.productVariant.id
        const quantity = line.quantity
        // console.log(`🛒 Checking stock for: ${line.productVariant.name}, quantity: ${quantity}, productId: ${productId}`)

        try {
          // Get fresh product data from backend to ensure we have current stock levels
          // console.log(`🛒 Fetching fresh product data for product ${productId}`)
          const currentProduct = await getProductById(productId)
          // console.log(`🛒 Current product data:`, currentProduct)

          if (!currentProduct) {
            // console.log(`🛒 Product not found: ${line.productVariant.name}`)
            stockIssues.push(`${line.productVariant.name}: Product not found`)
            continue
          }

          // Find the matching variant in the fresh product data
          const currentVariant = currentProduct.variants?.find(v => v.id === line.productVariant.id)
          if (!currentVariant) {
            // console.log(`🛒 Variant not found: ${line.productVariant.name}`)
            stockIssues.push(`${line.productVariant.name}: Product variant not found`)
            continue
          }

          const currentStockLevel = currentVariant.stockLevel
          // console.log(`🛒 Current stock level for ${line.productVariant.name}:`, currentStockLevel)

          // Check stock level from fresh backend data
          if (currentStockLevel === 'OUT_OF_STOCK' || currentStockLevel === 'INSUFFICIENT_STOCK') {
            // console.log(`🛒 Stock issue: ${line.productVariant.name} is out of stock`)
            stockIssues.push(`${line.productVariant.name}: Out of stock`)
          } else if (typeof currentStockLevel === 'number' && quantity > currentStockLevel) {
            // console.log(`🛒 Stock issue: ${line.productVariant.name} - requested ${quantity}, available ${currentStockLevel}`)
            stockIssues.push(`${line.productVariant.name}: Only ${currentStockLevel} available (requested: ${quantity})`)
          } else if (typeof currentStockLevel === 'number' && currentStockLevel <= 0) {
            // console.log(`🛒 Stock issue: ${line.productVariant.name} has 0 stock`)
            stockIssues.push(`${line.productVariant.name}: Out of stock`)
          } else {
            // console.log(`🛒 Stock OK for ${line.productVariant.name}`)
          }
        } catch (error) {
          console.error(`🛒 Error validating stock for ${line.productVariant.name}:`, error)
          // If we can't verify stock, be strict and block checkout
          stockIssues.push(`${line.productVariant.name}: Unable to verify stock - please refresh and try again`)
        }
      }

      if (stockIssues.length > 0) {
        // console.log(`🛒 Found ${stockIssues.length} stock issues`)
        return {
          isValid: false,
          message: stockIssues.join('\n')
        }
      }

      // console.log('🛒 All stock validations passed')
      return { isValid: true, message: 'All items are available' }
    }

    async function handleCheckout() {
      // console.log('🛒 Checkout button clicked - checking login status')

      // Check if user is logged in first
      if (!appStore.isLoggedIn) {
        // console.log('🛒 User not logged in, redirecting to sign-in page')
        // Hide cart first
        appStore.setShowCart(false)
        // Redirect to sign-in page
        router.push('/sign-in')
        return
      }

      // console.log('🛒 User is logged in, starting stock validation')

      // Set loading state to disable button and show loading indicator
      isCheckingOut.value = true

      // Don't hide cart immediately - keep it visible during validation
      // This prevents the cart from disappearing during API calls
      // console.log('🛒 Cart remains visible during stock validation...')

      try {
        // Validate stock levels
        const stockValidationResult = await validateStockLevels()
        // console.log('🛒 Stock validation result:', stockValidationResult)

        if (!stockValidationResult.isValid) {
          // console.log('🛒 Stock validation failed, showing error')
          // Show stock validation error - cart is already visible
          stockValidationError.value = stockValidationResult.message
          return
        }

        // console.log('🛒 Stock validation passed, navigating to checkout')
        // Clear any previous errors
        stockValidationError.value = ''

        // Only hide cart when we're actually navigating to checkout
        appStore.setShowCart(false)

        // Navigate to checkout shipping page
        router.push('/checkout/shipping')
      } finally {
        // Always reset loading state, whether validation succeeds or fails
        isCheckingOut.value = false
      }
    }

    const handleCloseCart = () => {
      // console.log('📦 close-cart event received')
      appStore.setShowCart(false)  // Close cart, set state, etc.
    }

    return {
      t,
      appStore,
      isInEditableUrl,
      stockValidationError,
      isCheckingOut,
      handleCheckout,
      handleCloseCart
    }
  }
}
</script>