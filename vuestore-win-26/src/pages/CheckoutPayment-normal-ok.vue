<template>
  <div>
    <div v-if="appStore.activeOrder?.id" class="bg-gray-50 pb-16">
      <div class="max-w-7xl mx-auto pt-8 mb-12 px-4 sm:px-6 lg:px-8">
        <h2 class="sr-only">Checkout</h2>

        <!-- Mobile Navigation -->
        <div class="sm:hidden pb-4 mb-6 border-b border-gray-200">
          <button @click="$router.push('/checkout/shipping')"
            class="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Shipping
          </button>
        </div>

        <!-- Checkout Steps Navigation -->
        <nav class="hidden sm:block pb-8 mb-8 border-b">
          <ol class="flex space-x-4 justify-center">
            <li class="flex items-center">
              <router-link to="/checkout/shipping"
                class="text-sm font-medium text-gray-500 hover:text-primary-500 transition-colors">
                Shipping
              </router-link>
              <span class="ml-4 text-gray-300">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </li>
            <li class="flex items-center">
              <span class="text-sm font-medium text-primary-600">Payment</span>
              <span class="ml-4 text-gray-300">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </li>
            <li class="flex items-center">
              <span class="text-sm font-medium text-gray-500">Confirmation</span>
            </li>
          </ol>
        </nav>

        <div class="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">

          <div>
            <!-- Order Summary -->
            <div class="hidden lg:block mt-10 lg:mt-0">

              <h2 class="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
              <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <!-- Cart Contents -->
                <div class="space-y-4 mb-6">
                  <div v-for="line in appStore.activeOrder?.lines || []" :key="line.id"
                    class="flex items-center space-x-4">
                    <div class="flex-shrink-0 w-16 h-16 border border-gray-200 rounded-md overflow-hidden">
                      <img v-if="line.featuredAsset" :src="line.featuredAsset.preview" :alt="line.productVariant.name"
                        class="w-full h-full object-center object-cover" />
                    </div>
                    <div class="flex-1">
                      <h4 class="text-sm font-medium text-gray-900">{{ line.productVariant.name }}</h4>
                      <p class="text-sm text-gray-500">Qty: {{ line.quantity }}</p>
                    </div>
                    <div class="text-sm font-medium text-gray-900">
                      {{ formatPrice(line.linePriceWithTax, appStore.activeOrder?.currencyCode) }}
                    </div>
                  </div>
                </div>

                <!-- Order Totals -->
                <div class="border-t border-gray-200 pt-4 space-y-2">
                  <div class="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>{{ formatPrice(appStore.activeOrder?.subTotalWithTax, appStore.activeOrder?.currencyCode)
                    }}</span>
                  </div>
                  <div class="flex justify-between text-sm text-gray-600">
                    <span>Shipping</span>
                    <span>
                      {{ appStore.activeOrder?.shippingWithTax ? formatPrice(appStore.activeOrder.shippingWithTax,
                        appStore.activeOrder?.currencyCode) : 'Select method' }}
                    </span>
                  </div>
                  <div class="flex justify-between text-base font-medium text-gray-900 border-t border-gray-200 pt-2">
                    <span>Total</span>
                    <span v-html="formattedTotal"></span>
                  </div>
                </div>
              </div>

            </div>

            <!-- Payment History -->
            <div v-if="payments && payments.length > 0" class="mt-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Payment History</h3>
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
                          {{ payment.method || 'Payment' }}
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
                      <!-- <p v-if="payment.metadata?.public?.actually_paid_at_fiat > 0"
                        class="text-sm font-medium text-gray-900">
                        {{ formatPrice(payment.metadata.public.actually_paid_at_fiat * 100,
                          appStore.activeOrder?.currencyCode) }}
                      </p> -->
                      <!-- <p v-else-if="payment.metadata?.public?.price_amount" class="text-sm font-medium text-gray-900">
                        {{ formatPrice(parseFloat(payment.metadata.public.price_amount) * 100,
                          appStore.activeOrder?.currencyCode) }}
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
                    <span class="text-gray-600">Total Paid:</span>
                    <span :class="totalPaid > 0 ? 'text-green-600 font-medium' : 'text-gray-500'">
                      {{ formatPrice(totalPaid, appStore.activeOrder?.currencyCode) }}
                    </span>
                  </div>
                  <div class="flex justify-between text-base font-medium text-gray-900">
                    <span>Remaining to Pay:</span>
                    <span :class="remainingAmount === 0 ? 'text-green-600' : 'text-gray-900'">
                      {{ formatPrice(remainingAmount, appStore.activeOrder?.currencyCode) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>


          <!-- Payment Content -->
          <div class="sm: mt-8">
            <h3 class="text-lg font-medium text-gray-900 mb-6 sm:mt-5">Payment Information</h3>
            <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <!-- Payment Methods Selection -->
              <div class="mb-8">
                <h4 class="text-md font-medium text-gray-900 mb-4">Select Payment Method</h4>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div v-for="method in eligiblePaymentMethods" :key="method.id" :class="[
                    'relative bg-white border rounded-lg shadow-sm p-4 flex cursor-pointer focus:outline-none',
                    selectedPaymentMethod?.id === method.id
                      ? 'border-primary-500 border-2'
                      : 'border-gray-300 hover:border-gray-400'
                  ]" @click="selectPaymentMethod(method)">
                    <span class="flex-1 flex">
                      <span class="flex flex-col">
                        <span class="block text-sm font-medium text-gray-900">{{ method.name }}</span>
                        <span class="mt-1 text-xs text-gray-500">{{ method.description }}</span>
                      </span>
                    </span>
                    <div v-if="selectedPaymentMethod?.id === method.id" class="flex-shrink-0">
                      <svg class="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clip-rule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Payment Form -->
              <!-- class="border-t border-gray-200 pt-6" -->
              <div v-if="selectedPaymentMethod">
                <!-- <h4 class="text-md font-medium text-gray-900 mb-4">{{ selectedPaymentMethod.name }} Details</h4> -->

                <!-- Payment Processing State -->
                <div v-if="paymentProcessing" class="mb-6">
                  <div class="flex items-center justify-center py-8">
                    <div class="text-center">
                      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                      <p class="mt-4 text-gray-600">Processing your payment...</p>
                    </div>
                  </div>
                </div>

                <!-- Standard Payment Form -->
                <form v-else-if="selectedPaymentMethod?.code === 'standard-payment'" @submit.prevent="processPayment"
                  class="space-y-6">

                  <!-- Terms and Conditions -->
                  <div class="pt-6 flex items-center">
                    <input type="checkbox" v-model="paymentForm.acceptTerms" id="acceptTerms"
                      class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
                    <label for="acceptTerms" class="ml-2 block text-sm text-gray-900">
                      I agree to the <span class="text-primary-600 hover:text-primary-500">Terms and
                        Conditions</span>
                     <!-- <span class="text-primary-600 hover:text-primary-500"></span> -->
                    </label>
                  </div>

                  <!-- {{ paymentForm.acceptTerms }} -->

                  <button type="submit" :disabled="!paymentForm.acceptTerms" :class="[
                    'w-full px-6 py-3 rounded-md font-semibold text-white transition',
                    paymentForm.acceptTerms
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-400 cursor-not-allowed'
                  ]">
                    Complete Payment - {{ formatPrice(remainingAmount, appStore.activeOrder?.currencyCode) }}
                  </button>

                  <!-- Submit Button -->
                  <div class="flex justify-center">

                  </div>


                </form>

                <!-- NowPayments Crypto Payment Form -->
                <form v-else-if="selectedPaymentMethod?.code === 'nowpayments'" @submit.prevent="processNowPayments"
                  class="space-y-6">

                  <!-- Crypto Payment Info -->
                  <div class="bg-purple-50 border border-purple-200 rounded-md p-4">
                    <div class="flex">
                      <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                            clip-rule="evenodd" />
                        </svg>
                      </div>
                      <div class="ml-3 flex-1">
                        <p class="text-sm text-purple-800">
                          Pay with Bitcoin, Ethereum, and 300+ cryptocurrencies via NowPayments.
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- Crypto Payment Info -->
                  <div class="text-sm text-gray-600">
                    <p>You will be redirected to complete your crypto payment securely.</p>
                    <p class="mt-1">Payment will be processed after blockchain confirmation.</p>
                  </div>

                  <!-- Terms and Conditions -->
                  <div class="pt-6 flex items-center">
                    <input type="checkbox" v-model="paymentForm.acceptTerms" id="nowpaymentsAcceptTerms"
                      class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
                    <label for="nowpaymentsAcceptTerms" class="ml-2 block text-sm text-gray-900">
                      I agree to the <span class="text-primary-600 hover:text-primary-500">Terms and
                        Conditions</span>
                    </label>
                  </div>

                  <button type="submit" :disabled="!paymentForm.acceptTerms || nowpaymentsLoading" :class="[
                    'w-full px-6 py-3 rounded-md font-semibold text-white transition',
                    paymentForm.acceptTerms && !nowpaymentsLoading
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'bg-gray-400 cursor-not-allowed'
                  ]">
                    {{ nowpaymentsLoading ? 'Redirecting to Crypto Payment...' : `Pay with Crypto -
                    ${formatPrice(remainingAmount, appStore.activeOrder?.currencyCode)}` }}
                  </button>

                </form>

                <!-- Omise Payment Form -->
                <form v-else-if="selectedPaymentMethod?.code === 'omise'" @submit.prevent="processOmisePayment"
                  class="space-y-6">

                  <!-- Omise Info -->
                  <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div class="flex">
                      <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clip-rule="evenodd" />
                        </svg>
                      </div>
                      <div class="ml-3 flex-1">
                        <p class="text-sm text-blue-800">
                          Omise payment gateway integration will process your payment securely.
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- Omise Card Form -->
                  <div class="space-y-4">
                    <div>
                      <label for="omiseCardName" class="block text-sm font-medium text-gray-700 mb-1">Name on
                        Card</label>
                      <input type="text" id="omiseCardName" v-model="omiseCard.name" required
                        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="John Doe" />
                    </div>

                    <div>
                      <label for="omiseCardNumber" class="block text-sm font-medium text-gray-700 mb-1">Card
                        Number</label>
                      <input type="text" id="omiseCardNumber" v-model="omiseCard.number" @input="formatOmiseCardNumber"
                        maxlength="19" required
                        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="4242 4242 4242 4242" />
                    </div>

                    <div class="grid grid-cols-3 gap-4">
                      <div>
                        <label for="omiseExpiryMonth" class="block text-sm font-medium text-gray-700 mb-1">Month</label>
                        <input type="number" id="omiseExpiryMonth" v-model="omiseCard.expiration_month" placeholder="MM"
                          min="1" max="12" required
                          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
                      </div>
                      <div>
                        <label for="omiseExpiryYear" class="block text-sm font-medium text-gray-700 mb-1">Year</label>
                        <input type="number" id="omiseExpiryYear" v-model="omiseCard.expiration_year" placeholder="YYYY"
                          min="2025" max="2050" required
                          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
                      </div>
                      <div>
                        <label for="omiseCvv" class="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                        <input type="text" id="omiseCvv" v-model="omiseCard.security_code" maxlength="4" required
                          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          placeholder="123" />
                      </div>
                    </div>

                    <div v-if="omiseError" class="text-red-600 text-sm mt-2">
                      {{ omiseError }}
                    </div>
                  </div>

                  <!-- Terms and Conditions -->
                  <div class="pt-6 flex items-center">
                    <input type="checkbox" v-model="paymentForm.acceptTerms" id="omiseAcceptTerms"
                      class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
                    <label for="omiseAcceptTerms" class="ml-2 block text-sm text-gray-900">
                      I agree to the <span class="text-primary-600 hover:text-primary-500">Terms and
                        Conditions</span>
                    </label>
                  </div>

                  <button type="submit" :disabled="!paymentForm.acceptTerms || omiseLoading" :class="[
                    'w-full px-6 py-3 rounded-md font-semibold text-white transition',
                    paymentForm.acceptTerms && !omiseLoading
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-400 cursor-not-allowed'
                  ]">
                    {{ omiseLoading ? 'Processing with Omise...' : `Pay with Omise - ${formatPrice(remainingAmount,
                      appStore.activeOrder?.currencyCode)}` }}
                  </button>

                </form>

                <!-- PromptPay Payment Form -->
                <form v-else-if="selectedPaymentMethod?.code === 'promptpay'" @submit.prevent="processPromptPayPayment"
                  class="space-y-6">

                  <!-- PromptPay Info -->
                  <div class="bg-green-50 border border-green-200 rounded-md p-4">
                    <div class="flex">
                      <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd"
                            d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1z"
                            clip-rule="evenodd" />
                          <path
                            d="M11 4a1 1 0 10-2 0v1a1 1 0 002 0V4zM10 7a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1zM8 9a1 1 0 000 2h8a1 1 0 100-2H8zM8 13a1 1 0 000 2h5a1 1 0 100-2H8z" />
                        </svg>
                      </div>
                      <div class="ml-3 flex-1">
                        <p class="text-sm text-green-800">
                          Scan the QR code with your banking app to complete payment via PromptPay.
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- QR Code Display -->
                  <div v-if="promptPayQrUrl" class="text-center">
                    <p class="text-sm text-gray-600 mb-4">Scan this QR code with your banking app:</p>
                    <div class="inline-block p-4 bg-white border border-gray-200 rounded-lg">
                      <img :src="promptPayQrUrl" alt="PromptPay QR Code" class="w-64 h-64 mx-auto" />
                    </div>
                    <p class="text-xs text-gray-500 mt-4">Order will be confirmed automatically once payment is
                      received.</p>
                  </div>

                  <!-- Terms and Conditions -->
                  <div v-if="!promptPayQrUrl" class="pt-6 flex items-center">
                    <input type="checkbox" v-model="paymentForm.acceptTerms" id="promptpayAcceptTerms"
                      class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
                    <label for="promptpayAcceptTerms" class="ml-2 block text-sm text-gray-900">
                      I agree to the <span class="text-primary-600 hover:text-primary-500">Terms and
                        Conditions</span>
                    </label>
                  </div>

                  <!-- Payment Button -->
                  <button v-if="!promptPayQrUrl" type="submit" :disabled="!paymentForm.acceptTerms || promptPayLoading"
                    :class="[
                      'w-full px-6 py-3 rounded-md font-semibold text-white transition',
                      paymentForm.acceptTerms && !promptPayLoading
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-gray-400 cursor-not-allowed'
                    ]">
                    {{ promptPayLoading ? 'Generating QR Code...' : `Pay with PromptPay - ${formatPrice(remainingAmount,
                      appStore.activeOrder?.currencyCode)}` }}
                  </button>

                  <!-- Tooltip -->
                  <div v-if="promptPayTooltip.show" class="mt-2 px-3 py-2 bg-red-100 border border-red-200 rounded-md">
                    <p class="text-sm text-red-700">{{ promptPayTooltip.message }}</p>
                  </div>

                </form>

                <!-- PromptPay Partial Payment Form -->
                <form v-else-if="selectedPaymentMethod?.code === 'promptpay-partial'"
                  @submit.prevent="processPromptPayPartialPayment" class="space-y-6">

                  <!-- PromptPay Partial Info -->
                  <div class="bg-green-50 border border-green-200 rounded-md p-4">
                    <div class="flex">
                      <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd"
                            d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1z"
                            clip-rule="evenodd" />
                          <path
                            d="M11 4a1 1 0 10-2 0v1a1 1 0 002 0V4zM10 7a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1zM8 9a1 1 0 000 2h8a1 1 0 100-2H8zM8 13a1 1 0 000 2h5a1 1 0 100-2H8z" />
                        </svg>
                      </div>
                      <div class="ml-3 flex-1">
                        <p class="text-sm text-green-800">
                          Scan the QR code with your banking app to complete partial payment via PromptPay.
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- QR Code Display -->
                  <div v-if="promptPayPartialQrUrl" class="text-center">
                    <p class="text-sm text-gray-600 mb-4">Scan this QR code with your banking app:</p>
                    <div class="inline-block p-4 bg-white border border-gray-200 rounded-lg">
                      <img :src="promptPayPartialQrUrl" alt="PromptPay QR Code" class="w-64 h-64 mx-auto" />
                    </div>
                    <p class="text-xs text-gray-500 mt-4">Order will be confirmed automatically once payment is
                      received.</p>
                  </div>

                  <!-- Terms and Conditions -->
                  <div v-if="!promptPayPartialQrUrl" class="pt-6 flex items-center">
                    <input type="checkbox" v-model="paymentForm.acceptTerms" id="promptpayPartialAcceptTerms"
                      class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
                    <label for="promptpayPartialAcceptTerms" class="ml-2 block text-sm text-gray-900">
                      I agree to the <span class="text-primary-600 hover:text-primary-500">Terms and
                        Conditions</span>
                    </label>
                  </div>

                  <!-- Payment Button -->
                  <button v-if="!promptPayPartialQrUrl" type="submit"
                    :disabled="!paymentForm.acceptTerms || promptPayPartialLoading" :class="[
                      'w-full px-6 py-3 rounded-md font-semibold text-white transition',
                      paymentForm.acceptTerms && !promptPayPartialLoading
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-gray-400 cursor-not-allowed'
                    ]">
                    {{ promptPayPartialLoading ? 'Generating QR Code...' : `Pay with PromptPay (Partial) -
                    ${formatPrice(remainingAmount, appStore.activeOrder?.currencyCode)}` }}
                  </button>

                  <!-- Tooltip -->
                  <div v-if="promptPayPartialTooltip.show"
                    class="mt-2 px-3 py-2 bg-red-100 border border-red-200 rounded-md">
                    <p class="text-sm text-red-700">{{ promptPayPartialTooltip.message }}</p>
                  </div>

                </form>

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
      <h3 class="mt-4 text-lg font-medium text-gray-900">Your cart is empty</h3>
      <p class="mt-2 text-gray-500">Add some items to your cart to proceed with checkout.</p>
      <div class="mt-6">
        <router-link to="/"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
          Continue Shopping
        </router-link>
      </div>
    </div>


  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import { formatPrice } from '../utils'
