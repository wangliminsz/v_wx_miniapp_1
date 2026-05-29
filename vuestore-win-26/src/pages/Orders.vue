<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Page Header with Back Button -->
    <div class="mb-8">
      <div class="flex items-center justify-between mb-2">
        <h1 class="text-3xl font-bold text-gray-900">Unsettled Orders</h1>
        <router-link to="/"
          class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Back
        </router-link>
      </div>
      <p class="text-sm text-gray-600">Please choose to continue payment or cancel the order</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-4 text-gray-600">Loading...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
      <div v-if="!loading">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Error Loading Orders</h3>
            <p class="text-sm text-red-700 mt-1">{{ error }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="unsettledOrders.length === 0" class="text-center py-12">
      <div v-if="!loading">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No unsettled orders</h3>
        <p class="mt-1 text-sm text-gray-500">All your orders have been completed.</p>
      </div>
    </div>

    <!-- Orders List -->
    <div v-else class="space-y-4">
      <div v-if="!loading">
        <div v-for="order in unsettledOrders" :key="order.id" :class="[
          'mb-5 shadow overflow-hidden sm:rounded-lg border-2',
          order.active ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-200'
        ]">
          <!-- Order Header (Click to toggle) -->
          <div class="px-4 py-4 sm:px-6 cursor-pointer" @click="toggleOrder(order.code)">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-center space-x-4">
                <!-- Fold/Unfold Icon -->
                <div class="text-gray-400">
                  <svg v-if="!expandedOrders[order.code]" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd"
                      d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                      clip-rule="evenodd" />
                  </svg>
                  <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                      clip-rule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div class="flex items-center space-x-2">
                    <h3 class="text-lg leading-6 font-medium text-gray-900">
                      Order #{{ order.code }}
                    </h3>
                    <span v-if="order.active"
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Active
                    </span>
                  </div>
                  <p class="mt-1 max-w-2xl text-sm text-gray-500">
                    Status: <span :class="getStatusColor(order.state)" class="font-medium">{{ getStatusText(order.state)
                    }}</span>
                  </p>
                </div>
              </div>
              <div class="mt-2 sm:mt-0 sm:text-right text-right">
                <p class="text-lg font-medium text-gray-900">
                  {{ formatPrice(order.totalWithTax, order.currencyCode) }}
                </p>
                <!-- <p v-if="order.payments && order.payments.length > 0" class="text-xs text-gray-500 mt-1">
                   Payment: {{ order.payments[order.payments.length - 1].method }}
                 </p> -->
              </div>
            </div>
          </div>

          <!-- Order Details (Expanded) -->
          <transition name="slide">
            <div v-if="expandedOrders[order.code]" class="border-t border-gray-200 px-4 py-5 sm:px-6">
              <!-- Order Items -->
              <div class="mb-2">
                <div class="flex justify-between items-center mr-2 mb-6">
                  <div>
                    <h4 class="text-md font-medium text-gray-900 mb-3">Order Items</h4>
                  </div>

                  <!-- Only show action buttons for non-PaymentAuthorized orders (e.g., ArrangingPayment) -->
                  <div v-if="order.state !== 'PaymentAuthorized'" class="flex justify-end space-x-3">
                    <button @click="handleActivate(order.code)"
                      class="bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
                      :disabled="order.isActivating">
                      <svg v-if="!order.isActivating" class="w-4 h-4 mr-2" fill="none" stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <svg v-else class="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                        </circle>
                        <path class="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                        </path>
                      </svg>
                      Re-pay
                    </button>

                  </div>

                </div>



                <div class="bg-gray-50 rounded-lg p-4">
                  <div v-if="!order.lines || order.lines.length === 0" class="text-sm text-gray-500">
                    No items found
                  </div>
                  <div v-else class="space-y-3">
                    <div v-for="line in order.lines" :key="line.id"
                      class="flex items-center py-2 border-b border-gray-200 last:border-b-0">
                      <!-- Product Thumbnail -->
                      <div v-if="line.featuredAsset" class="flex-shrink-0 w-12 h-12 mr-3">
                        <img :src="line.featuredAsset.preview" :alt="line.productVariant.name"
                          class="w-full h-full object-cover rounded-md border border-gray-200">
                      </div>
                      <div v-else
                        class="flex-shrink-0 w-12 h-12 mr-3 bg-gray-200 rounded-md border border-gray-200 flex items-center justify-center">
                        <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>

                      <div class="flex-1">
                        <div class="text-sm font-medium text-gray-900">
                          {{ line.productVariant.name }}
                        </div>
                        <div class="text-xs text-gray-500">
                          SKU: {{ line.productVariant.sku }}
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="text-sm text-gray-900">
                          Qty: {{ line.quantity }}
                        </div>
                        <div class="text-sm font-medium text-gray-900">
                          {{ formatPrice(line.linePriceWithTax, order.currencyCode) }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Shipping Information -->
              <div
                v-if="order.shippingLines && order.shippingLines.length > 0 && order.shippingLines[0].priceWithTax > 0"
                class="mt-4">
                <div class="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-md">
                  <span class="text-sm font-medium text-gray-700">Shipping:</span>
                  <span class="text-sm text-gray-900">{{ formatPrice(order.shippingLines[0].priceWithTax,
                    order.currencyCode) }}</span>
                </div>
              </div>

              <div class="mb-6"></div>

              <!-- Payment History -->
              <div v-if="order.payments && order.payments.length > 0" class="mb-6">
                <h4 class="text-md font-medium text-gray-900 mb-3">Payment History</h4>
                <div class="space-y-3">
                  <div v-for="payment in order.payments" :key="payment.id"
                    class="border border-gray-200 rounded-md p-3 bg-gray-50">
                    <div class="flex justify-between items-center">
                      <span class="text-sm font-medium text-gray-700">Payment Method:</span>
                      <span class="text-sm text-gray-900">{{ payment.method || 'Payment' }}</span>
                    </div>
                    <div class="flex justify-between items-center mt-2">
                      <span class="text-sm font-medium text-gray-700">Status:</span>
                      <span :class="[
                        'text-xs px-2 py-1 rounded',
                        payment.state === 'Settled' ? 'bg-green-100 text-green-800' :
                          payment.state === 'Authorized' ? 'bg-blue-100 text-blue-800' :
                            payment.state === 'PaymentSettled' ? 'bg-green-100 text-green-800' :
                              'bg-yellow-100 text-yellow-800'
                      ]">{{ payment.state }}</span>
                    </div>
                    <div v-if="payment.transactionId" class="flex justify-between items-center mt-2">
                      <span class="text-sm font-medium text-gray-700">Transaction ID:</span>
                      <span class="text-sm text-gray-900">{{ payment.transactionId }}</span>
                    </div>
                    <div v-if="payment.amount && (payment.state === 'Settled' || payment.state === 'Authorized')"
                      class="flex justify-between items-center mt-2">
                      <span class="text-sm font-medium text-gray-700">Amount:</span>
                      <span class="text-sm text-gray-900">{{ formatPrice(payment.amount, order.currencyCode) }}</span>
                      <!-- <span v-if="payment.state === 'Authorized'" class="text-xs text-yellow-600 ml-1">(Pending)</span> -->
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex justify-between items-start pt-4 border-t border-gray-200">



                <div>
                  <button @click="handleCancel(order.code)"
                    class="border border-gray-400 text-gray-600 hover:text-gray-800 px-4 py-2 rounded-md text-sm font-medium flex items-center transition-colors duration-200">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel Order
                  </button>
                </div>

                <button @click="handleBackHomepage()"
                  class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:text-gray-900 transition-colors duration-200">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Back
                </button>



              </div>


            </div>
          </transition>
        </div>
      </div>
    </div>


    <!-- Success/Error Modal -->
    <div v-if="showSuccessModal" class="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog"
      aria-modal="true">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div
          class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div
                class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10"
                :class="successTitle === 'Order Activated' || successTitle === 'Order Cancelled' ? 'bg-green-100' : 'bg-red-100'">
                <svg v-if="successTitle === 'Order Activated' || successTitle === 'Order Cancelled'"
                  class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <svg v-else class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  {{ successTitle }}
                </h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-500">
                    {{ successMessage }}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button @click="closeSuccessModal" type="button"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm bg-blue-600 hover:bg-blue-700 focus:ring-blue-500">
              OK
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Cancel Confirmation Modal -->
    <div v-if="showCancelModal" class="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog"
      aria-modal="true">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div
          class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div
                class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Cancel Order
                </h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-500">
                    Are you sure you want to cancel order <span class="font-semibold">{{ orderToCancel }}</span>? This
                    action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button @click="confirmCancel" type="button"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm">
              Cancel Order
            </button>
            <button @click="closeCancelModal" type="button"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
              Keep Order
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import { getUnsettledOrdersQuery, cancelMyOrderMutation, getOrderByCodeQuery, reactivateOrderMutation } from '../providers/shop/orders/order'
import { getActiveOrderQuery } from '../providers/shop/orders/order'
import { formatPrice } from '../utils'

