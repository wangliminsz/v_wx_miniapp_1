<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">{{ t('common.loading') }}</p>
      </div>
    </div>

    <!-- Order Detail Content -->
    <div v-else-if="order" class="max-w-4xl mx-auto px-4 py-8">
      <!-- Header -->
      <!-- {{ order }} -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl md:text-3xl font-bold text-gray-900">{{ t('orderDetail.orderNumber') }}{{ order.code }}
            </h1>
            <p class="text-gray-600 mt-2">
              {{ t('orderDetail.placedOn') }} {{ formatOrderDate(order.createdAt) }}
            </p>
          </div>
          <div class="flex items-center space-x-4">
            <!-- <span :class="[
              'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
              getOrderStatusClass(order.state)
            ]">
              {{ formatOrderState(order.state) }}
            </span> -->
            <button @click="$router.push('/account?tab=orders')"
              class="hidden md:inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {{ t('orderDetail.backToOrders') }}
            </button>
          </div>
        </div>
      </div>

      <div class="grid gap-8 lg:grid-cols-3">
        <!-- Order Summary -->
        <div class="lg:col-span-2">
          <!-- Order Items -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200">
            <div class="px-6 py-4 border-b border-gray-200">
              <h2 class="text-lg font-medium text-gray-900">{{ t('orderDetail.orderItems') }}</h2>
            </div>
            <div class="p-6">
              <div class="space-y-6">
                <div v-for="line in order.lines" :key="line.id" class="flex items-center space-x-4">
                  <div class="flex-shrink-0 w-16 h-16 border border-gray-200 rounded-md overflow-hidden">
                    <img v-if="line.featuredAsset && line.featuredAsset.preview" :src="line.featuredAsset.preview"
                      :alt="line.productVariant.name" class="w-full h-full object-center object-cover" />
                    <div v-else class="w-full h-full bg-gray-100 flex items-center justify-center">
                      <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div class="flex-1">
                    <h3 class="text-sm font-medium text-gray-900">{{ line.productVariant.name }}</h3>
                    <div class="flex flex-row justify-between items-center mt-4">
                    <p class="text-sm text-gray-500">{{ t('orderDetail.quantity') }}: {{ line.quantity }}</p>
                    <div class="text-sm font-medium text-gray-500">
                      {{ formatPrice(line.linePriceWithTax, order.currencyCode) }}
                    </div>
                  </div>
                </div>
                <div class="text-sm font-medium text-gray-900">
                  <!-- {{ formatPrice(line.linePriceWithTax, order.currencyCode) }} -->
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Totals -->
        <div class="mt-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-medium text-gray-900">{{ t('checkout.orderSummary') }}</h2>
          </div>
          <div class="p-6">
            <div class="space-y-3">
              <div class="flex justify-between text-sm text-gray-600">
                <span>{{ t('cart.subtotal') }}</span>
                <span>{{ formatPrice(order.subTotalWithTax, order.currencyCode) }}</span>
              </div>
              <div class="flex justify-between text-sm text-gray-600">
                <span>{{ t('cart.shipping') }}</span>
                <span>{{ formatPrice(order.shippingWithTax, order.currencyCode) }}</span>
              </div>
              <div class="flex justify-between text-base font-medium text-gray-900 border-t border-gray-200 pt-3">
                <span>{{ t('account.total') }}</span>
                <span>{{ formatPrice(order.totalWithTax, order.currencyCode) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Information -->
        <div v-if="filteredPayments && filteredPayments.length > 0"
          class="mt-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-medium text-gray-900">{{ t('checkout.paymentInformation') }}</h2>
          </div>

          <!-- {{ order }} -->
          <div class="p-6">
            <div class="space-y-6">
              <div v-for="payment in filteredPayments" :key="payment.id" class="border border-gray-200 rounded-lg p-4">
                <!-- Basic Payment Info -->
                <div class="flex justify-between items-start mb-4">

                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ payment.method || t('orderDetail.standardPayment')
                    }}</p>
                    <p class="text-sm text-gray-500">{{ formatPaymentState(payment.state) }}</p>
                  </div>

                  <div class="text-sm text-gray-600 text-right">
                    <p v-if="payment.transactionId" class="break-all">{{ t('orderDetail.transaction') }}: {{
                      payment.transactionId }}</p>
                    <div class="break-all">{{ t('orderDetail.amount') }}: {{ formatPrice(payment.amount,
                      order.currencyCode) }}</div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Order Status & Actions -->
      <div class="space-y-6">
        <!-- Order Status -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">{{ t('orderDetail.orderStatus') }}</h3>
          <div class="space-y-3">
            <div class="flex items-center">
              <div :class="[
                'w-3 h-3 rounded-full mr-3',
                getStatusDotClass(order.state)
              ]"></div>
              <!-- <span class="text-sm text-gray-600">{{ formatOrderState(order.state) }}</span> -->
              <span :class="[
                'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                getOrderStatusClass(order.state)
              ]">
                {{ formatOrderState(order.state) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Back to Orders Button -->
    <div class="md:hidden mt-8">
      <button @click="$router.push('/account?tab=orders')"
        class="w-full inline-flex justify-center items-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        {{ t('orderDetail.backToOrders') }}
      </button>
    </div>
  </div>

  <!-- Error State -->
  <div v-else class="container mx-auto px-4 py-16 text-center">
    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <h3 class="mt-4 text-lg font-medium text-gray-900">{{ t('orderDetail.orderNotFound') }}</h3>
    <p class="mt-2 text-gray-500">{{ t('orderDetail.orderNotFoundDesc') }}</p>
    <div class="mt-6">
      <button @click="$router.push('/account')"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
        {{ t('orderDetail.backToAccount') }}
      </button>
    </div>
  </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getOrderByCodeQuery } from '../providers/shop/orders/order'
import { formatPrice } from '../utils'

export default {
  name: 'OrderDetail',

  setup() {
    const { t } = useI18n()
    const route = useRoute()
    const router = useRouter()

    const order = ref(null)
    const isLoading = ref(true)

    const loadOrder = async () => {
      try {
        const orderCode = route.params.code
        if (!orderCode) {
          router.push('/account')
          return
        }

        const orderData = await getOrderByCodeQuery(orderCode)
        if (orderData) {
          order.value = orderData
        } else {
          // Order not found
          order.value = null
        }
      } catch (error) {
        console.error('Error loading order details:', error)
        order.value = null
      } finally {
        isLoading.value = false
      }
    }

    const formatOrderDate = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const formatOrderState = (state) => {
      const stateMap = {
        'AddingItems': t('orderStatus.addingItems'),
        'ArrangingPayment': t('orderStatus.paymentPending'),
        'PaymentAuthorized': t('orderStatus.paymentAuthorized'),
        'PaymentSettled': t('orderStatus.paymentSettled'),
        'PartiallyShipped': t('orderStatus.partiallyShipped'),
        'Shipped': t('orderStatus.shipped'),
        'PartiallyDelivered': t('orderStatus.partiallyDelivered'),
        'Delivered': t('orderStatus.delivered'),
        'Cancelled': t('orderStatus.cancelled')
      }
      return stateMap[state] || state
    }

    const getOrderStatusClass = (state) => {
      const statusClasses = {
        'AddingItems': 'bg-yellow-100 text-yellow-800',
        'ArrangingPayment': 'bg-blue-100 text-blue-800',
        'PaymentAuthorized': 'bg-green-100 text-green-800',
        'PaymentSettled': 'bg-green-100 text-green-800',
        'PartiallyShipped': 'bg-purple-100 text-purple-800',
        'Shipped': 'bg-purple-100 text-purple-800',
        'PartiallyDelivered': 'bg-indigo-100 text-indigo-800',
        'Delivered': 'bg-indigo-100 text-indigo-800',
        'Cancelled': 'bg-red-100 text-red-800'
      }
      return statusClasses[state] || 'bg-gray-100 text-gray-800'
    }

    const getStatusDotClass = (state) => {
      const dotClasses = {
        'AddingItems': 'bg-yellow-400',
        'ArrangingPayment': 'bg-blue-400',
        'PaymentAuthorized': 'bg-green-400',
        'PaymentSettled': 'bg-green-400',
        'PartiallyShipped': 'bg-purple-400',
        'Shipped': 'bg-purple-400',
        'PartiallyDelivered': 'bg-indigo-400',
        'Delivered': 'bg-indigo-400',
        'Cancelled': 'bg-red-400'
      }
      return dotClasses[state] || 'bg-gray-400'
    }

    const formatPaymentState = (state) => {
      const stateMap = {
        'Created': t('orderDetail.paymentCreated'),
        'Authorized': t('orderDetail.paymentAuthorized'),
        'Settled': t('orderDetail.paymentSettled'),
        'Declined': t('orderDetail.paymentDeclined'),
        'Error': t('orderDetail.paymentError'),
        'Cancelled': t('orderDetail.paymentCancelled')
      }
      return stateMap[state] || state
    }

    // Computed property to filter payments
    const filteredPayments = computed(() => {
      if (!order.value?.payments) return []
      // Filter to show only Settled and Authorized payments in history
      return order.value.payments.filter(payment => payment.state === 'Settled' || payment.state === 'Authorized')
    })

    onMounted(() => {
      loadOrder()
    })

    return {
      t,
      order,
      isLoading,
      formatOrderDate,
      formatOrderState,
      getOrderStatusClass,
      getStatusDotClass,
      formatPaymentState,
      formatPrice,
      filteredPayments,
      router
    }
  }
}
</script>