import { getEligiblePaymentMethods, getDefaultPaymentMethod } from '../config/payment'
import { getActiveOrderQuery, getOrderByCodeQuery } from '../providers/shop/orders/order'
import {
  addPaymentToOrderMutation,
  createStripePaymentIntentMutation,
  transitionToArrangingPaymentMutation,
  simulatePaymentMutation,
  initiateNowPaymentsPaymentMutation,
  createOmisePromptPayChargeMutation,
  createOmisePromptPayPartialChargeMutation
} from '../providers/shop/checkout/checkout'
import { loadStripe } from '@stripe/stripe-js'
import { StripeElements, StripeElement } from 'vue-stripe-js'

export default {
  name: 'CheckoutPayment',
  components: {
    StripeElements,
    StripeElement
  },
  setup() {

    // 2025-11-23 GROK 4.1 ~~~~~~~~~~~~~~~~~

    const stripeLoaded = ref(false)
    const paymentElementMounted = ref(false)

    const onStripeElementsLoad = () => {
      // console.log('StripeElements loaded')
      stripeLoaded.value = true
    }

    const onPaymentElementReady = () => {
      // console.log('PaymentElement is ready!')
      paymentElementMounted.value = true
    }

    const onPaymentElementLoad = () => {
      // console.log('PaymentElement load event')
    }

    // 2025-11-23 GROK 4.1 ~~~~~~~~~~~~~~~~~

    const router = useRouter()
    const appStore = useAppStore()

    // Payment data ref (fetched separately)
    const paymentData = ref([])

    // Vue Stripe component refs (official approach)
    const elementsComponent = ref()
    const paymentComponent = ref()

    // Vue Stripe options
    const stripeOptions = ref({})
    const paymentElementOptions = ref({})

    const elementsOptions = ref({
      clientSecret: '',
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#2563eb',
          colorBackground: '#ffffff',
          colorText: '#1f2937',
          colorDanger: '#ef4444',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          spacingUnit: '4px',
          borderRadius: '6px'
        }
      }
    })



    // Payment method functionality
    const selectedPaymentMethod = ref(null)

    const eligiblePaymentMethods = computed(() => {
      return getEligiblePaymentMethods()
    })

    // Polling reference to clear interval on component unmount
    const pollIntervalRef = ref(null)

    // Payment form data and state
    const paymentProcessing = ref(false)
    const stripePaymentLoading = ref(false)
    const clientSecret = ref('')
    const paymentElementReady = ref(false)
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

    // Safety check for Stripe key
    // console.log('🔑 Environment variable check:')
    // console.log('🔑 import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY:', import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
    // console.log('🔑 publishableKey variable:', publishableKey)

    if (!publishableKey || publishableKey === 'pk_test_51xxxxxxxxxxxxxxxxxxxx') {
      // console.warn('⚠️ Stripe publishable key not configured. Please update VITE_STRIPE_PUBLISHABLE_KEY in .env file')
    } else {
      // console.log('✅ Stripe publishable key loaded successfully:', publishableKey.substring(0, 20) + '...')
    }

    // Omise state
    const omiseLoading = ref(false)
    const omiseError = ref('')
    const omiseCard = reactive({
      name: '',
      number: '',
      expiration_month: '',
      expiration_year: '',
      security_code: ''
    })

    // NowPayments state
    const nowpaymentsLoading = ref(false)
    const nowpaymentsError = ref('')

    // PromptPay state
    const promptPayLoading = ref(false)
    const promptPayError = ref('')
    const promptPayQrUrl = ref('')
    const promptPayTooltip = reactive({
      show: false,
      message: ''
    })
    const promptPayInitialAmountPaid = ref(0)

    // PromptPay Partial state
    const promptPayPartialLoading = ref(false)
    const promptPayPartialError = ref('')
    const promptPayPartialQrUrl = ref('')
    const promptPayPartialTooltip = reactive({
      show: false,
      message: ''
    })
    const promptPayPartialInitialAmountPaid = ref(0)

    const paymentForm = reactive({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: '',
      useDifferentBillingAddress: false,
      billingAddress: '',
      billingCity: '',
      billingPostalCode: '',
      acceptTerms: false
    })

    const paymentErrors = reactive({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: '',
      acceptTerms: ''
    })

    // Payment validation
    const isPaymentFormValid = computed(() => {
      return (
        paymentForm.cardNumber.replace(/\s/g, '').length === 16 &&
        paymentForm.expiryDate.length === 5 &&
        paymentForm.cvv.length >= 3 &&
        paymentForm.cvv.length <= 4 &&
        paymentForm.cardholderName.trim().length > 0 &&
        paymentForm.acceptTerms
      )
    })

    const totalAmount = computed(() => {
      if (!appStore.activeOrder) return 0
      const subtotal = appStore.activeOrder.subTotalWithTax || 0
      const shipping = appStore.activeOrder.shippingWithTax || 0
      return subtotal + shipping
    })

    const formattedTotal = computed(() => {
      const total = totalAmount.value
      const currencyCode = appStore.activeOrder?.currencyCode

      const mainPrice = formatPrice(total, currencyCode)

      const showCny = import.meta.env.VITE_SHOW_CNY_AMOUNT === 'true' && (currencyCode === 'THB' || currencyCode === 'USD')
      const cnyRate = currencyCode === 'THB' ? (appStore.thbRates?.CNY || 0) : (appStore.usdRates?.CNY || 0)

      if (showCny && cnyRate) {
        const cnyPriceRaw = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'CNY'
        }).format((total / 100) * cnyRate)
        // Format CNY with space between symbol and number
        const cnySymbolMatch = cnyPriceRaw.match(/^([^\d]+)(.+)$/)
        const cnyCurrencySymbol = cnySymbolMatch ? cnySymbolMatch[1] : 'CN¥'
        const cnyNumeric = cnySymbolMatch ? cnySymbolMatch[2] : cnyPriceRaw
        const cnyPrice = `${cnyCurrencySymbol} ${cnyNumeric}`
        return `${mainPrice}<br><span class="text-sm text-gray-500">≈ ${cnyPrice}</span>`
      }

      return mainPrice
    })

    // Card formatting functions
    const formatCardNumber = () => {
      // Remove all non-digit characters
      let value = paymentForm.cardNumber.replace(/\D/g, '')

      // Limit to 16 digits
      if (value.length > 16) {
        value = value.substring(0, 16)
      }

      // Format as XXXX XXXX XXXX XXXX
      const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ')
      paymentForm.cardNumber = formatted.trim()

      // Validate card number
      if (value.length === 16) {
        paymentErrors.cardNumber = ''
      } else if (value.length > 0) {
        paymentErrors.cardNumber = 'Card number must be 16 digits'
      } else {
        paymentErrors.cardNumber = ''
      }
    }

    const formatExpiryDate = () => {
      // Remove all non-digit characters
      let value = paymentForm.expiryDate.replace(/\D/g, '')

      // Limit to 4 digits
      if (value.length > 4) {
        value = value.substring(0, 4)
      }

      // Format as MM/YY
      if (value.length >= 2) {
        const month = value.substring(0, 2)
        const year = value.substring(2)
        paymentForm.expiryDate = `${month}/${year}`
      } else {
        paymentForm.expiryDate = value
      }

      // Validate expiry date
      if (value.length === 4) {
        const month = parseInt(value.substring(0, 2))
        const year = parseInt(value.substring(2))
        const currentYear = new Date().getFullYear() % 100
        const currentMonth = new Date().getMonth() + 1

        if (month < 1 || month > 12) {
          paymentErrors.expiryDate = 'Invalid month'
        } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
          paymentErrors.expiryDate = 'Card has expired'
        } else {
          paymentErrors.expiryDate = ''
        }
      } else if (value.length > 0) {
        paymentErrors.expiryDate = 'Invalid expiry date'
      } else {
        paymentErrors.expiryDate = ''
      }
    }

    const validateCVV = () => {
      const value = paymentForm.cvv.replace(/\D/g, '')

      // Limit to 3-4 digits
      if (value.length > 4) {
        paymentForm.cvv = value.substring(0, 4)
      } else {
        paymentForm.cvv = value
      }

      // Validate CVV
      if (value.length >= 3 && value.length <= 4) {
        paymentErrors.cvv = ''
      } else if (value.length > 0) {
        paymentErrors.cvv = 'CVV must be 3-4 digits'
      } else {
        paymentErrors.cvv = ''
      }
    }

    const validateCardholderName = () => {
      if (paymentForm.cardholderName.trim().length > 0) {
        paymentErrors.cardholderName = ''
      } else if (paymentForm.cardholderName.length > 0) {
        paymentErrors.cardholderName = 'Cardholder name is required'
      } else {
        paymentErrors.cardholderName = ''
      }
    }

    // Omise card formatting
    const formatOmiseCardNumber = () => {
      let value = omiseCard.number.replace(/\D/g, '')
      if (value.length > 16) {
        value = value.substring(0, 16)
      }
      const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ')
      omiseCard.number = formatted.trim()
    }

    const loadOmiseScript = () => {
      if (window.Omise) {
        // console.log('Omise already loaded')
        return Promise.resolve()
      }

      console.log('Loading Omise.js script...')
      return new Promise((resolve, reject) => {
        if (document.getElementById('omise-script')) {
          console.log('Omise script tag already exists')
          resolve()
          return
        }

        const script = document.createElement('script')
        script.id = 'omise-script'
        script.src = 'https://cdn.omise.co/omise.js'
        script.async = true
        script.onload = () => {
          console.log('Omise.js loaded successfully')
          resolve()
        }
        script.onerror = () => {
          console.error('Failed to load Omise.js')
          reject(new Error('Failed to load Omise.js'))
        }
        document.head.appendChild(script)
      })
    }

    const validateTerms = () => {
      if (paymentForm.acceptTerms) {
        paymentErrors.acceptTerms = ''
      }
      // else {
      //   paymentErrors.acceptTerms = 'You must accept the terms and conditions'
      // }
    }

    // Tooltip function for showing soft notification
    const showTooltip = (tooltipRef, message) => {
      tooltipRef.show = true
      tooltipRef.message = message
      // Hide tooltip after 2.5 seconds
      setTimeout(() => {
        tooltipRef.show = false
      }, 2500)
    }

    // Vue Stripe Payment Element initialization
    const initStripePayment = async () => {
      stripePaymentLoading.value = true
      // 2025-11-23 GROK 4.1
      paymentElementMounted.value = false  // Reset
      // 2025-11-23 GROK 4.1

      try {
        // 1. Ensure order is in ArrangingPayment state
        if (appStore.activeOrder?.state !== 'ArrangingPayment') {
          // console.log('Order not ready, waiting...')
          stripePaymentLoading.value = false
          return
        }

        // 2. Create Stripe PaymentIntent via Vendure
        // console.log('Creating Stripe payment intent...')
        let secret
        try {
          // Pass the remaining amount to ensure correct payment amount
          secret = await createStripePaymentIntentMutation(remainingAmount.value)
          // console.log('Stripe payment intent client secret:', secret)
        } catch (stripeError) {
          // console.log('Stripe payment intent failed:', stripeError)
          // alert('Unable to initialize payment. Please try again.')
          stripePaymentLoading.value = false
          return
        }

        if (!secret) {
          // alert('No payment intent created. Please try again.')
          stripePaymentLoading.value = false
          return
        }

        // Debug: Check what key is being used
        // console.log('🔑 Stripe publishable key being used:', publishableKey)
        // console.log('🔑 Stripe publishable key first 20 chars:', publishableKey.substring(0, 20))

        // 3. Set clientSecret - Vue Stripe will handle the rest
        clientSecret.value = secret
        // 2025-11-23 GROK 4.1
        // Update elementsOptions ONLY ONCE
        elementsOptions.value.clientSecret = secret
        // 2025-11-23 GROK 4.1
        // console.log('Vue Stripe Payment Element should render automatically')
        // console.log('Client secret set, checking component state:', {
        //   elementsComponent: !!elementsComponent.value,
        //   paymentComponent: !!paymentComponent.value,
        //   paymentElementReady: paymentElementReady.value
        // })

        // Set a timeout to mark payment element as ready after reasonable delay
        setTimeout(() => {
          // console.log('Forcing payment element ready state after timeout')
          paymentElementReady.value = true
        }, 2000)

        stripePaymentLoading.value = false

      } catch (err) {
        console.error('Stripe initialization failed:', err)
        // alert('Payment system initialization failed. Please refresh the page and try again.')
        stripePaymentLoading.value = false
      }
    }

    // 2025-11-23 GROK 4.1 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    const processStripePayment = async () => {
      if (!paymentElementMounted.value) {
        // alert('Payment form is still loading. Please wait...')
        return
      }

      paymentProcessing.value = true

      try {
        const { instance: stripe } = elementsComponent.value
        const { elements } = elementsComponent.value

        if (!stripe || !elements) {
          throw new Error('Stripe not initialized')
        }

        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/order-confirmation/${appStore.activeOrder?.code}`,
          },
        })

        if (error) {
          // alert(error.message || 'Payment failed')
        }
        // On success, Stripe redirects via return_url
      } catch (err) {
        console.error('Payment error:', err)
        // alert('Payment processing failed')
      } finally {
        paymentProcessing.value = false
      }
    }

    // 2025-11-23 GROK 4.1 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


    // Trigger Vue Stripe submit
    const triggerStripeSubmit = async () => {
      await processStripePayment()
    }

    // Payment processing ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const processPayment = async () => {
      // Handle Stripe payment
      if (selectedPaymentMethod.value?.code === 'stripe') {
        await processStripePayment()
        return
      }

      // For standard payment, only validate terms acceptance
      validateTerms()

      // Check if terms are accepted
      if (!paymentForm.acceptTerms) {
        return
      }

      // alert("hello payment-----2025-11-24")


      // Start payment processing
      paymentProcessing.value = true

      try {
        // 0. Check current order state
        const orderCode = appStore.activeOrder?.code
        if (!orderCode) {
          throw new Error('No order code found')
        }

        console.log('🔄 Standard Payment: Checking current order state...')
        const initialOrder = await getOrderByCodeQuery(orderCode)
        console.log(`📊 Standard Payment: Current order state: ${initialOrder?.state}`)

        // 1. If order is in AddingItems state, transition to ArrangingPayment state
        if (initialOrder?.state === 'AddingItems') {
          console.log('🔄 Standard Payment: Order is in AddingItems state, transitioning to ArrangingPayment...')
          const transitionResult = await transitionToArrangingPaymentMutation()
          console.log('✓ Standard Payment: Order state transition result:', transitionResult)

          if (transitionResult?.__typename === 'ErrorResult') {
            throw new Error(`Failed to transition order state: ${transitionResult.message}`)
          }
        } else {
          console.log('📋 Standard Payment: Order is already in valid state for payment')
        }

        // 2. Get order ID using order code (orderCode already declared above)
        if (!orderCode) {
          throw new Error('No active order found')
        }

        // console.log('Getting order ID for code:', orderCode)
        const orderData = await getOrderByCodeQuery(orderCode)
        // console.log('Order data retrieved:', orderData)

        if (!orderData?.id) {
          throw new Error('Could not retrieve order ID')
        }

        // 2. Simulate payment to set order to PaymentSettled state
        // const paymentResult = await simulatePaymentMutation(orderData.id, remainingAmount.value)
        const paymentResult = await simulatePaymentMutation(orderData.id)


        if (paymentResult?.__typename === 'ErrorResult') {
          throw new Error(`Payment simulation failed: ${paymentResult.message}`)
        }

        // Fetch complete order data after payment to get all fields including prices
        const completeOrder = await getOrderByCodeQuery(orderCode)
        if (completeOrder && completeOrder.id) {
          appStore.setActiveOrder(completeOrder)
          console.log('✅ Updated active order with complete data, state:', completeOrder.state)
        }

        // 3. Payment successful - move to confirmation
        await confirmPayment()
      } catch (error) {
        console.error('Payment processing error:', error)
        // alert('An error occurred during payment processing. Please try again.')
      } finally {
        paymentProcessing.value = false
      }
    }

    // Omise Payment processing with full integration
    const processOmisePayment = async () => {
      console.log('===== Omise Payment Process Started =====')

      // Validate terms
      validateTerms()
      if (!paymentForm.acceptTerms) {
        console.log('❌ Omise: Terms not accepted')
        return
      }

      // Validate card fields
      if (!omiseCard.name || !omiseCard.number || !omiseCard.expiration_month || !omiseCard.expiration_year || !omiseCard.security_code) {
        omiseError.value = 'Please fill in all card details'
        console.log('❌ Omise: Card details incomplete')
        return
      }

      // Start processing
      omiseLoading.value = true
      omiseError.value = ''
      console.log('✓ Omise: Validation passed, starting tokenization')
      console.log('📋 Omise card data:', {
        name: omiseCard.name,
        number: omiseCard.number.replace(/\s/g, '').substring(0, 6) + '...',
        expiration: `${omiseCard.expiration_month}/${omiseCard.expiration_year}`
      })

      try {
        // Ensure Omise is loaded and initialized
        console.log('🔍 Checking if Omise is loaded...')
        if (!window.Omise) {
          // console.log('⚠️ Omise not loaded, loading now...')
          await loadOmiseScript()
        }

        // Set public key
        const publicKey = import.meta.env.VITE_OMISE_PUBLIC_KEY
        // console.log('🔑 Omise public key check:', publicKey ? 'Key exists' : 'Key missing!')
        if (!publicKey) {
          throw new Error('VITE_OMISE_PUBLIC_KEY not configured in .env')
        }
        window.Omise.setPublicKey(publicKey)
        console.log('✓ Omise: Public key set')

        // Create token
        console.log('🔐 Creating Omise token...')
        window.Omise.createToken('card', omiseCard, async (statusCode, response) => {
          console.log('📡 Omise tokenization response:', { statusCode, isError: response.object === 'error' })

          if (statusCode === 200) {
            const token = response.id
            console.log('✓ Omise: Token created successfully:', token)
            console.log('📤 Sending token to Vendure backend...')

            try {
              // First, transition order to ArrangingPayment state
              // console.log('🔄 Transitioning order to ArrangingPayment state...')
              const transitionResult = await transitionToArrangingPaymentMutation()
              // console.log('✓ Order state transition result:', transitionResult)

              if (transitionResult?.__typename === 'ErrorResult') {
                throw new Error(`Failed to transition order state: ${transitionResult.message}`)
              }

              if (transitionResult?.state !== 'ArrangingPayment') {
                console.warn('⚠️ Order state is:', transitionResult?.state)
              }

              // Send payment to Vendure using addPaymentToOrderMutation
              console.log('📦 Omise payment input:', {
                method: 'omise-payment',
                amount: remainingAmount.value,
                metadata: { token }
              })

              // Use real addPaymentToOrderMutation
              const paymentInput = {
                method: 'omise-payment',
                metadata: {
                  token: token // Pass the Omise token to Vendure
                }
              }

              console.log('🚀 Calling addPaymentToOrderMutation...')
              const paymentResult = await addPaymentToOrderMutation(paymentInput)
              console.log('✓ Omise: Payment result from Vendure:', paymentResult)

              if (paymentResult?.__typename === 'ErrorResult' || paymentResult?.__typename === 'PaymentDeclinedError') {
                throw new Error(`Omise payment failed: ${paymentResult.message}`)
              }

              if (paymentResult?.state === 'PaymentSettled' || paymentResult?.state === 'PaymentAuthorized') {
                console.log('✅ Omise: Payment successful, order state:', paymentResult.state)
                console.log('🔄 Redirecting to confirmation page...')
                await confirmPayment()
              } else {
                console.log('⚠️ Omise: Payment processed but order state is:', paymentResult.state)
                // Handle other states if needed
              }

            } catch (err) {
              console.error('❌ Omise: Error submitting to Vendure:', err)
              omiseError.value = err.message || 'Payment failed on server'
            } finally {
              omiseLoading.value = false
            }
          } else {
            // Tokenization failed
            console.error('❌ Omise tokenization failed:', response)
            omiseError.value = response.message || 'Card tokenization failed'
            omiseLoading.value = false
          }
        })

      } catch (error) {
        console.error('❌ Omise payment processing error:', error)
        omiseError.value = error.message || 'An error occurred during Omise payment processing'
        omiseLoading.value = false
      }
    }



    // 2026-01-20 -- popup / redirect 

    // async function startPayment(redirectUrl) {
    //   // 1. Optional: minimal test if new tab is possible
    //   const testWin = window.open('', '_blank');
    //   const likelyBlocked = !testWin || testWin.closed;

    //   if (testWin) testWin.close();  // clean up test

    //   if (likelyBlocked) {
    //     // Show your own UI warning
    //     alert("Please allow pop-ups/redirects for this site to open the payment page.\n\n" +
    //       "On Chrome: tap the lock icon → Site settings → Pop-ups and redirects → Allow\n" +
    //       "Or try long-pressing the button and open in new tab.");
    //     return;
    //   }

    //   // 2. Open payment in new tab (most reliable for gateways)
    //   const paymentWindow = window.open(redirectUrl, '_blank', 'noopener,noreferrer');

    //   if (!paymentWindow) {
    //     // Fallback: same-tab (user will lose your page state)
    //     window.location.href = redirectUrl;
    //   } else {
    //     // Optional: bring focus
    //     paymentWindow.focus();
    //   }
    // }

    async function startPayment(redirectUrl) {
      // Option 1: Preferred - try same-tab first (no popup risk, no extra tab)
      try {
        // Show loading overlay / spinner here if you want
        window.location.href = redirectUrl;
        // Code after this line usually won't run (page unloads), that's normal
      } catch (err) {
        console.warn('Same-tab redirect failed', err);
        // Very rare - fallback below
      }

      // Option 2: Fallback only if needed (e.g. you detect same-tab didn't work, or gateway requires new tab)
      // But avoid by default to prevent the "two pages" confusion you mentioned

      // Minimal popup test + open (only if you really need new tab)
      const testWin = window.open('about:blank', '_blank');
      const isBlocked = !testWin || testWin.closed === true;

      if (testWin) testWin.close();

      if (!isBlocked) {
        const paymentWin = window.open(redirectUrl, '_blank', 'noopener,noreferrer');
        if (paymentWin) {
          paymentWin.focus();
        } else {
          // blocked → show message
          showAllowPopupsMessage();
        }
      } else {
        showAllowPopupsMessage();
      }
    }

    function showAllowPopupsMessage() {
      // Your Vue modal / toast / alert
      alert(`Payment page needs to open in a new tab.\n\n` +
        `Please allow pop-ups/redirects for this site:\n` +
        `- Tap lock icon 🔒 next to URL\n` +
        `- Site settings → Pop-ups and redirects → Allow\n\n` +
        `Or long-press Pay button → "Open in new tab"`);
    }

    // 2026-01-20 -- popup / redirect 


    // NowPayments Crypto Payment processing
    const processNowPayments = async () => {
      console.log('===== NowPayments (nowpayments) Crypto Payment Process Started =====')

      // Validate terms
      validateTerms()
      if (!paymentForm.acceptTerms) {
        console.log('❌ NowPayments (nowpayments): Terms not accepted')
        return
      }

      // Start processing
      nowpaymentsLoading.value = true
      nowpaymentsError.value = ''
      console.log('✓ NowPayments (nowpayments): Starting payment process')

      try {
        // 1. Check current order state
        const currentOrder = await getActiveOrderQuery()
        console.log('📦 NowPayments (nowpayments): Current order state:', currentOrder?.state)

        // 2. Only transition to ArrangingPayment if not already in that state
        if (currentOrder?.state !== 'ArrangingPayment') {
          console.log('🔄 NowPayments (nowpayments): Transitioning order to ArrangingPayment state...')
          const transitionResult = await transitionToArrangingPaymentMutation()
          console.log('✓ NowPayments (nowpayments): Order state transition result:', transitionResult)

          if (transitionResult?.__typename === 'ErrorResult') {
            throw new Error(`Failed to transition order state: ${transitionResult.message}`)
          }
        } else {
          console.log('✓ NowPayments (nowpayments): Order already in ArrangingPayment state, skipping transition')
        }

        // 3. Use the new mutation to initiate NowPayments payment
        // This will return the redirect URL
        console.log('🚀 NowPayments (nowpayments): Calling initiateNowPaymentsPaymentMutation...')
        console.log('🚀 NowPayments (nowpayments): Passing amount:', remainingAmount.value)

        // const redirectUrl = await initiateNowPaymentsPaymentMutation(remainingAmount.value)
        const redirectUrl = await initiateNowPaymentsPaymentMutation()
        console.log('✓ NowPayments (nowpayments): Received redirect URL:', redirectUrl)

        if (!redirectUrl) {
          throw new Error('No payment redirect URL received from NowPayments')
        }

        // Use the redirect URL directly
        console.log('🔗 NowPayments: Redirecting to NowPayments page:', redirectUrl)
        console.log('🌐 NowPayments: Full URL decoded:', decodeURIComponent(redirectUrl))

        // Redirect user to NowPayments payment page

        // 2026-01-20
        // window.location.href = redirectUrl
        startPayment(redirectUrl)
        // 2026-01-20

        // Note: Return here to prevent further execution
        // The user will complete payment on NowPayments and be redirected back
        return

      } catch (error) {
        console.error('❌ NowPayments (now-payments) payment processing error:', error)
        nowpaymentsError.value = error.message || 'An error occurred during crypto payment processing'
        nowpaymentsLoading.value = false
      }
    }


    // Note: We don't need finally block with loading = false here
    // because if redirect succeeds, the page unloads anyway
    // If there's an error, we set loading = false in the catch block

    // PromptPay Payment processing
    const processPromptPayPayment = async () => {
      console.log('===== PromptPay Payment Process Started =====')

      // Validate terms
      validateTerms()
      if (!paymentForm.acceptTerms) {
        console.log('❌ PromptPay: Terms not accepted')
        return
      }

      // Validate minimum amount (20 Baht)
      const remaining = remainingAmount.value
      if (remaining < 2000) { // Amount is in cents, so 2000 = 20.00 Baht
        showTooltip(promptPayTooltip, 'Payment amount must be greater than or equal to 20 Baht')
        console.log('❌ PromptPay: Amount too low:', remaining / 100, 'Baht')
        return
      }

      // Start processing
      promptPayLoading.value = true
      promptPayError.value = ''

      try {
        // 0. Get the order code and fetch initial amountPaid
        const orderCode = appStore.activeOrder?.code
        if (!orderCode) {
          throw new Error('No order code found')
        }

        console.log('🔄 PromptPay: Fetching initial order data...')
        const initialOrder = await getOrderByCodeQuery(orderCode)
        promptPayInitialAmountPaid.value = initialOrder?.customFields?.amountPaid || 0
        console.log(`✓ PromptPay: Initial amountPaid recorded: ${promptPayInitialAmountPaid.value}`)
        console.log(`📊 PromptPay: Current order state: ${initialOrder?.state}`)

        // 1. If order is in AddingItems state, transition to ArrangingPayment state
        if (initialOrder?.state === 'AddingItems') {
          console.log('🔄 PromptPay: Order is in AddingItems state, transitioning to ArrangingPayment...')
          const transitionResult = await transitionToArrangingPaymentMutation()
          console.log('✓ PromptPay: Order state transition result:', transitionResult)

          if (transitionResult?.__typename === 'ErrorResult') {
            throw new Error(`Failed to transition order state: ${transitionResult.message}`)
          }
        } else {
          console.log('📋 PromptPay: Order is already in valid state for payment')
        }

        // 2. Call the PromptPay mutation to generate QR code
        console.log('🚀 PromptPay: Calling createOmisePromptPayChargeMutation...')
        const promptPayResult = await createOmisePromptPayChargeMutation()
        console.log('✓ PromptPay: QR Code generation result:', promptPayResult)

        if (!promptPayResult?.qrCodeUrl) {
          throw new Error('No QR code URL received from PromptPay')
        }

        // 3. Set the QR code URL to display
        promptPayQrUrl.value = promptPayResult.qrCodeUrl
        console.log('✅ PromptPay: QR code URL set successfully')

        // 4. Start polling for payment status
        console.log('🔄 PromptPay: Starting order status polling...')
        pollOrderStatus()

      } catch (error) {
        console.error('❌ PromptPay payment processing error:', error)
        promptPayError.value = error.message || 'An error occurred during PromptPay payment processing'
        promptPayLoading.value = false
      }
    }

    // PromptPay Partial Payment processing
    const processPromptPayPartialPayment = async () => {
      console.log('===== PromptPay Partial Payment Process Started =====')

      // Validate terms
      validateTerms()
      if (!paymentForm.acceptTerms) {
        console.log('❌ PromptPay Partial: Terms not accepted')
        return
      }

      // Validate minimum amount (50 Baht)
      const remaining = remainingAmount.value
      if (remaining < 5000) { // Amount is in cents, so 5000 = 50.00 Baht
        showTooltip(promptPayPartialTooltip, 'Payment amount must be greater than or equal to 50 Baht')
        console.log('❌ PromptPay Partial: Amount too low:', remaining / 100, 'Baht')
        return
      }

      // Start processing
      promptPayPartialLoading.value = true
      promptPayPartialError.value = ''

      try {
        // 0. Get the order code and fetch initial amountPaid
        const orderCode = appStore.activeOrder?.code
        if (!orderCode) {
          throw new Error('No order code found')
        }

        console.log('🔄 PromptPay Partial: Fetching initial order data...')
        const initialOrder = await getOrderByCodeQuery(orderCode)
        promptPayPartialInitialAmountPaid.value = initialOrder?.customFields?.amountPaid || 0
        console.log(`✓ PromptPay Partial: Initial amountPaid recorded: ${promptPayPartialInitialAmountPaid.value}`)
        console.log(`📊 PromptPay Partial: Current order state: ${initialOrder?.state}`)

        // 1. If order is in AddingItems state, transition to ArrangingPayment state
        if (initialOrder?.state === 'AddingItems') {
          console.log('🔄 PromptPay Partial: Order is in AddingItems state, transitioning to ArrangingPayment...')
          const transitionResult = await transitionToArrangingPaymentMutation()
          console.log('✓ PromptPay Partial: Order state transition result:', transitionResult)

          if (transitionResult?.__typename === 'ErrorResult') {
            throw new Error(`Failed to transition order state: ${transitionResult.message}`)
          }
        } else {
          console.log('📋 PromptPay Partial: Order is already in valid state for payment')
        }

        // 2. Call the PromptPay Partial mutation to generate QR code
        console.log('🚀 PromptPay Partial: Calling createOmisePromptPayPartialChargeMutation...')
        const promptPayResult = await createOmisePromptPayPartialChargeMutation()
        console.log('✓ PromptPay Partial: QR Code generation result:', promptPayResult)

        if (!promptPayResult?.qrCodeUrl) {
          throw new Error('No QR code URL received from PromptPay Partial')
        }

        // 3. Set the QR code URL to display
        promptPayPartialQrUrl.value = promptPayResult.qrCodeUrl
        console.log('✅ PromptPay Partial: QR code URL set successfully')

        // 4. Start polling for payment status
        console.log('🔄 PromptPay Partial: Starting order status polling...')
        pollOrderStatus()

      } catch (error) {
        console.error('❌ PromptPay Partial payment processing error:', error)
        promptPayPartialError.value = error.message || 'An error occurred during PromptPay Partial payment processing'
        promptPayPartialLoading.value = false
      }
    }

    // Poll order status to detect payment completion
    const pollOrderStatus = async () => {
      const pollInterval = 5000 // Poll every 5 seconds
      const maxAttempts = 60 // Max 5 minutes (60 * 5s = 300s)
      let attempts = 0
      let pollingInterval = null // Define variable at function scope

      const checkStatus = async () => {
        attempts++
        console.log(`🔄 PromptPay Polling: Attempt ${attempts}/${maxAttempts}`)

        try {
          // Use getOrderByCodeQuery to get order even in PaymentSettled state
          // activeOrder query returns null for settled orders
          const orderCode = appStore.activeOrder?.code
          if (!orderCode) {
            console.log('❌ PromptPay Polling: No order code available')
            return
          }

          const order = await getOrderByCodeQuery(orderCode)
          const orderState = order?.state
          const amountPaid = order?.customFields?.amountPaid || 0
          const totalDue = order?.totalWithTax || 0

          // Determine which initial amountPaid to use based on which payment method is active
          const initialAmountPaid = promptPayQrUrl.value ? promptPayInitialAmountPaid.value : promptPayPartialInitialAmountPaid.value

          console.log(`📊 PromptPay Polling: Current order state: ${orderState}`)
          console.log(`📊 PromptPay Polling: Amount paid: ${amountPaid}, Initial amount: ${initialAmountPaid}, Total due: ${totalDue}`)
          console.log(`📊 PromptPay Polling: Full order object:`, order)

          // Case 1: The order is fully paid
          if (orderState === 'PaymentSettled') {
            console.log('✅ PromptPay: Payment confirmed! Order is PaymentSettled')
            stopPolling()
            // Clear the cart/badge by clearing the active order
            appStore.setActiveOrder({})
            console.log('🧹 Cart cleared after successful payment')
            // Pass order code to confirmation page
            router.push(`/checkout/confirmation/${orderCode}`)
            return
          }

          // Case 2: User has made a payment (partial or complete) - NEW LOGIC
          // Check if amountPaid has increased from the initial value
          if (orderState === 'ArrangingPayment' && amountPaid > initialAmountPaid) {
            console.log('⚠️ PromptPay: Payment detected! New amount paid is greater than initial.')

            // Check if fully paid or partially paid
            if (amountPaid >= totalDue) {
              console.log('✅ PromptPay: Full payment detected!')
              stopPolling()
              appStore.setActiveOrder({})
              router.push(`/checkout/confirmation/${orderCode}`)
            } else {
              console.log('⚠️ PromptPay: Partial payment detected. Redirecting to unsettled orders...')
              stopPolling()
              // Do NOT clear the cart for partial payments - order is not settled yet
              console.log('🔄 Redirecting to unsettled orders without clearing cart')
              // alert('Payment has been processed. You can check your order status on the unsettled orders page.')
              router.push('/orders/unsettled')
            }

            return
          }

          // Case 3: The order has other unexpected states
          if (orderState !== 'ArrangingPayment') {
            console.log(`❌ PromptPay: Order has an unexpected state: ${orderState}. Stopping poll.`)
            stopPolling()
            // alert('Payment was not completed. Please try again.')
            return
          }

          // Case 4: The order is still 'ArrangingPayment' with no change in amount paid
          // Do nothing and let the next poll run
          console.log('⏳ PromptPay: Awaiting payment...')

          if (attempts >= maxAttempts) {
            console.log('⏱️ PromptPay: Max polling attempts reached. Stopping poll.')
            stopPolling()
            // alert('Payment confirmation is taking longer than expected. Please check your order status later.')
            router.push('/orders/unsettled')
            return
          }
        } catch (error) {
          console.error('❌ PromptPay Polling: Error checking order status:', error)
        }
      }

      const stopPolling = () => {
        console.log('🛑 PromptPay: Stopping order status polling')
        if (pollingInterval) {
          clearInterval(pollingInterval)
        }
        promptPayLoading.value = false
        promptPayPartialLoading.value = false
      }

      // Start polling
      console.log('🔄 PromptPay: Starting order status polling...')
      pollingInterval = setInterval(checkStatus, pollInterval)

      // Store pollingInterval in component scope for potential external cancellation
      pollIntervalRef.value = pollingInterval
    }

    const selectPaymentMethod = (method) => {
      selectedPaymentMethod.value = method
    }

    // Auto-select default payment method when payment methods are loaded
    watch(eligiblePaymentMethods, (newMethods) => {
      if (newMethods.length > 0 && !selectedPaymentMethod.value) {
        selectedPaymentMethod.value = getDefaultPaymentMethod()
      }
    }, { immediate: true })

    // Watch for CVV changes to validate
    watch(() => paymentForm.cvv, validateCVV)

    // Watch for cardholder name changes to validate
    watch(() => paymentForm.cardholderName, validateCardholderName)

    // Watch for terms acceptance changes to validate
    watch(() => paymentForm.acceptTerms, validateTerms)

    // Initialize Stripe when Stripe payment method is selected
    watch(selectedPaymentMethod, async (newMethod) => {
      if (newMethod?.code === 'stripe') {
        // Delay to ensure DOM is ready and avoid conflicts with proceedToPayment
        setTimeout(() => {
          initStripePayment()
        }, 300)
      }
    })




    // Cleanup polling on component unmount
    onUnmounted(() => {
      if (pollIntervalRef.value) {
        console.log('🧹 Cleanup: Clearing PromptPay polling interval on component unmount')
        clearInterval(pollIntervalRef.value)
        pollIntervalRef.value = null
      }
    })

    // Redirect to home if cart is empty
    onMounted(async () => {
      appStore.setShowCart(false)

      // Load Omise script on component mount
      // console.log('CheckoutPayment component mounted, checking if Omise should be loaded...')
      try {
        await loadOmiseScript()
        const publicKey = import.meta.env.VITE_OMISE_PUBLIC_KEY
        if (window.Omise && publicKey) {
          window.Omise.setPublicKey(publicKey)
          // console.log('✓ Omise initialized successfully')
        } else {
          // console.log('⚠️ Omise key not configured, will load when payment method selected')
        }
      } catch (error) {
        console.error('❌ Failed to initialize Omise:', error.message)
      }

      if (!appStore.activeOrder?.lines?.length) {
        router.push('/')
        return
      }

      // Refresh the active order to ensure we have the latest shipping data
      try {
        const refreshedOrder = await getActiveOrderQuery()
        if (refreshedOrder) {
          // console.log('CheckoutPayment - Refreshed order shipping cost:', refreshedOrder.shippingWithTax)
          // console.log('CheckoutPayment - Refreshed order total cost:', refreshedOrder.totalWithTax)
          appStore.setActiveOrder(refreshedOrder)

          // Fetch payment history using orderByCode to get complete payment data
          if (refreshedOrder.code) {
            try {
              const orderWithPayments = await getOrderByCodeQuery(refreshedOrder.code)
              if (orderWithPayments?.payments) {
                // console.log('CheckoutPayment - Payment history fetched:', orderWithPayments.payments)
                paymentData.value = orderWithPayments.payments
              }
            } catch (paymentError) {
              console.error('Error fetching payment history:', paymentError)
              // Non-critical error, continue without payment history
            }
          }
        }
      } catch (error) {
        console.error('Error refreshing order in CheckoutPayment:', error)
      }

      // Log the current shipping cost for debugging
      // console.log('CHECKOUT PAYMENT - Current shipping cost:', appStore.activeOrder?.shippingWithTax)
      // console.log('CHECKOUT PAYMENT - Current total cost:', appStore.activeOrder?.totalWithTax)
    })

    // Watch for Payment Element mounting
    watch(paymentComponent, (newComponent) => {
      // console.log('Payment Component changed:', {
      //   hasComponent: !!newComponent,
      //   hasElement: !!newComponent?.element,
      //   element: newComponent?.element
      // })
      if (newComponent?.element) {
        // console.log('Payment Element is now mounted and ready')
        paymentElementReady.value = true
      } else {
        // console.log('Payment Element not mounted yet')
        paymentElementReady.value = false
      }
    }, { deep: true })

    // Watch for client secret to enable payment element after reasonable time
    watch(clientSecret, (newSecret) => {
      if (newSecret) {
        // console.log('Client secret set, enabling payment element after delay')
        // console.log('Checking component refs state:', {
        //   elementsComponent: !!elementsComponent.value,
        //   paymentComponent: !!paymentComponent.value
        // })
        // Give the Payment Element time to mount
        setTimeout(() => {
          // console.log('Payment Element should be ready now')
          // console.log('Component refs state after delay:', {
          //   elementsComponent: !!elementsComponent.value,
          //   paymentComponent: !!paymentComponent.value
          // })
          paymentElementReady.value = true
        }, 1500)
      }
    })

    // Payment history computed properties
    const payments = computed(() => {
      // Use fetched payment data if available, fall back to activeOrder payments
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
      return totalAmount.value - totalPaid.value
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

    async function confirmPayment() {
      try {
        // Stock validation already done in cart before checkout
        // In a real implementation, this would process the payment
        // Navigate to confirmation page
        router.push('/checkout/confirmation')
      } catch (error) {
        console.error('Error during checkout:', error)
        // alert('An error occurred during checkout. Please try again.')
      }
    }

    return {
      onStripeElementsLoad,
      onPaymentElementReady,
      onPaymentElementLoad,
      paymentElementMounted,
      stripeLoaded,
      appStore,
      formatPrice,
      confirmPayment,
      eligiblePaymentMethods,
      selectedPaymentMethod,
      selectPaymentMethod,
      paymentProcessing,
      paymentForm,
      paymentErrors,
      isPaymentFormValid,
      totalAmount,
      formattedTotal,
      payments,
      totalPaid,
      remainingAmount,
      formatPaymentState,
      formatCardNumber,
      formatExpiryDate,
      validateCVV,
      processPayment,
      processNowPayments,
      processOmisePayment,
      processStripePayment,
      triggerStripeSubmit,
      stripePaymentLoading,
      paymentElementReady,
      clientSecret,
      publishableKey,
      elementsComponent,
      paymentComponent,
      stripeOptions,
      elementsOptions,
      paymentElementOptions,
      // Omise exports
      omiseLoading,
      omiseError,
      omiseCard,
      formatOmiseCardNumber,
      loadOmiseScript,
      // NowPayments exports
      nowpaymentsLoading,
      nowpaymentsError,
      // PromptPay exports
      promptPayLoading,
      promptPayError,
      promptPayQrUrl,
      promptPayTooltip,
      promptPayInitialAmountPaid,
      processPromptPayPayment,
      // PromptPay Partial exports
      promptPayPartialLoading,
      promptPayPartialError,
      promptPayPartialQrUrl,
      promptPayPartialTooltip,
      promptPayPartialInitialAmountPaid,
      processPromptPayPartialPayment,
      pollOrderStatus
    }
  }
}
</script>