<template>
  <div>
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-4 text-gray-600">Loading...</p>
    </div>

    <div v-else-if="completedOrder?.id" class="bg-gray-50 pb-16">
      <div class="max-w-2xl mx-auto pt-8 mb-12 px-4 sm:px-6 lg:px-8">
        <h2 class="sr-only">Order Confirmation</h2>

        <!-- Confirmation Content -->
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 class="mt-4 text-2xl font-medium text-gray-900">Order Confirmed!</h3>
          <p class="mt-2 text-gray-600">
            Thank you for your order. Your order number is
            <span class="font-medium text-gray-900">{{ completedOrder?.code }}</span>.
          </p>
          <p class="mt-1 text-sm text-gray-500">
            A confirmation email has been sent to your email address.
          </p>
        </div>

        <!-- Order Summary -->
        <div class="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h4 class="text-lg font-medium text-gray-900 mb-4">Order Summary</h4>

          <!-- Cart Contents -->
          <div class="space-y-4 mb-6">
            <div
              v-for="line in completedOrder?.lines || []"
              :key="line.id"
              class="flex items-center space-x-4"
            >
              <div class="flex-shrink-0 w-16 h-16 border border-gray-200 rounded-md overflow-hidden">
                <img
                  v-if="line.featuredAsset"
                  :src="line.featuredAsset.preview"
                  :alt="line.productVariant.name"
                  class="w-full h-full object-center object-cover"
                />
              </div>
              <div class="flex-1">
                <h4 class="text-sm font-medium text-gray-900">{{ line.productVariant.name }}</h4>
                <p class="text-sm text-gray-500">Qty: {{ line.quantity }}</p>
              </div>
              <div class="text-sm font-medium text-gray-900">
                {{ formatPrice(line.linePriceWithTax, completedOrder?.currencyCode) }}
              </div>
            </div>
          </div>

          <!-- Order Totals -->
          <div class="border-t border-gray-200 pt-4 space-y-2">
            <div class="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{{ formatPrice(completedOrder?.subTotalWithTax, completedOrder?.currencyCode) }}</span>
            </div>
            <div class="flex justify-between text-sm text-gray-600">
              <span>Shipping</span>
              <span>{{ formatPrice(completedOrder?.shippingWithTax, completedOrder?.currencyCode) }}</span>
            </div>
            <div class="flex justify-between text-base font-medium text-gray-900 border-t border-gray-200 pt-2">
              <span>Total</span>
              <span v-html="formattedTotal"></span>
            </div>
          </div>
        </div>

        <!-- Shipping Information -->
        <div v-if="completedOrder?.shippingAddress" class="mt-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h4 class="text-lg font-medium text-gray-900 mb-4">Shipping Information</h4>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label class="block text-sm font-medium text-gray-700">Full Name</label>
              <div class="mt-1 text-sm text-gray-900">{{ completedOrder.shippingAddress.fullName || 'Not provided' }}</div>
            </div>
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-gray-700">Address</label>
              <div class="mt-1 text-sm text-gray-900">{{ completedOrder.shippingAddress.streetLine1 || 'Not provided' }}</div>
              <div v-if="completedOrder.shippingAddress.streetLine2" class="mt-1 text-sm text-gray-900">
                {{ completedOrder.shippingAddress.streetLine2 }}
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">City</label>
              <div class="mt-1 text-sm text-gray-900">{{ completedOrder.shippingAddress.city || 'Not provided' }}</div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Postal Code</label>
              <div class="mt-1 text-sm text-gray-900">{{ completedOrder.shippingAddress.postalCode || 'Not provided' }}</div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Phone</label>
              <div class="mt-1 text-sm text-gray-900">{{ completedOrder.shippingAddress.phoneNumber || 'Not provided' }}</div>
            </div>
          </div>
        </div>

        <!-- Payment Information -->
        <div v-if="completedOrder?.payments?.length" class="mt-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h4 class="text-lg font-medium text-gray-900 mb-4">Payment Information</h4>
          <div class="space-y-3">
            <div v-for="payment in completedOrder.payments" :key="payment.id" class="border border-gray-200 rounded-md p-4">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-gray-900">Payment Method:</span>
                <span class="text-sm text-gray-900">{{ payment.method || 'Standard Payment' }}</span>
              </div>
              <div class="flex justify-between items-center mt-2">
                <span class="text-sm font-medium text-gray-900">Status:</span>
                <span :class="[
                  'text-sm px-2 py-1 rounded',
                  payment.state === 'Settled' ? 'bg-green-100 text-green-800' :
                  payment.state === 'Authorized' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                ]">{{ payment.state }}</span>
              </div>
              <div v-if="payment.transactionId" class="flex justify-between items-center mt-2">
                <span class="text-sm font-medium text-gray-900">Transaction ID:</span>
                <span class="text-sm text-gray-900">{{ payment.transactionId }}</span>
              </div>
              <div v-if="payment.amount && payment.state === 'Settled'" class="flex justify-between items-center mt-2">
                <span class="text-sm font-medium text-gray-900">Amount:</span>
                <span class="text-sm text-gray-900">{{ formatPrice(payment.amount, completedOrder?.currencyCode) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Continue Shopping Button -->
        <div class="mt-8 text-center">
          <router-link
            to="/"
            class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Continue Shopping
          </router-link>
        </div>
      </div>
    </div>

    <!-- Empty Order State -->
    <div v-else class="container mx-auto px-4 py-16 text-center">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5.5M7 13l2.5 5.5m0 0L17 21" />
      </svg>
      <h3 class="mt-4 text-lg font-medium text-gray-900">No order found</h3>
      <p class="mt-2 text-gray-500">Your order could not be found or has been processed.</p>
      <div class="mt-6">
        <router-link
          to="/"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          Continue Shopping
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../stores/app'
import { formatPrice } from '../utils'
import { getOrderByCodeQuery } from '../providers/shop/orders/order'

export default {
  name: 'CheckoutConfirm',
  props: {
    orderCode: {
      type: String,
      default: null
    }
  },
  setup(props) {
    const router = useRouter()
    const route = useRoute()
    const appStore = useAppStore()
    const completedOrder = ref({})
    const loading = ref(true)

    // Load order on mount
    onMounted(async () => {
      appStore.setShowCart(false)

      // Log the route info for debugging
      console.log('📋 CheckoutConfirm mounted with route:', {
        params: route.params,
        query: route.query,
        props: props
      })

      // Get order code from route params
      const orderCodeFromRoute = route.params.orderCode

      if (orderCodeFromRoute) {
        // Load order by code (for NowPayments return and repay flows)
        console.log('📋 Loading order by code for confirmation:', orderCodeFromRoute)
        try {
          const order = await getOrderByCodeQuery(orderCodeFromRoute)
          if (order) {
            completedOrder.value = order
            console.log('✅ Order loaded for confirmation:', order.code)
            console.log('✅ Order state:', order.state)
            console.log('✅ Order payments:', order.payments)
          } else {
            console.error('❌ Order not found:', orderCodeFromRoute)
            router.push('/')
          }
        } catch (error) {
          console.error('❌ Error loading order:', error)
          router.push('/')
        }
      } else if (appStore.activeOrder?.id) {
        // Fall back to active order (for standard checkout flow)
        console.log('📋 Using active order for confirmation')
        completedOrder.value = { ...appStore.activeOrder }

        // Clear the cart after successful payment (standard flow only)
        appStore.setActiveOrder({})
      } else {
        // No order code and no active order
        console.error('❌ No order code or active order found')
        router.push('/')
      }

      // Check if order is NOT in a completed/paid state and redirect to unsettled orders
      // Allow both PaymentSettled (captured) and PaymentAuthorized (authorized but not yet captured)
      if (completedOrder.value?.id &&
          completedOrder.value.state !== 'PaymentSettled' &&
          completedOrder.value.state !== 'PaymentAuthorized') {
        console.log('⚠️ Order not in completed state, redirecting to /orders/unsettled')
        console.log('Order state:', completedOrder.value.state)
        router.push('/orders/unsettled')
        return
      }

      loading.value = false
    })

    const formattedTotal = computed(() => {
      const totalAmount = completedOrder.value?.totalWithTax || 0
      const currencyCode = completedOrder.value?.currencyCode

      const mainPrice = formatPrice(totalAmount, currencyCode)

      const showCny = import.meta.env.VITE_SHOW_CNY_AMOUNT === 'true' && (currencyCode === 'THB' || currencyCode === 'USD')
      const cnyRate = currencyCode === 'THB' ? (appStore.thbRates?.CNY || 0) : (appStore.usdRates?.CNY || 0)

      if (showCny && cnyRate) {
        const cnyPriceRaw = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'CNY'
        }).format((totalAmount / 100) * cnyRate)
        // Format CNY with space between symbol and number
        const cnySymbolMatch = cnyPriceRaw.match(/^([^\d]+)(.+)$/)
        const cnyCurrencySymbol = cnySymbolMatch ? cnySymbolMatch[1] : 'CN¥'
        const cnyNumeric = cnySymbolMatch ? cnySymbolMatch[2] : cnyPriceRaw
        const cnyPrice = `${cnyCurrencySymbol} ${cnyNumeric}`
        return `${mainPrice}<br><span class="text-sm text-gray-500">≈ ${cnyPrice}</span>`
      }

      return mainPrice
    })

    return {
      appStore,
      completedOrder,
      formattedTotal,
      formatPrice,
      loading
    }
  }
}
</script>