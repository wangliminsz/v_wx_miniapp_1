<template>
  <div>
    <!-- Loading State -->
    <div v-if="isInitialLoading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">{{ t('common.loading') }}</p>
      </div>
    </div>

    <div v-else-if="appStore.activeOrder?.id" class="bg-gray-50 pb-16">
      <div class="max-w-7xl mx-auto pt-8 mb-12 px-4 sm:px-6 lg:px-8">
        <h2 class="sr-only">{{ t('checkout.shipping') }}</h2>

        <!-- Checkout Steps Navigation -->
        <nav class="hidden sm:block pb-8 mb-8 border-b">
          <ol class="flex space-x-4 justify-center">
            <li class="flex items-center">
              <span class="text-sm font-medium text-primary-600">{{ t('checkout.shipping') }}</span>
              <span class="ml-4 text-gray-300">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </li>
            <li class="flex items-center">
              <!-- <router-link to="/checkout/payment"
                class="text-sm font-medium text-gray-500 hover:text-primary-500 transition-colors">
                {{ t('checkout.payment') }}
              </router-link> -->

              <span class="text-sm font-medium text-gray-500 hover:text-primary-500 transition-colors">
                {{ t('checkout.payment') }}
              </span>

              <span class="ml-4 text-gray-300">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </li>
            <li class="flex items-center">
              <span class="text-sm font-medium text-gray-500">{{ t('checkout.confirmation') }}</span>
            </li>
          </ol>
        </nav>

        <div class="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">

          <!-- Order Summary -->
          <div class="mt-0 lg:mt-0">

            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-medium text-gray-900">{{ t('checkout.orderSummary') }}</h2>
              <span v-if="appStore.activeOrder?.code" class="text-sm text-gray-500">{{ t('orderDetail.orderNumber') }}{{ appStore.activeOrder.code }}</span>
            </div>
            <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <!-- Cart Contents -->
              <div class="space-y-4 mb-6">
                <div v-for="line in appStore.activeOrder?.lines || []" :key="line.id">
                  <div class="flex items-start space-x-4">
                    <div class="flex-shrink-0 w-16 h-16 border border-gray-200 rounded-md overflow-hidden">
                      <img v-if="line.featuredAsset" :src="line.featuredAsset.preview" :alt="line.productVariant.name"
                        class="w-full h-full object-center object-cover" />
                    </div>
                    <div class="flex-1">
                      <h4 class="text-sm font-medium text-gray-900">{{ line.productVariant.name }}</h4>
                    </div>
                  </div>
                  <div class="mt-2 flex flex-col space-y-1 sm:hidden">
                    <div class="mt-2 flex flex-row justify-between mr-2">
                      <p class="text-sm text-gray-500">{{ t('checkout.qty') }} {{ line.quantity }}</p>
                      <div class="text-sm font-medium text-gray-900">
                        {{ formatPrice(line.linePriceWithTax, appStore.activeOrder?.currencyCode) }}
                      </div>
                    </div>
                  </div>
                  <div class="hidden sm:flex items-center justify-between mt-2 mr-2 space-x-4">
                    
                      <p class="text-sm text-gray-500">{{ t('checkout.qty') }} {{ line.quantity }}</p>
                      <div class="text-sm font-medium text-gray-500">
                        {{ formatPrice(line.linePriceWithTax, appStore.activeOrder?.currencyCode) }}
                      </div>
                    
                  </div>
                </div>
              </div>

              <!-- Order Totals -->
              <div class="border-t border-gray-200 pt-4 space-y-2">
                <div class="flex justify-between text-sm text-gray-600">
                  <span>{{ t('cart.subtotal') }}</span>
                  <span>{{ formatPrice(appStore.activeOrder?.subTotalWithTax, appStore.activeOrder?.currencyCode)
                  }}</span>
                </div>
                <div class="flex justify-between text-sm text-gray-600">
                  <span>{{ t('cart.shipping') }}</span>
                  <span>
                    {{ isShippingDataLoaded ? (selectedShippingMethod ? formatPrice(selectedShippingMethod.priceWithTax,
                      appStore.activeOrder?.currencyCode) : t('checkout.selectShippingMethod')) :
                      t('checkout.loadingShippingMethods') }}
                  </span>
                </div>
                <div class="flex justify-between text-base font-medium text-gray-900 border-t border-gray-200 pt-2">
                  <span>{{ t('account.total') }}</span>
                  <span v-html="formattedTotal"></span>
                </div>
              </div>
            </div>

            <!-- Proceed to Payment Button -->
            <div class="mt-5 lg:mt-20 mb-10 lg:mb-0">
              <div class="relative group">
                <button @click="proceedToPayment" :disabled="!isShippingFormValid || isProceedingToPayment" :class="[
                  'flex w-full items-center justify-center space-x-2 mt-12 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-300',
                  isShippingFormValid && !isProceedingToPayment
                    ? 'bg-primary-600 hover:bg-primary-700'
                    : 'bg-gray-400 cursor-not-allowed'
                ]">
                  <!-- Loading Spinner -->
                  <svg v-if="isProceedingToPayment" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                    </path>
                  </svg>
                  <!-- Arrow Icon -->
                  <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <span>{{ isProceedingToPayment ? t('checkout.processing') : (isShippingFormValid ?
                    t('checkout.proceed') : t('checkout.completeShipping')) }}</span>
                </button>

                <!-- Tooltip for disabled button -->
                <div v-if="!isShippingFormValid"
                  class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-10">
                  {{ !hasShippingAddress ? t('checkout.addShippingAddress') : t('checkout.selectShippingMethod') }}
                  <div
                    class="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900">
                  </div>
                </div>
              </div>
            </div>

            <!-- Payment History -->
            <div v-if="payments && payments.length > 0" class="mt-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">{{ t('checkout.paymentHistory') }}</h3>
              <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div class="space-y-4">
                  <!-- Individual Payments -->
                  <div v-for="(payment, index) in payments" :key="payment.id || index"
                    class="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div class="flex items-center space-x-3">
                      <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <div>
                        <p class="text-sm font-medium text-gray-900">
                          {{ payment.method || t('checkout.payment') }}
                        </p>
                        <p class="text-xs text-gray-500">
                          {{ formatPaymentState(payment.state) }}
                          <span v-if="payment.transactionId"> • {{ payment.transactionId.substring(0, 8) }}...</span>
                        </p>
                      </div>
                    </div>
                    <div class="text-right">
                      <p v-if="payment.amount" class="text-sm font-medium text-gray-900">
                        {{ formatPrice(payment.amount,
                          appStore.activeOrder?.currencyCode) }}
                      </p>
                      <!-- <p v-if="payment.metadata?.public?.actually_paid_at_fiat > 0" class="text-sm font-medium text-gray-900">
                        {{ formatPrice(payment.metadata.public.actually_paid_at_fiat * 100, appStore.activeOrder?.currencyCode) }}
                      </p> -->
                      <!-- <p v-else-if="payment.metadata?.public?.price_amount" class="text-sm font-medium text-gray-900">
                        {{ formatPrice(parseFloat(payment.metadata.public.price_amount) * 100, appStore.activeOrder?.currencyCode) }}
                      </p> -->
                      <!-- <p v-else class="text-sm text-gray-500">Amount not available</p> -->
                      <!-- <p v-if="payment.metadata?.public?.price_currency" class="text-xs text-gray-500">
                        {{ payment.metadata.public.price_currency }}
                      </p> -->
                    </div>
                  </div>
                </div>

                <!-- Payment Summary -->
                <div class="mt-6 pt-4 border-t border-gray-200 space-y-2">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">{{ t('checkout.totalPaid') }}</span>
                    <span :class="totalPaid > 0 ? 'text-green-600 font-medium' : 'text-gray-500'">
                      {{ formatPrice(totalPaid, appStore.activeOrder?.currencyCode) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Shipping Content -->
          <div>
            <!-- <div>
              <h2 class="text-lg font-medium text-gray-900">{{ t('checkout.contactInformation') }}</h2>
              <form>
                <div class="mt-4">
                  <div class="mt-1">
                    <input type="email" v-model="customer.emailAddress" :disabled="isArrangingPayment"
                      class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed" />
                  </div>
                </div>
                <div class="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">


                  <div>
                    <label class="block text-sm font-medium text-gray-700">{{ t('account.lastName') }}</label>
                    <div class="mt-1">
                      <input type="text" v-model="customer.lastName" :disabled="isArrangingPayment"
                        class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed" />
                    </div>
                  </div>

                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700">{{ t('account.firstName') }}</label>
                    <div class="mt-1">
                      <input type="text" v-model="customer.firstName" :disabled="isArrangingPayment"
                        class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed" />
                    </div>
                  </div>

                  
                </div>
              </form>
            </div> -->

            <div class="">
              <div class="flex justify-between items-center">
                <h2 class="text-lg font-medium text-gray-900">{{ t('checkout.shippingAddress') }}</h2>
                <div class="flex items-center space-x-6">
                  <!-- Address Selection Dropdown -->
                  <div v-if="hasMultipleAddresses" class="flex items-center space-x-2">
                    <!-- <label class="text-sm font-medium text-gray-700">Select Address:</label> -->
                    <select v-model="selectedAddressId" @change="selectAddress(selectedAddressId)"
                      class="block w-56 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                      <option value="">{{ t('checkout.chooseAddress') }}</option>
                      <option v-for="address in customerAddresses" :key="address.id" :value="address.id">
                        {{ address.fullName }} - {{ address.city }}
                      </option>
                    </select>
                  </div>
                  <div class="relative group">
                    <!-- <button
                        @click="showAddressModal = true"
                        :disabled="isArrangingPayment"
                        :class="[
                          'inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-300',
                          isArrangingPayment
                            ? 'bg-gray-400 cursor-not-allowed'
                            : hasShippingAddress
                              ? 'bg-primary-600 hover:bg-primary-700'
                              : 'bg-primary-600 hover:bg-primary-700 animate-pulse-slow'
                        ]"
                      >
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                        {{ hasShippingAddress ? 'Add' : 'Add Address' }}
                      </button> -->

                    <!-- Tooltip -->
                    <div v-if="!hasShippingAddress && !isArrangingPayment"
                      class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-10">
                      {{ t('checkout.addShippingAddressToContinue') }}
                      <div
                        class="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900">
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Shipping Address Display -->
            <!-- ------- {{ shippingAddress }} -->
            <div class="mt-4 bg-gray-50 rounded-lg p-6 border border-gray-200">
              <!-- Loading state -->
              <div v-if="isAddressLoading" class="text-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p class="mt-2 text-gray-600">{{ t('common.loading') }}</p>
              </div>

              <div v-else-if="hasShippingAddress" class="space-y-4">
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label class="block text-sm font-medium text-gray-700">{{ t('account.fullName') }}</label>
                    <div class="mt-1 text-sm text-gray-900">{{ shippingAddress.fullName }}</div>
                  </div>

                  <div class="sm:col-span-2">
                    <label class="block text-sm font-medium text-gray-700">{{ t('account.address') }}</label>
                    <div class="mt-1 text-sm text-gray-900">{{ shippingAddress.streetLine1 }}</div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700">{{ t('account.country') }}</label>
                    <div class="mt-1 text-sm text-gray-900">{{ getCountryName(shippingAddress.countryCode) }}</div>
                  </div>

                  <div class="sm:col-span-2">
                    <label class="block text-sm font-medium text-gray-700">{{ t('account.phone') }}</label>
                    <div class="mt-1 text-sm text-gray-900">{{ shippingAddress.phoneNumber }}</div>
                  </div>
                </div>
              </div>

              <div v-else class="text-center py-8 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
                <svg class="mx-auto h-12 w-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 class="mt-2 text-sm font-medium text-blue-800">{{ t('checkout.shippingAddressRequired') }}</h3>
                <p class="mt-1 text-sm text-blue-600">{{ t('checkout.pleaseAddShippingAddress') }}</p>
                <button @click="router.push('/account?tab=addresses')"
                  class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 animate-pulse-slow">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  {{ t('checkout.addShippingAddress') }}
                </button>
              </div>
            </div>

            <!-- Delivery Method Section -->
            <div v-if="hasShippingAddress" class="mt-10 border-t border-gray-200 pt-10">
              <h2 class="text-lg font-medium text-gray-900 mb-6">{{ t('checkout.deliveryMethod') }}</h2>

              <!-- Loading state -->
              <div v-if="eligibleShippingMethods.length === 0" class="text-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p class="mt-2 text-gray-600">{{ t('checkout.loadingShippingMethods') }}</p>
              </div>

              <!-- Delivery Method Options - Simplified Qwik-style cards -->
              <div v-else class="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                <div v-for="method in eligibleShippingMethods" :key="method.id" :class="[
                  'relative bg-white border rounded-lg shadow-sm p-4 flex focus:outline-none',
                  isArrangingPayment
                    ? 'border-gray-300 cursor-not-allowed opacity-50'
                    : selectedShippingMethod?.id === method.id
                      ? 'border-primary-500 border-2 cursor-pointer'
                      : 'border-gray-300 cursor-pointer hover:border-gray-400'
                ]" @click="!isArrangingPayment && selectShippingMethod(method)">
                  <span class="flex-1 flex">
                    <span class="flex flex-col">
                      <span class="block text-sm font-medium text-gray-900">{{ method.name }}</span>
                      <span class="mt-6 text-sm font-medium text-gray-900">
                        {{ formatPrice(method.priceWithTax, appStore.activeOrder?.currencyCode) }}
                      </span>
                    </span>
                  </span>

                  <!-- Checkmark for selected method -->
                  <div v-if="selectedShippingMethod?.id === method.id" class="flex-shrink-0">
                    <svg class="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd" />
                    </svg>
                  </div>

                  <!-- Border highlight for selected method -->
                  <span :class="[
                    'border-2 absolute -inset-px rounded-lg pointer-events-none',
                    selectedShippingMethod?.id === method.id ? 'border-primary-500' : ''
                  ]"></span>
                </div>
              </div>

            </div>

          </div>



        </div>

      </div>
    </div>

    <!-- Empty Cart State -->
    <div v-else class="container mx-auto px-4 py-16 text-center">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5.5M7 13l2.5 5.5m0 0L17 21" />
      </svg>
      <h3 class="mt-4 text-lg font-medium text-gray-900">{{ t('cart.emptyCart') }}</h3>
      <p class="mt-2 text-gray-500">{{ t('cart.startShopping') }}</p>
      <div class="mt-6">
        <router-link to="/"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
          {{ t('cart.continueShopping') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '../stores/app'
import { formatPrice } from '../utils'
import { COUNTRIES, getCountryName } from '../config/countries'
import { createCustomerAddressMutation } from '../providers/shop/customer/customer'
import { getEligibleShippingMethodsQuery, getActiveOrderShippingAddressQuery } from '../providers/shop/checkout/checkout'
import { getActiveOrderQuery, getOrderByCodeQuery } from '../providers/shop/orders/order'
import {
  setOrderShippingMethodMutation,
  setOrderShippingAddressMutation,
  transitionToArrangingPaymentMutation,
  updateOrderCustomFieldsMutation
} from '../providers/shop/checkout/checkout'

export default {
  name: 'CheckoutShipping',
  setup() {
    const { t } = useI18n()
    const router = useRouter()
    const appStore = useAppStore()

    // Initial loading state
    const isInitialLoading = ref(true)

    // Customer information - use logged in user data if available
    const customer = ref({
      emailAddress: appStore.customer.emailAddress || '',
      firstName: appStore.customer.firstName || '',
      lastName: appStore.customer.lastName || ''
    })

    // Shipping address form data
    const shippingAddress = ref({
      fullName: appStore.shippingAddress.fullName || '',
      company: appStore.shippingAddress.company || '',
      streetLine1: appStore.shippingAddress.streetLine1 || '',
      countryCode: appStore.shippingAddress.countryCode || '',
      phoneNumber: appStore.shippingAddress.phoneNumber || ''
    })

    const countries = COUNTRIES

    // Address modal functionality
    const showAddressModal = ref(false)

    // Address loading state
    const isAddressLoading = ref(true)

    // Address selection
    const customerAddresses = ref([])
    const selectedAddressId = ref('')

    const hasShippingAddress = computed(() => {
      return (
        shippingAddress.value.fullName &&
        shippingAddress.value.streetLine1 &&
        shippingAddress.value.countryCode &&
        shippingAddress.value.phoneNumber
      )
    })

    const hasMultipleAddresses = computed(() => {
      return customerAddresses.value.length > 1
    })

    const selectedAddress = computed(() => {
      if (!selectedAddressId.value) return null
      return customerAddresses.value.find(addr => addr.id === selectedAddressId.value)
    })


    const loadCustomerAddresses = async () => {
      try {
        const addresses = await appStore.loadCustomerAddresses()
        customerAddresses.value = addresses || []
        // Don't auto-select any address - let user choose manually
        selectedAddressId.value = ''
      } catch (error) {
        console.error('Error loading customer addresses:', error)
        customerAddresses.value = []
      }
    }

    const selectAddress = async (addressId) => {
      if (!addressId) {
        shippingAddress.value = {
          fullName: '',
          company: '',
          streetLine1: '',
          countryCode: '',
          phoneNumber: ''
        }
        selectedAddressId.value = ''
        return
      }

      selectedAddressId.value = addressId
      const address = customerAddresses.value.find(addr => addr.id === addressId)

      if (address) {
        // Update the form fields
        shippingAddress.value = {
          fullName: address.fullName || '',
          company: address.company || '',
          streetLine1: address.streetLine1 || '',
          countryCode: address.country?.code || '',
          phoneNumber: address.phoneNumber || ''
        }

        // Sync the address with the backend order
        try {
          const addressInput = {
            fullName: shippingAddress.value.fullName,
            company: shippingAddress.value.company,
            streetLine1: shippingAddress.value.streetLine1,
            countryCode: shippingAddress.value.countryCode,
            phoneNumber: shippingAddress.value.phoneNumber
          }

          const result = await setOrderShippingAddressMutation(addressInput)

          if (result?.__typename === 'ErrorResult') {
            console.error('Failed to sync address with backend:', result.message)
          }
        } catch (error) {
          console.error('Error syncing address with backend:', error)
        }
      } else {
        console.error('Selected address not found in address book')
      }
    }

    // Shipping method functionality
    const selectedShippingMethod = ref(null)
    const eligibleShippingMethods = ref([])

    const loadCurrentShippingMethod = async () => {
      try {
        const currentOrder = await getActiveOrderQuery()
        //  //console.log('📋 loadCurrentShippingMethod - Loaded current order:', JSON.parse(JSON.stringify(currentOrder?.shippingLines)))

        if (currentOrder?.shippingLines?.length > 0) {
          const currentShippingLine = currentOrder.shippingLines[0]
          const currentShippingMethod = currentShippingLine.shippingMethod

          //  //console.log('📦 Found current shipping method on order:', currentShippingMethod)

          // Find the matching shipping method in the eligible methods
          if (eligibleShippingMethods.value.length > 0 && currentShippingMethod) {
            const matchingMethod = eligibleShippingMethods.value.find(
              method => method.id === currentShippingMethod.id
            )

            if (matchingMethod) {
              //  //console.log('✅ Matching shipping method found, selecting:', matchingMethod)
              selectedShippingMethod.value = matchingMethod
            } else {
              //  //console.log('❌ No matching shipping method found in eligible methods')
            }
          }
        }
      } catch (error) {
        console.error('Error loading current shipping method:', error)
      } finally {
        // Mark shipping data as loaded regardless of success/failure
        isShippingDataLoaded.value = true
      }
    }

    const loadCurrentShippingAddress = async () => {
      try {
        // // Priority 1: Read the order's shipping address from backend
        // const orderAddress = await getActiveOrderShippingAddressQuery()

        // //console.log("1 -------------->", orderAddress)

        // if (orderAddress && orderAddress.fullName) {
        //   shippingAddress.value = {
        //     fullName: orderAddress.fullName || '',
        //     company: orderAddress.company || '',
        //     streetLine1: orderAddress.streetLine1 || '',
        //     // streetLine2: orderAddress.streetLine2 || '',
        //     // city: orderAddress.city || '',
        //     // province: orderAddress.province || '',
        //     // postalCode: orderAddress.postalCode || '',
        //     countryCode: orderAddress.countryCode || '',
        //     phoneNumber: orderAddress.phoneNumber || ''
        //   }
        //   //console.log("2 -------------->", shippingAddress.value)
        //   return
        // }

        // Priority 2: Default address from user address book
        if (customerAddresses.value.length > 0) {
          const defaultShippingAddress = customerAddresses.value.find(addr => addr.defaultShippingAddress)
          if (defaultShippingAddress) {
            shippingAddress.value = {
              fullName: defaultShippingAddress.fullName || '',
              company: defaultShippingAddress.company || '',
              streetLine1: defaultShippingAddress.streetLine1 || '',
              countryCode: defaultShippingAddress.country?.code || '',
              phoneNumber: defaultShippingAddress.phoneNumber || ''
            }

            // // Auto-sync the default shipping address with the backend order
            // await syncShippingAddressWithBackend(shippingAddress.value)
          }
        }


      } catch (error) {
        console.error('Error loading shipping address:', error)
        // Fallback to empty form
        shippingAddress.value = {
          fullName: '',
          company: '',
          streetLine1: '',
          countryCode: '',
          phoneNumber: ''
        }
      } finally {
        // Mark address loading as complete
        isAddressLoading.value = false
      }
    }

    const loadEligibleShippingMethods = async () => {
      try {
        // Fetch fresh order data to check if shipping method exists in DB
        const freshOrder = await getActiveOrderQuery()
        const orderHasShippingMethodInDB = freshOrder?.shippingLines?.length > 0
        //console.log('🔍 loadEligibleShippingMethods - freshOrder has shipping:', orderHasShippingMethodInDB)

        const methods = await getEligibleShippingMethodsQuery()
        eligibleShippingMethods.value = methods

        //console.log('📋 Eligible shipping methods loaded:', methods.length)
        //console.log('📦 selectedShippingMethod.value:', selectedShippingMethod.value)

        // Check if we have a pre-selected method from the order
        const hasPreselectedMethod = selectedShippingMethod.value && selectedShippingMethod.value.id
        //console.log('🔍 hasPreselectedMethod:', hasPreselectedMethod)

        if (hasPreselectedMethod) {
          //console.log('✅ Using pre-selected shipping method from order:', selectedShippingMethod.value.name)

          // Verify the pre-selected method is in the eligible list
          const matchingMethod = methods.find(m => m.id === selectedShippingMethod.value.id)
          //console.log('🔍 Looking for ID:', selectedShippingMethod.value.id)
          //console.log('🔍 Available method IDs:', methods.map(m => ({ id: m.id, name: m.name })))
          //console.log('🔍 matchingMethod:', matchingMethod)

          if (matchingMethod) {
            selectedShippingMethod.value = matchingMethod
            //console.log('✅ Verified and kept pre-selected method:', matchingMethod.name)
          } else {
            //console.log('⚠️ Pre-selected method not in eligible list, clearing selection')
            selectedShippingMethod.value = null
          }
        }

        // Auto-select the first available shipping method only if:
        // 1. There are eligible methods
        // 2. No method is currently selected
        // 3. The order has NO shipping method in the database
        //console.log('🔍 Final check - methods:', methods.length, 'selectedMethod:', !!selectedShippingMethod.value, 'orderHasShipping:', orderHasShippingMethodInDB)

        if (methods.length > 0 && !selectedShippingMethod.value && !orderHasShippingMethodInDB) {
          //console.log('⚠️ Auto-selecting first shipping method (order has no shipping method in DB):', methods[0].name)

          // Auto-sync the default shipping method with the backend order
          try {
            const result = await setOrderShippingMethodMutation(methods[0].id)

            if (result?.__typename === 'ErrorResult') {
              console.error('Failed to sync default shipping method:', result.message)
            } else {
              //console.log('✅ Auto-synced default shipping method to database:', methods[0].name)
              // Update the selected shipping method in the UI
              selectedShippingMethod.value = methods[0]
              //console.log('✅ Set selectedShippingMethod to:', methods[0].name)
              // Update the order with the new shipping cost from the mutation result
              if (result?.shippingWithTax !== undefined) {
                appStore.setActiveOrder({
                  ...appStore.activeOrder,
                  shippingWithTax: result.shippingWithTax,
                  totalWithTax: result.totalWithTax
                })
              }
            }
          } catch (error) {
            console.error('Error syncing default shipping method with backend:', error)
          }
        } else if (selectedShippingMethod.value) {
          //console.log('✅ Shipping method already selected, not auto-choosing:', selectedShippingMethod.value.name)
        } else if (orderHasShippingMethodInDB) {
          //console.log('✅ Order already has shipping method in DB, not auto-choosing')
        } else {
          //console.log('⚠️ No shipping method to select, eligible methods:', methods.length)
        }
      } catch (error) {
        console.error('Error loading shipping methods:', error)
        eligibleShippingMethods.value = []
      }
    }

    const selectShippingMethod = async (method) => {
      try {
        // Immediately update the database when user selects a shipping method
        const result = await setOrderShippingMethodMutation(method.id)

        if (result?.__typename === 'ErrorResult') {
          console.error('Failed to update shipping method:', result.message)
          alert(`Failed to update shipping method: ${result.message}`)
          return
        }

        // Update the selected shipping method only if database update was successful
        selectedShippingMethod.value = method

        // Update the order with the new shipping cost from the mutation result
        if (result?.shippingWithTax !== undefined) {
          appStore.setActiveOrder({
            ...appStore.activeOrder,
            shippingWithTax: result.shippingWithTax,
            totalWithTax: result.totalWithTax
          })
        }
      } catch (error) {
        console.error('Error updating shipping method:', error)
        alert('Failed to update shipping method. Please try again.')
      }
    }




    // Component mount setup
    onMounted(async () => {
      appStore.setShowCart(false)

      // Load active order from server before checking
      const order = await getActiveOrderQuery()
      //console.log('🔍 onMounted - order fetched:', order?.id, 'shippingLines:', order?.shippingLines?.length, 'state:', order?.state)

      if (order) {
        appStore.setActiveOrder(order)

        // Log shipping method from order
        if (order.shippingLines?.length > 0) {
          //console.log('🔍 onMounted - order has shippingLines:', order.shippingLines[0])
          if (order.shippingLines[0].shippingMethod) {
            //console.log('🔍 onMounted - shippingMethod:', order.shippingLines[0].shippingMethod.name, order.shippingLines[0].shippingMethod.id)
          }
        } else {
          //console.log('🔍 onMounted - order has NO shippingLines')
        }

        // Always populate customer form fields from order if order.customer exists
        if (order.customer) {
          customer.value.emailAddress = order.customer.emailAddress || customer.value.emailAddress || ''
          customer.value.firstName = order.customer.firstName || customer.value.firstName || ''
          customer.value.lastName = order.customer.lastName || customer.value.lastName || ''
        }

        // Always populate shipping address from order if order.shippingAddress exists
        if (order.shippingAddress) {
          shippingAddress.value.fullName = order.shippingAddress.fullName || shippingAddress.value.fullName || ''
          shippingAddress.value.company = order.shippingAddress.company || shippingAddress.value.company || ''
          shippingAddress.value.streetLine1 = order.shippingAddress.streetLine1 || shippingAddress.value.streetLine1 || ''
          shippingAddress.value.countryCode = order.shippingAddress.countryCode || shippingAddress.value.countryCode || ''
          shippingAddress.value.phoneNumber = order.shippingAddress.phoneNumber || shippingAddress.value.phoneNumber || ''
        }
      }

      if (!order?.lines?.length) {
        isInitialLoading.value = false
        router.push('/')
        return
      }

      isInitialLoading.value = false

      // Load customer addresses first (for logged in users) to populate address book
      if (appStore.isLoggedIn) {
        try {
          ////  //console.log('🚀 Loading customer addresses for address book...')
          await loadCustomerAddresses()
          ////  //console.log('✅ Customer addresses loaded:', customerAddresses.value.length)
        } catch (error) {
          console.error('Error loading customer addresses for checkout:', error)
        }
      }

      // Load current shipping method from order FIRST (before loading address)
      // This ensures selectedShippingMethod.value is set before the watch triggers
      if (order?.shippingLines?.length > 0) {
        const currentMethod = order.shippingLines[0].shippingMethod
        if (currentMethod) {
          //console.log('✅ Found existing shipping method on order:', currentMethod.name, currentMethod.id)
          selectedShippingMethod.value = { id: currentMethod.id, name: currentMethod.name, code: currentMethod.code, priceWithTax: order.shippingLines[0].priceWithTax }
          //console.log('✅ Set selectedShippingMethod.value:', selectedShippingMethod.value)
        }
      } else {
        //console.log('⚠️ No shipping lines in order, will auto-select default later')
        // Set a flag to auto-select default shipping method later
        selectedShippingMethod.value = null
      }

      // Load current shipping address with priority logic
      // Note: This will trigger the watch, but selectedShippingMethod.value is already set
      await loadCurrentShippingAddress()

      // Fetch payment history using orderByCode
      if (appStore.activeOrder?.code) {
        try {
          const orderWithPayments = await getOrderByCodeQuery(appStore.activeOrder.code)
          if (orderWithPayments?.payments) {
            //  //console.log('CheckoutShipping - Payment history fetched:', orderWithPayments.payments)
            paymentData.value = orderWithPayments.payments
          }
        } catch (paymentError) {
          console.error('Error fetching payment history in CheckoutShipping:', paymentError)
        }
      }

      // Load eligible shipping methods (now checks appStore.activeOrder directly)
      await loadEligibleShippingMethods()

      // Mark shipping data as loaded
      isShippingDataLoaded.value = true

      // Hide loading state after all data is loaded (including shipping method)
      isInitialLoading.value = false

      // Stock validation is now handled in the cart component before navigation
      // If we reach checkout, it means stock validation passed
    })

    // Track if initial shipping data is loaded
    const isInitialShippingLoadComplete = ref(false)

    // Reload shipping methods when shipping address changes
    // Only trigger after initial load is complete
    watch(shippingAddress, async () => {
      if (hasShippingAddress.value && isInitialShippingLoadComplete.value) {
        await loadEligibleShippingMethods()
      }
    }, { deep: true })

    // Mark initial load as complete BEFORE loadCurrentShippingAddress is called
    // This prevents the watch from triggering during initial load
    isInitialShippingLoadComplete.value = true


    // Track if shipping data is loaded from database
    const isShippingDataLoaded = ref(false)

    // Form validation
    // customer.value.emailAddress &&
    // customer.value.firstName &&
    // customer.value.lastName &&
    const isShippingFormValid = computed(() => {
      return (
        hasShippingAddress.value &&
        selectedShippingMethod.value
      )
    })

    // Payment data ref (fetched separately)
    const paymentData = ref([])
    const isProceedingToPayment = ref(false)

    // Payment history computed properties
    const payments = computed(() => {
      const allPayments = paymentData.value.length > 0 ? paymentData.value : (appStore.activeOrder?.payments || [])
      // Filter to show only Settled and Authorized payments in history
      return allPayments.filter(payment => payment.state === 'Settled' || payment.state === 'Authorized')
    })

    const totalPaid = computed(() => {
      const paymentArray = payments.value
      if (!paymentArray || paymentArray.length === 0) return 0

      return paymentArray.reduce((sum, payment) => {
        // Sum payments that are settled or authorized (both count as committed funds from user)
        if ((payment.state === 'Settled' || payment.state === 'Authorized') && payment.amount > 0) {
          return sum + payment.amount
        }
        return sum
      }, 0)
    })

    const remainingAmount = computed(() => {
      const subtotal = appStore.activeOrder?.subTotalWithTax || 0
      const shipping = appStore.activeOrder?.shippingWithTax || 0
      const total = subtotal + shipping
      return total - totalPaid.value
    })

    const formattedTotal = computed(() => {
      if (!isShippingDataLoaded.value) return 'Loading...'

      const totalAmount = selectedShippingMethod.value
        ? (appStore.activeOrder?.subTotalWithTax || 0) + selectedShippingMethod.value.priceWithTax
        : appStore.activeOrder?.totalWithTax || 0

      const currencyCode = appStore.activeOrder?.currencyCode

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

    // Check if order is in ArrangingPayment state (prevents modifications)
    const isArrangingPayment = computed(() => {
      return appStore.activeOrder?.state === 'ArrangingPayment'
    })

    // Helper function to format payment state
    const formatPaymentState = (state) => {
      const stateMap = {
        'Created': 'Created',
        'Authorized': 'Authorized',
        'Settled': 'Settled',
        'Declined': 'Declined',
        'Error': 'Error',
        'Cancelled': 'Cancelled',
        'Pending': 'Pending'
      }
      return stateMap[state] || state
    }


    // Watch for changes in store shipping address and update form fields
    watch(() => appStore.shippingAddress, (newAddress) => {
      shippingAddress.value = {
        fullName: newAddress.fullName || '',
        company: newAddress.company || '',
        streetLine1: newAddress.streetLine1 || '',
        // streetLine2: newAddress.streetLine2 || '',
        // city: newAddress.city || '',
        // province: newAddress.province || '',
        // postalCode: newAddress.postalCode || '',
        countryCode: newAddress.countryCode || '',
        phoneNumber: newAddress.phoneNumber || ''
      }
    }, { deep: true, immediate: true })

    // Function to wait for shipping method to be fully applied and verified
    async function waitForShippingMethodApplied(expectedShippingCost) {
      ////  //console.log('Starting shipping method verification...')
      ////  //console.log('Expected shipping cost:', expectedShippingCost)

      const maxAttempts = 5
      const delayBetweenAttempts = 500 // 500ms

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        ////  //console.log(`Verification attempt ${attempt}/${maxAttempts}...`)

        try {
          // Refresh the order to get the latest data
          const refreshedOrder = await getActiveOrderQuery()

          if (refreshedOrder) {
            ////  //console.log(`Attempt ${attempt} - Current shipping cost: ${refreshedOrder.shippingWithTax}`)
            ////  //console.log(`Attempt ${attempt} - Current order state: ${refreshedOrder.state}`)
            ////  //console.log(`Attempt ${attempt} - Current total cost: ${refreshedOrder.totalWithTax}`)

            // Check if the shipping cost matches the expected value
            if (refreshedOrder.shippingWithTax === expectedShippingCost) {
              ////  //console.log('✅ Shipping method successfully verified!')
              // Update the store with the verified order data
              appStore.setActiveOrder(refreshedOrder)
              return true
            } else {
              ////  //console.log(`❌ Shipping cost mismatch. Expected: ${expectedShippingCost}, Got: ${refreshedOrder.shippingWithTax}`)
            }
          } else {
            ////  //console.log(`Attempt ${attempt} - No order data received`)
          }
        } catch (error) {
          console.error(`Attempt ${attempt} - Error refreshing order:`, error)
        }

        // Wait before next attempt
        if (attempt < maxAttempts) {
          ////  //console.log(`Waiting ${delayBetweenAttempts}ms before next attempt...`)
          await new Promise(resolve => setTimeout(resolve, delayBetweenAttempts))
        }
      }

      console.error('❌ Shipping method verification failed after all attempts')
      return false
    }

    async function proceedToPayment() {
      if (!isShippingFormValid.value) {
        return
      }

      isProceedingToPayment.value = true

      try {
        // 1. Set shipping address
        const addressInput = {
          fullName: shippingAddress.value.fullName,
          company: shippingAddress.value.company,
          streetLine1: shippingAddress.value.streetLine1,
          // streetLine2: shippingAddress.value.streetLine2,
          // city: shippingAddress.value.city,
          // province: shippingAddress.value.province,
          // postalCode: shippingAddress.value.postalCode,
          countryCode: shippingAddress.value.countryCode,
          phoneNumber: shippingAddress.value.phoneNumber
        }

        const addressResult = await setOrderShippingAddressMutation(addressInput)

        if (addressResult?.__typename === 'ErrorResult') {
          alert(`Failed to set shipping address: ${addressResult.message}`)
          return
        }

        // Update the order with shipping cost from address result if available
        if (addressResult?.shippingWithTax !== undefined) {
          appStore.setActiveOrder({
            ...appStore.activeOrder,
            shippingWithTax: addressResult.shippingWithTax,
            totalWithTax: addressResult.totalWithTax
          })
        }

        // Note: Shipping method is already set in the database when user selects it
        // No need to set it again here - just verify we have a selected method

        // Transition order state to ArrangingPayment
        try {
          const transitionResult = await transitionToArrangingPaymentMutation()
          if (transitionResult?.__typename === 'ErrorResult') {
            console.error('Failed to transition to ArrangingPayment:', transitionResult.message)
            alert(`Failed to proceed to payment: ${transitionResult.message}`)
            return
          }
          // Update order in store with new state
          appStore.setActiveOrder({
            ...appStore.activeOrder,
            state: 'ArrangingPayment'
          })
        } catch (transitionError) {
          console.error('Error transitioning to ArrangingPayment:', transitionError)
          alert('Failed to proceed to payment. Please try again.')
          return
        }

        // Set paymentPageVisitedAt timestamp (only if not already set)
        const existingTimestamp = appStore.activeOrder?.customFields?.paymentPageVisitedAt
        if (!existingTimestamp) {
          const paymentPageVisitedAt = new Date().toISOString()
          try {
            const customFieldsResult = await updateOrderCustomFieldsMutation({
              customFields: {
                paymentPageVisitedAt
              }
            })
            if (customFieldsResult?.__typename === 'ErrorResult') {
              console.error('Failed to set paymentPageVisitedAt:', customFieldsResult.message)
            }
          } catch (customFieldsError) {
            console.error('Error setting paymentPageVisitedAt:', customFieldsError)
          }
        }

        // Final order refresh to ensure all changes are properly reflected
        const finalRefreshedOrder = await getActiveOrderQuery()
        if (finalRefreshedOrder) {
          appStore.setActiveOrder(finalRefreshedOrder)
        }

        // Navigate to payment page
        router.push('/checkout/payment')

      } catch (error) {
        console.error('Error during shipping setup:', error)
        alert('An error occurred while setting up shipping. Please try again.')
      } finally {
        isProceedingToPayment.value = false
      }
    }


    return {
      appStore,
      customer,
      shippingAddress,
      countries,
      isShippingFormValid,
      formatPrice,
      proceedToPayment,
      isProceedingToPayment,
      // showAddressModal,
      // newAddress,
      // isNewAddressValid,
      // closeAddressModal,
      // saveNewAddress,
      hasShippingAddress,
      getCountryName,
      customerAddresses,
      selectedAddressId,
      hasMultipleAddresses,
      selectedAddress,
      selectAddress,
      eligibleShippingMethods,
      selectedShippingMethod,
      selectShippingMethod,
      loadEligibleShippingMethods,
      isShippingDataLoaded,
      isAddressLoading,
      // syncShippingAddressWithBackend,
      // Payment history
      payments,
      totalPaid,
      formattedTotal,
      formatPaymentState,
      isArrangingPayment,
      router,
      t,
      isInitialLoading
    }
  }
}
</script>