const ONE_HOUR_MS = 60 * 60 * 1000

export default {
  name: 'Orders',
  setup() {
    const router = useRouter()
    const appStore = useAppStore()
    const unsettledOrders = ref([])
    const loading = ref(false)
    const error = ref('')
    const expandedOrders = ref({})
    const showCancelModal = ref(false)
    const orderToCancel = ref('')
    const showSuccessModal = ref(false)
    const successTitle = ref('')
    const successMessage = ref('')
    const countdownIntervals = ref({})

    // Toggle order expansion
    const toggleOrder = (orderCode) => {
      expandedOrders.value[orderCode] = !expandedOrders.value[orderCode]
    }

    // Check if order is expanded
    const isExpanded = (orderCode) => {
      return !!expandedOrders.value[orderCode]
    }

    // Fetch unsettled orders
    const fetchUnsettledOrders = async () => {
      if (!appStore.isLoggedIn) {
        error.value = 'Please log in to view your orders'
        return
      }

      loading.value = true
      error.value = ''

      try {
        // console.log('📋 Fetching unsettled orders...')
        const result = await getUnsettledOrdersQuery()
        // console.log('📋 Orders fetched:', result)

        // Log all raw orders to see if our target order is in the response
        if (result && result.items) {
          // console.log('📋 Raw orders from API:', result.items.map(o => ({
          //   code: o.code,
          //   state: o.state,
          //   id: o.id
          // })))

          // Check if our target order is in the raw data
          const targetOrder = result.items.find(o => o.code === 'MXBZ5HDSELDA6DM6')
          // if (targetOrder) {
          //   // console.log('✅ Target order MXBZ5HDSELDA6DM6 found in raw data:', targetOrder)
          // } else {
          //   // console.log('❌ Target order MXBZ5HDSELDA6DM6 NOT found in raw data')
          // }

          // Separate active order from other orders
          const activeOrderCode = appStore.activeOrder?.code
          let activeOrder = null
          let inactiveOrders = []

          result.items.forEach(order => {
            if (order.active) {
              // This is the active order
              activeOrder = order
            } else if (order.state?.toLowerCase() === 'arrangingpayment') {
              // These are inactive orders in unsettled states (PaymentAuthorized orders are considered paid)
              inactiveOrders.push(order)
            }
          })

          // Combine active order (if exists) with inactive orders
          // Active order goes first, then sort inactive orders by ID descending
          let allOrders = []
          if (activeOrder) {
            allOrders.push(activeOrder)
            // console.log('📋 Active order included:', activeOrder.code, 'State:', activeOrder.state)
          }

          // Sort inactive orders by ID descending (newest first)
          const sortedInactiveOrders = inactiveOrders.sort((a, b) => parseInt(b.id) - parseInt(a.id))
          allOrders = allOrders.concat(sortedInactiveOrders)

          unsettledOrders.value = allOrders

          // console.log('📋 All orders to display:', allOrders.map(o => ({
          //   code: o.code,
          //   state: o.state,
          //   active: o.active
          // })))

          // Auto-expand the first order if it's the active order or if there are no other orders
          if (allOrders.length > 0) {
            const firstOrder = allOrders[0]
            // Auto-expand if it's the active order or if it's the only order
            if (firstOrder.active || allOrders.length === 1) {
              expandedOrders.value[firstOrder.code] = true
              // console.log('📋 Auto-expanded first order:', firstOrder.code)
            }
          }
        } else {
          // console.log('⚠️ No items in result:', result)
          unsettledOrders.value = []
        }
      } catch (err) {
        console.error('❌ Error fetching orders:', err)
        error.value = err.message || 'Failed to fetch orders'
        unsettledOrders.value = []
      } finally {
        loading.value = false
      }
    }

    // Get status color based on state
    const getStatusColor = (state) => {
      switch (state) {
        case 'PaymentAuthorized':
          return 'text-blue-600'
        case 'ArrangingPayment':
          return 'text-yellow-600'
        case 'PaymentSettled':
          return 'text-green-600'
        case 'Cancelled':
          return 'text-red-600'
        default:
          return 'text-gray-600'
      }
    }


    // Handle activate action - simplified logic: check if order is active order
    const handleActivate = async (orderCode) => {
      // console.log("🔄 Activate clicked for order:", orderCode)

      // Find the order and set isActivating to true
      const order = unsettledOrders.value.find(o => o.code === orderCode)
      if (order) {
        order.isActivating = true
      }

      try {
        // Check the active order state
        const activeOrder = await getActiveOrderQuery()
        // console.log("📋 Current active order:", activeOrder)

        // Case 1: This order is already the active order - redirect to payment page
        if (activeOrder && activeOrder.code === orderCode) {
          // console.log("✓ Order is already active, navigating to payment page")
          if (order) {
            order.isActivating = false
          }
          router.push('/checkout/payment')
          return
        }

        // Case 2: A different active order exists - show error modal
        if (activeOrder) {
          console.log("✋ Different active order exists, cannot activate")
          successTitle.value = 'Cannot Activate Order'
          successMessage.value = 'Already have an active order, please finish it first'
          showSuccessModal.value = true
          return
        }

        // Case 3: No active order - should not happen for unsettled orders, but just in case
        console.error("❌ No active order found - this should not happen for unsettled orders")
        successTitle.value = 'Cannot Activate Order'
        successMessage.value = 'Order cannot be activated. Please contact support.'
        showSuccessModal.value = true

      } catch (error) {
        console.error('❌ Error in handleActivate:', error)
        successTitle.value = 'Activation Failed'
        successMessage.value = 'Failed to activate order. Please try again.'
        showSuccessModal.value = true
      } finally {
        // Always set isActivating back to false
        if (order) {
          order.isActivating = false
        }
      }
    }

    // Handle cancel action with confirmation
    const handleCancel = (orderCode) => {
      console.log("❌ Cancel clicked for order:", orderCode)
      orderToCancel.value = orderCode
      showCancelModal.value = true
    }

    // Close cancel modal
    const closeCancelModal = () => {
      showCancelModal.value = false
      orderToCancel.value = ''
    }

    // Confirm cancel order
    const confirmCancel = async () => {
      const orderCode = orderToCancel.value
      console.log("Order cancellation confirmed for:", orderCode)

      try {
        showCancelModal.value = false

        const result = await cancelMyOrderMutation(orderCode)
        console.log('✓ Order cancelled successfully:', result)

        // Check if the cancelled order was the first one (expanded)
        const wasFirstOrder = unsettledOrders.value.length > 0 && unsettledOrders.value[0].code === orderCode

        // Remove cancelled order from the list
        unsettledOrders.value = unsettledOrders.value.filter(order => order.code !== orderCode)

        // If the cancelled order was the first one, expand the new first order
        if (wasFirstOrder && unsettledOrders.value.length > 0) {
          expandedOrders.value = {}
          expandedOrders.value[unsettledOrders.value[0].code] = true
          console.log('📋 Auto-expanded new first order:', unsettledOrders.value[0].code)
        }

        // Clear the order code
        orderToCancel.value = ''

        // Show success message
        successTitle.value = 'Order Cancelled'
        successMessage.value = `Order ${orderCode} has been cancelled successfully.`
        showSuccessModal.value = true
      } catch (error) {
        console.error('❌ Error cancelling order:', error)
        orderToCancel.value = ''

        // Show error message
        successTitle.value = 'Cancellation Failed'
        successMessage.value = `Failed to cancel order ${orderCode}. Please try again.`
        showSuccessModal.value = true
      }
    }

    // Close success modal
    const closeSuccessModal = () => {
      // Check what type of success before clearing
      const wasActivationSuccess = successTitle.value === 'Order Activated'
      const wasCancellationSuccess = successTitle.value === 'Order Cancelled'

      showSuccessModal.value = false
      successTitle.value = ''
      successMessage.value = ''

      // If activation was successful, redirect to homepage and open cart
      if (wasActivationSuccess) {
        console.log('✓ Redirecting to homepage and opening cart after successful activation')
        // First open the cart
        appStore.toggleCart()
        // Then redirect to homepage (cart will stay open)
        router.push('/')
      } else if (wasCancellationSuccess) {
        // After successful cancellation, refresh the unsettled orders list
        // This ensures the Header.vue badge updates correctly
        console.log('🔄 Refreshing unsettled orders list after cancellation')
        fetchUnsettledOrders()
      }
    }

    // Get user-friendly status text
    const getStatusText = (state) => {
      switch (state) {
        case 'AddingItems':
          return 'Cart'
        case 'ArrangingPayment':
          return 'Payment Pending'
        case 'PaymentAuthorized':
          return 'Payment Authorized'
        case 'PaymentSettled':
          return 'Payment Completed'
        case 'PartiallyShipped':
          return 'Partially Shipped'
        case 'Shipped':
          return 'Shipped'
        case 'Cancelled':
          return 'Cancelled'
        default:
          return state
      }
    }

    onMounted(() => {
      fetchUnsettledOrders()
    })

    const handleBackHomepage = () => {
      router.push("/")
    }


    return {
      unsettledOrders,
      loading,
      error,
      expandedOrders,
      showCancelModal,
      orderToCancel,
      showSuccessModal,
      successTitle,
      successMessage,
      toggleOrder,
      isExpanded,
      formatPrice,
      getStatusColor,
      handleActivate,
      handleCancel,
      closeCancelModal,
      confirmCancel,
      closeSuccessModal,
      getStatusText,
      handleBackHomepage,
    }
  }
}
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-enter-from {
  opacity: 0;
  max-height: 0;
}

.slide-enter-to {
  opacity: 1;
  max-height: 1000px;
}

.slide-leave-from {
  opacity: 1;

  .slide-leave-to {
    opacity: 0;
    max-height: 0;
  }
}
</style>
