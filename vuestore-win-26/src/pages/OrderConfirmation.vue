<template>
  <div class="order-confirmation">

    <!-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ -->


    <div class="container mx-auto px-4 py-16">
      <div class="text-center">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
          <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 class="mt-4 text-3xl font-bold text-gray-900">Order Confirmed!</h1>

        <div v-if="loading" class="mt-8">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p class="mt-4 text-gray-600">Loading...</p>
        </div>

        <div v-else-if="error" class="mt-8">
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <p class="text-red-800">Error loading order: {{ error.message }}</p>
          </div>
        </div>

        <div v-else-if="order" class="mt-8 max-w-2xl mx-auto">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Order Details</h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Order Information</h3>
                <div class="space-y-2">
                  <div class="flex justify-between">
                    <span class="text-gray-600">Order Number:</span>
                    <span class="font-medium text-gray-900">{{ order.code }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Status:</span>
                    <span class="font-medium text-gray-900 capitalize">{{ order.state.toLowerCase().replace('_', ' ') }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Total Amount:</span>
                    <span class="font-medium text-gray-900">{{ formatPrice(order.totalWithTax, order.currencyCode) }}</span>
                  </div>
                </div>
              </div>

              <div v-if="order.payments && order.payments.length > 0" class="bg-white rounded-lg shadow-sm border border-gray-200">
                <div class="px-6 py-4 border-b border-gray-200">
                  <h3 class="text-lg font-medium text-gray-900">Payment Information</h3>
                </div>
                <div class="p-6">
                  <div class="space-y-6">
                    <div
                      v-for="payment in order.payments"
                      :key="payment.id"
                      class="border border-gray-200 rounded-lg p-4"
                    >

                    {{ payment }}

                      <!-- Basic Payment Info -->
                      <div class="flex justify-between items-start mb-4">
                        <div>
                          <p class="text-sm font-medium text-gray-900">{{ payment.method || 'Standard Payment' }}</p>
                          <p class="text-sm text-gray-500">{{ formatPaymentState(payment.state) }}</p>
                        </div>
                        <div class="text-sm text-gray-600">
                          <p v-if="payment.transactionId" class="break-all">Transaction: {{ payment.transactionId }}</p>
                        </div>
                      </div>

                      <!-- Always show payment debug info -->
                      <div class="bg-yellow-50 p-3 rounded mb-4 border border-yellow-200">
                        <p class="text-sm font-medium text-gray-800 mb-2">Payment Debug Info:</p>
                        <pre class="text-xs text-gray-700 overflow-auto bg-white p-2 rounded border border-yellow-100">{{ JSON.stringify(payment, null, 2) }}</pre>
                      </div>

                      <!-- Additional Payment Details (for crypto payments like NowPayments) -->
                      <div v-if="payment.metadata" class="border-t border-gray-100 pt-4">
                        <div v-if="payment.metadata.public" class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <!-- Fiat Amount -->
                          <!-- <div v-if="payment.metadata.public.actually_paid_at_fiat > 0 || payment.metadata.public.price_amount">
                            <span class="text-gray-500">Amount (Fiat):</span>
                            <span class="ml-2 font-medium text-gray-900">
                              ${{ payment.metadata.public.actually_paid_at_fiat > 0 ?
                                payment.metadata.public.actually_paid_at_fiat.toFixed(2) :
                                parseFloat(payment.metadata.public.price_amount).toFixed(2) }}
                            </span>
                          </div> -->

                          <!-- Crypto Amount -->
                          <div v-if="payment.metadata.public.actually_paid">
                            <span class="text-gray-500">Amount (Crypto):</span>
                            <span class="ml-2 font-medium text-gray-900">
                              {{ payment.metadata.public.actually_paid }} {{ payment.metadata.public.price_currency }}
                            </span>
                          </div>

                          <!-- Payment Currency -->
                          <div v-if="payment.metadata.public.price_currency">
                            <span class="text-gray-500">Currency:</span>
                            <span class="ml-2 font-medium text-gray-900">
                              {{ payment.metadata.public.price_currency }}
                            </span>
                          </div>

                          <!-- Pay Address -->
                          <div v-if="payment.metadata.public.pay_address" class="md:col-span-2">
                            <span class="text-gray-500">Pay Address:</span>
                            <p class="mt-1 font-mono text-xs bg-gray-50 p-2 rounded break-all">
                              {{ payment.metadata.public.pay_address }}
                            </p>
                          </div>

                          <!-- Order ID -->
                          <div v-if="payment.metadata.public.order_id">
                            <span class="text-gray-500">Order ID:</span>
                            <span class="ml-2 font-medium text-gray-900">
                              {{ payment.metadata.public.order_id }}
                            </span>
                          </div>

                          <!-- Payment ID -->
                          <div v-if="payment.metadata.public.payment_id">
                            <span class="text-gray-500">Payment ID:</span>
                            <span class="ml-2 font-medium text-gray-900">
                              {{ payment.metadata.public.payment_id }}
                            </span>
                          </div>

                          <!-- Purchase ID -->
                          <div v-if="payment.metadata.public.purchase_id">
                            <span class="text-gray-500">Purchase ID:</span>
                            <span class="ml-2 font-medium text-gray-900">
                              {{ payment.metadata.public.purchase_id }}
                            </span>
                          </div>

                          <!-- Invoice ID -->
                          <div v-if="payment.metadata.public.invoice_id">
                            <span class="text-gray-500">Invoice ID:</span>
                            <span class="ml-2 font-medium text-gray-900">
                              {{ payment.metadata.public.invoice_id }}
                            </span>
                          </div>

                          <!-- Status -->
                          <div v-if="payment.metadata.public.status">
                            <span class="text-gray-500">Status:</span>
                            <span :class="[
                              'ml-2 font-medium',
                              payment.metadata.public.status === 'finished' ? 'text-green-600' : 'text-yellow-600'
                            ]">
                              {{ payment.metadata.public.status }}
                            </span>
                          </div>
                        </div>
                        <div v-else class="bg-yellow-50 p-2 rounded border border-yellow-200">
                          <p class="text-xs text-gray-600">payment.metadata exists but payment.metadata.public is undefined</p>
                          <pre class="text-xs text-gray-500 mt-1">Raw metadata: {{ JSON.stringify(payment.metadata) }}</pre>
                        </div>
                      </div>
                       <div v-else class="text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-200">
                         No metadata field on payment object
                       </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-gray-500">
                No payment information available
              </div>
            </div>

            <div class="mt-6">
              <h3 class="text-lg font-medium text-gray-900 mb-3">Order Items</h3>
              <div class="space-y-3">
                <div
                  v-for="line in order.lines"
                  :key="line.id"
                  class="flex items-center justify-between py-3 border-b border-gray-100"
                >
                  <div class="flex items-center space-x-3">
                    <div class="flex-shrink-0 w-12 h-12 border border-gray-200 rounded-md overflow-hidden">
                      <img
                        v-if="line.featuredAsset"
                        :src="line.featuredAsset.preview"
                        :alt="line.productVariant.name"
                        class="w-full h-full object-center object-cover"
                      />
                    </div>
                    <div>
                      <h4 class="text-sm font-medium text-gray-900">{{ line.productVariant.name }}</h4>
                      <p class="text-sm text-gray-500">Quantity: {{ line.quantity }}</p>
                    </div>
                  </div>
                  <div class="text-sm font-medium text-gray-900">
                    {{ formatPrice(line.linePriceWithTax, order.currencyCode) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-8">
            <router-link
              to="/"
              class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Continue Shopping
            </router-link>
          </div>
        </div>

        <div v-else class="mt-8">
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p class="text-yellow-800">Order not found</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { formatPrice } from '../utils'
import { getOrderByCodeQuery } from '../providers/shop/orders/order'

export default {
  name: 'OrderConfirmation',
  setup() {
    const route = useRoute()
    const orderCode = route.params.code
    const order = ref(null)
    const loading = ref(true)
    const error = ref(null)

    const loadOrder = async () => {
      try {
        loading.value = true
        const orderData = await getOrderByCodeQuery(orderCode)
        order.value = orderData

        // Debug: Check payment data
        console.log('OrderConfirmation - Order loaded:', orderData)
        console.log('OrderConfirmation - Payments:', orderData?.payments)
        if (orderData?.payments && orderData.payments.length > 0) {
          console.log('OrderConfirmation - First payment metadata:', orderData.payments[0].metadata)
        }
      } catch (err) {
        console.error('Error loading order:', err)
        error.value = err
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      if (orderCode) {
        loadOrder()
      }
    })

    return {
      order,
      loading,
      error,
      formatPrice
    }
  }
}
</script>

<style scoped>
.order-confirmation {
  min-height: 60vh;
}
</style>