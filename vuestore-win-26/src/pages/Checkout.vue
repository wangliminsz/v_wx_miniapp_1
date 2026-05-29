<template>
  <div>
    <div v-if="appStore.activeOrder?.id" class="bg-gray-50 pb-16">
      <div
        :class="[
          'max-w-2xl mx-auto pt-8 mb-12 px-4 sm:px-6 lg:px-8',
          currentStep === 'CONFIRMATION' ? 'lg:max-w-3xl' : 'lg:max-w-7xl'
        ]"
      >
        <h2 class="sr-only">Checkout</h2>

        <!-- Checkout Steps Navigation -->
        <nav class="hidden sm:block pb-8 mb-8 border-b">
          <ol class="flex space-x-4 justify-center">
            <li
              v-for="(step, index) in steps"
              :key="step.state"
              class="flex items-center"
            >
              <!-- Make previous steps clickable for navigation -->
              <button
                v-if="currentStep !== step.state && canNavigateToStep(step.state)"
                @click="navigateToStep(step.state)"
                :class="[
                  'text-sm font-medium hover:text-primary-500 transition-colors',
                  step.state === currentStep ? 'text-primary-600' : 'text-gray-500'
                ]"
              >
                {{ step.name }}
              </button>
              <span
                v-else
                :class="[
                  'text-sm font-medium',
                  step.state === currentStep ? 'text-primary-600' : 'text-gray-500'
                ]"
              >
                {{ step.name }}
              </span>
              <span v-if="index !== steps.length - 1" class="ml-4 text-gray-300">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </li>
          </ol>
        </nav>

        <div class="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
          <!-- Checkout Steps Content -->
          <div :class="currentStep === 'CONFIRMATION' ? 'lg:col-span-2' : ''">
            <!-- Shipping Step -->
            <div v-if="currentStep === 'SHIPPING'">
              <div>
                <h2 class="text-lg font-medium text-gray-900">Contact information</h2>
                <form>
                  <div class="mt-4">
                    <label class="block text-sm font-medium text-gray-700">Email address</label>
                    <div class="mt-1">
                      <input
                        type="email"
                        v-model="customer.emailAddress"
                        class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  <div class="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">


                    <div>
                      <label class="block text-sm font-medium text-gray-700">Last name</label>
                      <div class="mt-1">
                        <input
                          type="text"
                          v-model="customer.lastName"
                          class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>
                    </div>



                    <div>
                      <label class="block text-sm font-medium text-gray-700">First name</label>
                      <div class="mt-1">
                        <input
                          type="text"
                          v-model="customer.firstName"
                          class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    


                  </div>
                </form>
              </div>

              <div class="mt-10 border-t border-gray-200 pt-10">
                <div class="flex justify-between items-center">
                  <h2 class="text-lg font-medium text-gray-900">Shipping info</h2>
                  <div class="flex items-center space-x-6">
                    <!-- Address Selection Dropdown -->
                    <div v-if="hasMultipleAddresses" class="flex items-center space-x-2">
                      <!-- <label class="text-sm font-medium text-gray-700">Select Address:</label> -->
                      <select
                        v-model="selectedAddressId"
                        @change="selectAddress(selectedAddressId)"
                        class="block w-64 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      >
                        <option value="">Choose an address</option>
                        <option v-for="address in customerAddresses" :key="address.id" :value="address.id">
                          {{ address.fullName }} - {{ address.city }}
                        </option>
                      </select>
                    </div>
                    <div class="relative group">
                      <button
                        @click="showAddressModal = true"
                        :class="[
                          'inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-300',
                          hasShippingAddress
                            ? 'bg-primary-600 hover:bg-primary-700'
                            : 'bg-primary-600 hover:bg-primary-700 animate-pulse-slow'
                        ]"
                      >
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                        {{ hasShippingAddress ? 'Add' : 'Add Address' }}
                      </button>

                      <!-- Tooltip -->
                      <div v-if="!hasShippingAddress" class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-10">
                        Add a shipping address to continue
                        <div class="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Shipping Address Display -->
              <div class="mt-4 bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div v-if="hasShippingAddress" class="space-y-4">
                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Full name</label>
                      <div class="mt-1 text-sm text-gray-900">{{ shippingAddress.fullName || 'Not provided' }}</div>
                    </div>

                    <div class="sm:col-span-2">
                      <label class="block text-sm font-medium text-gray-700">Company</label>
                      <div class="mt-1 text-sm text-gray-900">{{ shippingAddress.company || 'Not provided' }}</div>
                    </div>

                    <div class="sm:col-span-2">
                      <label class="block text-sm font-medium text-gray-700">Address</label>
                      <div class="mt-1 text-sm text-gray-900">{{ shippingAddress.streetLine1 || 'Not provided' }}</div>
                    </div>

                    <div class="sm:col-span-2">
                      <label class="block text-sm font-medium text-gray-700">Apartment, suite, etc.</label>
                      <div class="mt-1 text-sm text-gray-900">{{ shippingAddress.streetLine2 || 'Not provided' }}</div>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700">City</label>
                      <div class="mt-1 text-sm text-gray-900">{{ shippingAddress.city || 'Not provided' }}</div>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700">Country</label>
                      <div class="mt-1 text-sm text-gray-900">{{ getCountryName(shippingAddress.countryCode) || 'Not provided' }}</div>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700">State / Province</label>
                      <div class="mt-1 text-sm text-gray-900">{{ shippingAddress.province || 'Not provided' }}</div>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700">Postal code</label>
                      <div class="mt-1 text-sm text-gray-900">{{ shippingAddress.postalCode || 'Not provided' }}</div>
                    </div>

                    <div class="sm:col-span-2">
                      <label class="block text-sm font-medium text-gray-700">Phone</label>
                      <div class="mt-1 text-sm text-gray-900">{{ shippingAddress.phoneNumber || 'Not provided' }}</div>
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
                  <h3 class="mt-2 text-sm font-medium text-blue-800">Shipping address required</h3>
                  <p class="mt-1 text-sm text-blue-600">Please add a shipping address to continue with checkout.</p>
                  <button
                    @click="showAddressModal = true"
                    class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 animate-pulse-slow"
                  >
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Shipping Address
                  </button>
                </div>
              </div>

              <!-- Delivery Method Section -->
              <div v-if="hasShippingAddress" class="mt-10 border-t border-gray-200 pt-10">
                <h2 class="text-lg font-medium text-gray-900 mb-6">Delivery method</h2>

                <!-- Loading state -->
                <div v-if="eligibleShippingMethods.length === 0" class="text-center py-8">
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p class="mt-2 text-gray-600">Loading shipping methods...</p>
                </div>

                <!-- Delivery Method Options - Simplified Qwik-style cards -->
                <div v-else class="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                  <div
                    v-for="method in eligibleShippingMethods"
                    :key="method.id"
                    :class="[
                      'relative bg-white border rounded-lg shadow-sm p-4 flex cursor-pointer focus:outline-none',
                      selectedShippingMethod?.id === method.id
                        ? 'border-primary-500 border-2'
                        : 'border-gray-300'
                    ]"
                    @click="selectShippingMethod(method)"
                  >
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
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                      </svg>
                    </div>

                    <!-- Border highlight for selected method -->
                    <span
                      :class="[
                        'border-2 absolute -inset-px rounded-lg pointer-events-none',
                        selectedShippingMethod?.id === method.id ? 'border-primary-500' : ''
                      ]"
                    ></span>
                  </div>
                </div>

              </div>


            </div>

            <!-- Payment Step -->
            <div v-else-if="currentStep === 'PAYMENT'">
              <h3 class="text-lg font-medium text-gray-900 mb-6">Payment Information</h3>
              <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <!-- Payment Methods Selection -->
                <div class="mb-8">
                  <h4 class="text-md font-medium text-gray-900 mb-4">Select Payment Method</h4>
                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div
                      v-for="method in eligiblePaymentMethods"
                      :key="method.id"
                      :class="[
                        'relative bg-white border rounded-lg shadow-sm p-4 flex cursor-pointer focus:outline-none',
                        selectedPaymentMethod?.id === method.id
                          ? 'border-primary-500 border-2'
                          : 'border-gray-300 hover:border-gray-400'
                      ]"
                      @click="selectPaymentMethod(method)"
                    >
                      <span class="flex-1 flex">
                        <span class="flex flex-col">
                          <span class="block text-sm font-medium text-gray-900">{{ method.name }}</span>
                          <span class="mt-1 text-xs text-gray-500">{{ method.description }}</span>
                        </span>
                      </span>
                      <div v-if="selectedPaymentMethod?.id === method.id" class="flex-shrink-0">
                        <svg class="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Payment Form -->
                <div v-if="selectedPaymentMethod" class="border-t border-gray-200 pt-6">
                  <h4 class="text-md font-medium text-gray-900 mb-4">{{ selectedPaymentMethod.name }} Details</h4>

                  <!-- Payment Processing State -->
                  <div v-if="paymentProcessing" class="mb-6">
                    <div class="flex items-center justify-center py-8">
                      <div class="text-center">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                        <p class="mt-4 text-gray-600">Processing your payment...</p>
                      </div>
                    </div>
                  </div>

                  <!-- Stripe Payment Element with Vue Stripe -->
                  <div v-else-if="selectedPaymentMethod?.code === 'stripe'" class="space-y-6">
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center">
                          <div class="flex-shrink-0">
                            <svg class="h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
                            </svg>
                          </div>
                          <div class="ml-3">
                            <h3 class="text-sm font-medium text-blue-800">Secure Payment with Stripe</h3>
                            <p class="text-sm text-blue-600">Complete your payment securely using Stripe Payment Element.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Vue Stripe Payment Element -->
                    <div class="border border-gray-300 rounded-lg p-4 bg-white">
                      <!-- Loading state -->
                      <div v-if="stripePaymentLoading" class="text-center py-8">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                        <p class="mt-2 text-gray-600">Loading payment form...</p>
                      </div>

                      <!-- Vue Stripe Payment Element -->
                      <div v-else-if="clientSecret && selectedPaymentMethod?.code === 'stripe'" class="min-h-48">
                        <!-- <StripeElements
                          :stripe-key="publishableKey"
                          :instance-options="stripeOptions"
                          :elements-options="elementsOptions"
                          ref="elementsComponent"
                        >
                          <StripeElement
                            type="payment"
                            :options="paymentElementOptions"
                            ref="paymentComponent"
                          />
                        </StripeElements> -->

                        <!-- 2025-11-23 by GROK 4.1 -->
                        <!-- @load="onPaymentElementLoad" -->
                         
                        <StripeElements
                          v-if="clientSecret"
                          :stripe-key="publishableKey"
                          :elements-options="elementsOptions"
                          ref="elementsComponent"
                          @load="onStripeElementsLoad"
                        >
                         <StripeElement
                            type="payment"
                            :options="paymentElementOptions"
                            ref="paymentComponent"
                            @ready="onPaymentElementReady"
                            
                         />
                        </StripeElements>
                      </div>

                      <!-- 2025-11-23 by GROK 4.1 -->

                      <!-- Confirm Payment Button -->
                      <div class="mt-6 pt-4 border-t border-gray-200">
                        <!-- <button
                          @click="triggerStripeSubmit"
                          :disabled="!paymentForm.acceptTerms || stripePaymentLoading || !clientSecret || !paymentElementReady"
                          :class="[
                            'w-full flex items-center justify-center space-x-2 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300',
                            (paymentForm.acceptTerms && !stripePaymentLoading && clientSecret && paymentElementReady)
                              ? 'bg-blue-600 hover:bg-blue-700'
                              : 'bg-gray-400 cursor-not-allowed'
                          ]"
                        >
                          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
                          </svg>
                          <span>Confirm Payment - {{ formatPrice(totalAmount, appStore.activeOrder?.currencyCode) }}</span>
                        </button> -->

                        <!-- 2025-11-23 GROK 4.1 -->

                        <button
                          @click="triggerStripeSubmit"
                          :disabled="!paymentForm.acceptTerms || stripePaymentLoading || !clientSecret || !paymentElementMounted"
                          :class="[
                            'w-full ...',
                            (paymentForm.acceptTerms && !stripePaymentLoading && clientSecret && paymentElementMounted)
                              ? 'bg-blue-600 hover:bg-blue-700'
                              : 'bg-gray-400 cursor-not-allowed'
                          ]"
                        >
                          <span>Confirm Payment - {{ formatPrice(totalAmount, appStore.activeOrder?.currencyCode) }}</span>
                        </button>

                        <!-- 2025-11-23 GROK 4.1 -->
                      
                      
                      
                      
                      </div>
                    </div>

                    <!-- Terms and Conditions -->
                    <div class="flex items-center mt-4">
                      <input
                        type="checkbox"
                        v-model="paymentForm.acceptTerms"
                        id="acceptTermsStripe"
                        class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label for="acceptTermsStripe" class="ml-2 block text-sm text-gray-900">
                        I agree to the <a href="#" class="text-primary-600 hover:text-primary-500">Terms and Conditions</a>
                      </label>
                    </div>
                    <p v-if="paymentErrors.acceptTerms" class="mt-1 text-sm text-red-600">{{ paymentErrors.acceptTerms }}</p>
                  </div>

                  <!-- Standard Payment Form -->
                  <form v-else-if="selectedPaymentMethod?.code === 'standard-payment'" @submit.prevent="processPayment" class="space-y-6">
                    <!-- Card Number -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                      <div class="relative">
                        <input
                          type="text"
                          v-model="paymentForm.cardNumber"
                          placeholder="1234 5678 9012 3456"
                          maxlength="19"
                          @input="formatCardNumber"
                          :class="[
                            'block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm pl-10',
                            paymentErrors.cardNumber ? 'border-red-300' : ''
                          ]"
                        />
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </div>
                      </div>
                      <p v-if="paymentErrors.cardNumber" class="mt-1 text-sm text-red-600">{{ paymentErrors.cardNumber }}</p>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                      <!-- Expiry Date -->
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                        <input
                          type="text"
                          v-model="paymentForm.expiryDate"
                          placeholder="MM/YY"
                          maxlength="5"
                          @input="formatExpiryDate"
                          :class="[
                            'block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm',
                            paymentErrors.expiryDate ? 'border-red-300' : ''
                          ]"
                        />
                        <p v-if="paymentErrors.expiryDate" class="mt-1 text-sm text-red-600">{{ paymentErrors.expiryDate }}</p>
                      </div>

                      <!-- CVV -->
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                        <input
                          type="text"
                          v-model="paymentForm.cvv"
                          placeholder="123"
                          maxlength="4"
                          :class="[
                            'block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm',
                            paymentErrors.cvv ? 'border-red-300' : ''
                          ]"
                        />
                        <p v-if="paymentErrors.cvv" class="mt-1 text-sm text-red-600">{{ paymentErrors.cvv }}</p>
                      </div>
                    </div>

                    <!-- Cardholder Name -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Cardholder Name</label>
                      <input
                        type="text"
                        v-model="paymentForm.cardholderName"
                        placeholder="John Doe"
                        :class="[
                          'block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm',
                          paymentErrors.cardholderName ? 'border-red-300' : ''
                        ]"
                      />
                      <p v-if="paymentErrors.cardholderName" class="mt-1 text-sm text-red-600">{{ paymentErrors.cardholderName }}</p>
                    </div>

                    <!-- Billing Address (Optional) -->
                    <div class="border-t border-gray-200 pt-6">
                      <div class="flex items-center mb-4">
                        <input
                          type="checkbox"
                          v-model="paymentForm.useDifferentBillingAddress"
                          id="differentBillingAddress"
                          class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label for="differentBillingAddress" class="ml-2 block text-sm text-gray-900">
                          Use different billing address
                        </label>
                      </div>

                      <div v-if="paymentForm.useDifferentBillingAddress" class="space-y-4 bg-gray-50 p-4 rounded-md">
                        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div class="sm:col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Billing Address</label>
                            <input
                              type="text"
                              v-model="paymentForm.billingAddress"
                              placeholder="Enter billing address"
                              class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">City</label>
                            <input
                              type="text"
                              v-model="paymentForm.billingCity"
                              placeholder="Enter city"
                              class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                            <input
                              type="text"
                              v-model="paymentForm.billingPostalCode"
                              placeholder="Enter postal code"
                              class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Terms and Conditions -->
                    <div class="flex items-center">
                      <input
                        type="checkbox"
                        v-model="paymentForm.acceptTerms"
                        id="acceptTerms"
                        class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label for="acceptTerms" class="ml-2 block text-sm text-gray-900">
                        I agree to the <a href="#" class="text-primary-600 hover:text-primary-500">Terms and Conditions</a>
                      </label>
                    </div>
                    <p v-if="paymentErrors.acceptTerms" class="text-sm text-red-600">{{ paymentErrors.acceptTerms }}</p>

                    <!-- Submit Button -->
                    <div class="flex justify-center">
                      <button
                        type="submit"
                        :disabled="!isPaymentFormValid"
                        :class="[
                          'flex px-8 bg-primary-600 hover:bg-primary-700 items-center justify-center space-x-2 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-300',
                          isPaymentFormValid
                            ? 'bg-primary-600 hover:bg-primary-700'
                            : 'bg-gray-400 cursor-not-allowed'
                        ]"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <span>Complete Payment - {{ formatPrice(totalAmount, appStore.activeOrder?.currencyCode) }}</span>
                      </button>
                    </div>
                  </form>
                </div>

                <!-- Payment Method Not Selected -->
                <div v-else-if="!selectedPaymentMethod" class="text-center py-8">
                  <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <h3 class="mt-2 text-sm font-medium text-gray-900">Select a payment method</h3>
                  <p class="mt-1 text-sm text-gray-500">Please choose a payment method to continue.</p>
                </div>

              </div>
            </div>

            <!-- Confirmation Step -->
            <div v-else-if="currentStep === 'CONFIRMATION'">
              <div class="text-center">
                <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 class="mt-4 text-2xl font-medium text-gray-900">Order Confirmed!</h3>
                <p class="mt-2 text-gray-600">
                  Thank you for your order. Your order number is
                  <span class="font-medium text-gray-900">{{ appStore.activeOrder?.code }}</span>.
                </p>
                <div class="mt-8">
                  <router-link
                    to="/"
                    class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    Continue Shopping
                  </router-link>
                </div>
              </div>
            </div>
          </div>

          <!-- Order Summary -->
          <div v-if="currentStep !== 'CONFIRMATION'" class="mt-10 lg:mt-0">

            <h2 class="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
            <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <!-- Cart Contents -->
              <div class="space-y-4 mb-6">
                <div
                  v-for="line in appStore.activeOrder?.lines || []"
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
                    {{ formatPrice(line.linePriceWithTax, appStore.activeOrder?.currencyCode) }}
                  </div>
                </div>
              </div>

              <!-- Order Totals -->
              <div class="border-t border-gray-200 pt-4 space-y-2">
                <div class="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{{ formatPrice(appStore.activeOrder?.subTotalWithTax, appStore.activeOrder?.currencyCode) }}</span>
                </div>
                <div class="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span>
                    {{ selectedShippingMethod ? formatPrice(selectedShippingMethod.priceWithTax, appStore.activeOrder?.currencyCode) : 'Select method' }}
                  </span>
                </div>
                <div class="flex justify-between text-base font-medium text-gray-900 border-t border-gray-200 pt-2">
                  <span>Total</span>
                  <span>
                    {{
                      selectedShippingMethod
                        ? formatPrice(
                            (appStore.activeOrder?.subTotalWithTax || 0) + selectedShippingMethod.priceWithTax,
                            appStore.activeOrder?.currencyCode
                          )
                        : formatPrice(appStore.activeOrder?.totalWithTax, appStore.activeOrder?.currencyCode)
                    }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Proceed to Payment Button - Only show in Shipping step -->
            <div v-if="currentStep === 'SHIPPING'" class="mt-20">
              <div class="relative group">
                <button
                    @click="proceedToPayment"
                    :disabled="!isShippingFormValid"
                    :class="[
                      'flex w-full items-center justify-center space-x-2 mt-12 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-300',
                      isShippingFormValid
                        ? 'bg-primary-600 hover:bg-primary-700'
                        : 'bg-gray-400 cursor-not-allowed'
                    ]"
                  >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>{{ isShippingFormValid ? 'Proceed to payment' : 'Proceed to payment (complete shipping)' }}</span>
                </button>

                <!-- Tooltip for disabled button -->
                <div v-if="!isShippingFormValid" class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-10">
                  {{ !hasShippingAddress ? 'Please add a shipping address to continue' : 'Please select a shipping method to continue' }}
                  <div class="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
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
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5.5M7 13l2.5 5.5m0 0L17 21" />
      </svg>
      <h3 class="mt-4 text-lg font-medium text-gray-900">Your cart is empty</h3>
      <p class="mt-2 text-gray-500">Add some items to your cart to proceed with checkout.</p>
      <div class="mt-6">
        <router-link
          to="/"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          Continue Shopping
        </router-link>
      </div>
    </div>

    <!-- Address Creation Modal -->
    <div v-show="showAddressModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium text-gray-900">Add New Address</h3>
            <button @click="closeAddressModal" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                v-model="newAddress.fullName"
                class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Company (Optional)</label>
              <input
                type="text"
                v-model="newAddress.company"
                class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Enter company name"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
              <input
                type="text"
                v-model="newAddress.streetLine1"
                class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Enter street address"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Apartment, Suite, etc. (Optional)</label>
              <input
                type="text"
                v-model="newAddress.streetLine2"
                class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Enter apartment or suite number"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  v-model="newAddress.city"
                  class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Enter city"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">State / Province</label>
                <input
                  type="text"
                  v-model="newAddress.province"
                  class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Enter state or province"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Postal Code (Optional)</label>
                <input
                  type="text"
                  v-model="newAddress.postalCode"
                  class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Enter postal code"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <select
                  v-model="newAddress.countryCode"
                  class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Select a country</option>
                  <option v-for="country in countries" :key="country.code" :value="country.code">
                    {{ country.name }}
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                v-model="newAddress.phoneNumber"
                required
                class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Enter phone number"
              />
            </div>

            <div class="flex items-center space-x-4">
              <div class="flex items-center">
                <input
                  type="checkbox"
                  v-model="newAddress.defaultShippingAddress"
                  id="modalDefaultShipping"
                  class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label for="modalDefaultShipping" class="ml-2 block text-sm text-gray-900">
                  Default Shipping Address
                </label>
              </div>
              <div class="flex items-center">
                <input
                  type="checkbox"
                  v-model="newAddress.defaultBillingAddress"
                  id="modalDefaultBilling"
                  class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label for="modalDefaultBilling" class="ml-2 block text-sm text-gray-900">
                  Default Billing Address
                </label>
              </div>
            </div>
          </div>

          <div class="flex gap-4 mt-6">
            <button
              @click="saveNewAddress"
              :disabled="!isNewAddressValid"
              :class="[
                'flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white',
                isNewAddressValid ? 'bg-primary-600 hover:bg-primary-700' : 'bg-gray-400 cursor-not-allowed'
              ]"
            >
              Save Address
            </button>
            <button
              @click="closeAddressModal"
              class="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { ref, computed, onMounted, watch, reactive, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import { formatPrice } from '../utils'
import { COUNTRIES, getCountryName } from '../config/countries'
import { createCustomerAddressMutation } from '../providers/shop/customer/customer'
import { getEligibleShippingMethodsQuery } from '../providers/shop/checkout/checkout'
import { getEligiblePaymentMethods, getDefaultPaymentMethod } from '../config/payment'
import { getActiveOrderQuery } from '../providers/shop/orders/order'
import {
  addPaymentToOrderMutation,
  createStripePaymentIntentMutation,
  setOrderShippingMethodMutation,
  setOrderShippingAddressMutation,
  transitionToArrangingPaymentMutation
} from '../providers/shop/checkout/checkout'
import { loadStripe } from '@stripe/stripe-js'
import { StripeElements, StripeElement } from 'vue-stripe-js'

export default {
  name: 'Checkout',
  components: {
    StripeElements,
    StripeElement
  },
  setup() {

    // 2025-11-23 GROK 4.1 ~~~~~~~~~~~~~~~~~

    const stripeLoaded = ref(false)
    const paymentElementMounted = ref(false)

    const onStripeElementsLoad = () => {
      console.log('StripeElements loaded')
      stripeLoaded.value = true
    }

    const onPaymentElementReady = () => {
      console.log('PaymentElement is ready!')
      paymentElementMounted.value = true
    }

    const onPaymentElementLoad = () => {
      console.log('PaymentElement load event')
    }

    // 2025-11-23 GROK 4.1 ~~~~~~~~~~~~~~~~~

    const router = useRouter()
    const appStore = useAppStore()

    // Vue Stripe component refs (official approach)
    const elementsComponent = ref()
    const paymentComponent = ref()

    // Vue Stripe options
    const stripeOptions = ref({})
    const paymentElementOptions = ref({})

    // // Computed elements options that updates when clientSecret changes
    // const elementsOptions = computed(() => ({
    //   clientSecret: clientSecret.value,
    //   appearance: {
    //     theme: 'stripe',
    //     variables: {
    //       colorPrimary: '#2563eb',
    //       colorBackground: '#ffffff',
    //       colorText: '#1f2937',
    //       colorDanger: '#ef4444',
    //       fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    //       spacingUnit: '4px',
    //       borderRadius: '6px'
    //     }
    //   }
    // }))

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

    // Checkout steps
    const steps = [
      { name: 'Shipping', state: 'SHIPPING' },
      { name: 'Payment', state: 'PAYMENT' },
      { name: 'Confirmation', state: 'CONFIRMATION' }
    ]

    const currentStep = ref('SHIPPING')

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
      streetLine2: appStore.shippingAddress.streetLine2 || '',
      city: appStore.shippingAddress.city || '',
      countryCode: appStore.shippingAddress.countryCode || '',
      province: appStore.shippingAddress.province || '',
      postalCode: appStore.shippingAddress.postalCode || '',
      phoneNumber: appStore.shippingAddress.phoneNumber || ''
    })

    const countries = COUNTRIES

    // Address modal functionality
    const showAddressModal = ref(false)
    const showStripeModal = ref(false)
    const newAddress = reactive({
      fullName: '',
      company: '',
      streetLine1: '',
      streetLine2: '',
      city: '',
      province: '',
      postalCode: '',
      countryCode: '',
      phoneNumber: '',
      defaultShippingAddress: true,
      defaultBillingAddress: true
    })

    // Address selection
    const customerAddresses = ref([])
    const selectedAddressId = ref('')

    const isNewAddressValid = computed(() => {
      return (
        newAddress.fullName &&
        newAddress.streetLine1 &&
        newAddress.city &&
        newAddress.province &&
        newAddress.countryCode &&
        newAddress.phoneNumber
      )
    })

    const hasShippingAddress = computed(() => {
      return (
        shippingAddress.value.fullName &&
        shippingAddress.value.streetLine1 &&
        shippingAddress.value.city &&
        shippingAddress.value.province
      )
    })

    const hasMultipleAddresses = computed(() => {
      return customerAddresses.value.length > 1
    })

    const selectedAddress = computed(() => {
      if (!selectedAddressId.value) return null
      return customerAddresses.value.find(addr => addr.id === selectedAddressId.value)
    })

    const closeAddressModal = () => {
      showAddressModal.value = false
      // Reset form
      Object.assign(newAddress, {
        fullName: '',
        company: '',
        streetLine1: '',
        streetLine2: '',
        city: '',
        province: '',
        postalCode: '',
        countryCode: '',
        phoneNumber: '',
        defaultShippingAddress: true,
        defaultBillingAddress: true
      })
    }

    const saveNewAddress = async () => {
      if (!isNewAddressValid.value) return

      try {
        const addressInput = {
          fullName: newAddress.fullName,
          company: newAddress.company,
          streetLine1: newAddress.streetLine1,
          streetLine2: newAddress.streetLine2,
          city: newAddress.city,
          province: newAddress.province,
          postalCode: newAddress.postalCode,
          countryCode: newAddress.countryCode,
          phoneNumber: newAddress.phoneNumber,
          defaultShippingAddress: newAddress.defaultShippingAddress,
          defaultBillingAddress: newAddress.defaultBillingAddress
        }

        const result = await createCustomerAddressMutation(addressInput)

        if (result) {
          // Update the store with the new address
          await appStore.loadCustomerAddresses()

          // Reload customer addresses to include the new one
          await loadCustomerAddresses()

          // Auto-fill the shipping form with the new address
          shippingAddress.value = {
            fullName: result.fullName || '',
            company: result.company || '',
            streetLine1: result.streetLine1 || '',
            streetLine2: result.streetLine2 || '',
            city: result.city || '',
            province: result.province || '',
            postalCode: result.postalCode || '',
            countryCode: result.country?.code || '',
            phoneNumber: result.phoneNumber || ''
          }

          closeAddressModal()
        }
      } catch (error) {
        console.error('Error creating address:', error)
        alert('Failed to create address. Please try again.')
      }
    }

    const loadCustomerAddresses = async () => {
      try {
        const addresses = await appStore.loadCustomerAddresses()
        customerAddresses.value = addresses || []
        // Set selected address to the default shipping address or first address
        const defaultShippingAddress = addresses.find(addr => addr.defaultShippingAddress)
        if (defaultShippingAddress) {
          selectedAddressId.value = defaultShippingAddress.id
          selectAddress(defaultShippingAddress.id)
        } else if (addresses.length > 0) {
          selectedAddressId.value = addresses[0].id
          selectAddress(addresses[0].id)
        }
      } catch (error) {
        console.error('Error loading customer addresses:', error)
        customerAddresses.value = []
      }
    }

    const selectAddress = (addressId) => {
      selectedAddressId.value = addressId
      const address = customerAddresses.value.find(addr => addr.id === addressId)
      if (address) {
        shippingAddress.value = {
          fullName: address.fullName || '',
          company: address.company || '',
          streetLine1: address.streetLine1 || '',
          streetLine2: address.streetLine2 || '',
          city: address.city || '',
          province: address.province || '',
          postalCode: address.postalCode || '',
          countryCode: address.country?.code || '',
          phoneNumber: address.phoneNumber || ''
        }
      }
    }

    // Shipping method functionality
    const selectedShippingMethod = ref(null)
    const eligibleShippingMethods = ref([])

    const loadEligibleShippingMethods = async () => {
      try {
        console.log('Loading eligible shipping methods...')
        const methods = await getEligibleShippingMethodsQuery()
        console.log('Available shipping methods:', methods)
        eligibleShippingMethods.value = methods

        // Auto-select the first available shipping method
        if (methods.length > 0 && !selectedShippingMethod.value) {
          selectedShippingMethod.value = methods[0]
          console.log('Auto-selected shipping method:', methods[0])
        }
      } catch (error) {
        console.error('Error loading shipping methods:', error)
        eligibleShippingMethods.value = []
      }
    }

    const selectShippingMethod = (method) => {
      selectedShippingMethod.value = method
      console.log('Selected shipping method:', method)
    }

    // Load shipping methods when component mounts and when shipping address changes
    onMounted(async () => {
      await loadEligibleShippingMethods()
    })

    // Reload shipping methods when shipping address changes
    watch(shippingAddress, async () => {
      if (hasShippingAddress.value) {
        await loadEligibleShippingMethods()
      }
    }, { deep: true })

    // Payment method functionality
    const selectedPaymentMethod = ref(null)

    const eligiblePaymentMethods = computed(() => {
      return getEligiblePaymentMethods()
    })

    // Payment form data and state
    const paymentProcessing = ref(false)
    const stripePaymentLoading = ref(false)
    const clientSecret = ref('')
    const paymentElementReady = ref(false)
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

    // Safety check for Stripe key
    console.log('🔑 Environment variable check:')
    console.log('🔑 import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY:', import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
    console.log('🔑 publishableKey variable:', publishableKey)

    if (!publishableKey || publishableKey === 'pk_test_51xxxxxxxxxxxxxxxxxxxx') {
      console.warn('⚠️ Stripe publishable key not configured. Please update VITE_STRIPE_PUBLISHABLE_KEY in .env file')
    } else {
      console.log('✅ Stripe publishable key loaded successfully:', publishableKey.substring(0, 20) + '...')
    }
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
      const shipping = selectedShippingMethod.value?.priceWithTax || 0
      return subtotal + shipping
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

    const validateTerms = () => {
      if (paymentForm.acceptTerms) {
        paymentErrors.acceptTerms = ''
      } else {
        paymentErrors.acceptTerms = 'You must accept the terms and conditions'
      }
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
          console.log('Order not ready, waiting...')
          stripePaymentLoading.value = false
          return
        }

        // 2. Create Stripe PaymentIntent via Vendure
        console.log('Creating Stripe payment intent...')
        let secret
        try {
          secret = await createStripePaymentIntentMutation()
          console.log('Stripe payment intent client secret:', secret)
        } catch (stripeError) {
          console.log('Stripe payment intent failed:', stripeError)
          alert('Unable to initialize payment. Please try again.')
          stripePaymentLoading.value = false
          return
        }

        if (!secret) {
          alert('No payment intent created. Please try again.')
          stripePaymentLoading.value = false
          return
        }

        // Debug: Check what key is being used
        console.log('🔑 Stripe publishable key being used:', publishableKey)
        console.log('🔑 Stripe publishable key first 20 chars:', publishableKey.substring(0, 20))

        // 3. Set clientSecret - Vue Stripe will handle the rest
        clientSecret.value = secret
        // 2025-11-23 GROK 4.1
        // Update elementsOptions ONLY ONCE
        elementsOptions.value.clientSecret = secret
        // 2025-11-23 GROK 4.1
        console.log('Vue Stripe Payment Element should render automatically')
        console.log('Client secret set, checking component state:', {
          elementsComponent: !!elementsComponent.value,
          paymentComponent: !!paymentComponent.value,
          paymentElementReady: paymentElementReady.value
        })

        // Set a timeout to mark payment element as ready after reasonable delay
        setTimeout(() => {
          console.log('Forcing payment element ready state after timeout')
          paymentElementReady.value = true
        }, 2000)

        stripePaymentLoading.value = false

      } catch (err) {
        console.error('Stripe initialization failed:', err)
        alert('Payment system initialization failed. Please refresh the page and try again.')
        stripePaymentLoading.value = false
      }
    }

    // // Vue Stripe payment processing using component refs (official approach)
    // const processStripePayment = async () => {
    //   paymentProcessing.value = true

    //   try {
    //     console.log('Starting payment confirmation with component refs...')

    //     // Use the official component refs approach
    //     const stripeInstance = elementsComponent.value?.instance
    //     const elementsInstance = elementsComponent.value?.elements

    //     if (!stripeInstance || !elementsInstance) {
    //       console.error('Stripe components not ready:', {
    //         stripeInstance: !!stripeInstance,
    //         elements: !!elementsInstance
    //       })

    //       alert('Payment system not ready. Please wait for the payment form to load.')
    //       return
    //     }

    //     console.log('Confirming payment with Vue Stripe component refs...')

    //     const { error } = await stripeInstance.confirmPayment({
    //       elements: elementsInstance,
    //       clientSecret: clientSecret.value,
    //       confirmParams: {
    //         return_url: `${window.location.origin}/order-confirmation/${appStore.activeOrder?.code}`,
    //       },
    //     })

    //     if (error) {
    //       console.error('Stripe payment error:', error)
    //       alert(error.message || 'Payment failed')
    //     } else {
    //       await confirmPayment()
    //     }
    //   } catch (err) {
    //     console.error('Payment processing error:', err)
    //     alert('Payment processing error. Please refresh and try again.')
    //   } finally {
    //     paymentProcessing.value = false
    //   }
    // }

    // 2025-11-23 GROK 4.1 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    const processStripePayment = async () => {
      if (!paymentElementMounted.value) {
        alert('Payment form is still loading. Please wait...')
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
          alert(error.message || 'Payment failed')
        }
        // On success, Stripe redirects via return_url
      } catch (err) {
        console.error('Payment error:', err)
        alert('Payment processing failed')
      } finally {
        paymentProcessing.value = false
      }
    }

    // 2025-11-23 GROK 4.1 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


    // Trigger Vue Stripe submit
    const triggerStripeSubmit = async () => {
      await processStripePayment()
    }

    // Payment processing
    const processPayment = async () => {
      // Handle Stripe payment
      if (selectedPaymentMethod.value?.code === 'stripe') {
        await processStripePayment()
        return
      }

      // Validate all fields for standard payment
      formatCardNumber()
      formatExpiryDate()
      validateCVV()
      validateCardholderName()
      validateTerms()

      // Check if form is valid
      if (!isPaymentFormValid.value) {
        return
      }

      // Start payment processing
      paymentProcessing.value = true

      try {
        // Simulate payment processing delay
        await new Promise(resolve => setTimeout(resolve, 3000))

        // Simulate random success/failure for demo purposes
        const isSuccess = Math.random() > 0.2 // 80% success rate

        if (isSuccess) {
          // Payment successful - move to confirmation
          await confirmPayment()
        } else {
          // Payment failed
          alert('Payment failed. Please check your card details and try again.')
        }
      } catch (error) {
        console.error('Payment processing error:', error)
        alert('An error occurred during payment processing. Please try again.')
      } finally {
        paymentProcessing.value = false
      }
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
      if (newMethod?.code === 'stripe' && currentStep.value === 'PAYMENT') {
        // Delay to ensure DOM is ready and avoid conflicts with proceedToPayment
        setTimeout(() => {
          initStripePayment()
        }, 300)
      }
    })

    // Initialize Stripe when navigating to PAYMENT step if Stripe is selected
    watch(currentStep, async (newStep) => {
      if (newStep === 'PAYMENT' && selectedPaymentMethod.value?.code === 'stripe') {
        // Delay to ensure DOM is ready
        setTimeout(() => {
          initStripePayment()
        }, 500)
      }
    })

    // Reinitialize Stripe when modal state changes
    watch(showStripeModal, async (newValue) => {
      if (selectedPaymentMethod.value?.code === 'stripe' && currentStep.value === 'PAYMENT') {
        // Wait for modal to render then reinitialize
        setTimeout(() => {
          initStripePayment()
        }, 300)
      }
    })

    // Form validation
    const isShippingFormValid = computed(() => {
      return (
        customer.value.emailAddress &&
        customer.value.firstName &&
        customer.value.lastName &&
        hasShippingAddress.value &&
        selectedShippingMethod.value
      )
    })

    // Redirect to home if cart is empty
    onMounted(async () => {
      appStore.setShowCart(false)

      if (!appStore.activeOrder?.lines?.length) {
        router.push('/')
        return
      }

      // Load customer addresses if user is logged in to auto-fill shipping address
      if (appStore.isLoggedIn) {
        try {
          await loadCustomerAddresses()
        } catch (error) {
          console.error('Error loading customer addresses for checkout:', error)
        }
      }

      // Stock validation is now handled in the cart component before navigation
      // If we reach checkout, it means stock validation passed
    })

    // Watch for changes in store shipping address and update form fields
    watch(() => appStore.shippingAddress, (newAddress) => {
      shippingAddress.value = {
        fullName: newAddress.fullName || '',
        company: newAddress.company || '',
        streetLine1: newAddress.streetLine1 || '',
        streetLine2: newAddress.streetLine2 || '',
        city: newAddress.city || '',
        countryCode: newAddress.countryCode || '',
        province: newAddress.province || '',
        postalCode: newAddress.postalCode || '',
        phoneNumber: newAddress.phoneNumber || ''
      }
    }, { deep: true, immediate: true })

    // Watch for Payment Element mounting
    watch(paymentComponent, (newComponent) => {
      console.log('Payment Component changed:', {
        hasComponent: !!newComponent,
        hasElement: !!newComponent?.element,
        element: newComponent?.element
      })
      if (newComponent?.element) {
        console.log('Payment Element is now mounted and ready')
        paymentElementReady.value = true
      } else {
        console.log('Payment Element not mounted yet')
        paymentElementReady.value = false
      }
    }, { deep: true })

    // Watch for client secret to enable payment element after reasonable time
    watch(clientSecret, (newSecret) => {
      if (newSecret) {
        console.log('Client secret set, enabling payment element after delay')
        console.log('Checking component refs state:', {
          elementsComponent: !!elementsComponent.value,
          paymentComponent: !!paymentComponent.value
        })
        // Give the Payment Element time to mount
        setTimeout(() => {
          console.log('Payment Element should be ready now')
          console.log('Component refs state after delay:', {
            elementsComponent: !!elementsComponent.value,
            paymentComponent: !!paymentComponent.value
          })
          paymentElementReady.value = true
        }, 1500)
      }
    })

    function goToNextStep() {
      const currentIndex = steps.findIndex(step => step.state === currentStep.value)
      if (currentIndex < steps.length - 1) {
        currentStep.value = steps[currentIndex + 1].state
        window.scrollTo(0, 0)
      }
    }

    function goToPreviousStep() {
      const currentIndex = steps.findIndex(step => step.state === currentStep.value)
      if (currentIndex > 0) {
        currentStep.value = steps[currentIndex - 1].state
        window.scrollTo(0, 0)
      }
    }

    async function proceedToPayment() {
      if (!isShippingFormValid.value) {
        return
      }

      try {
        console.log('Current order state before proceeding:', appStore.activeOrder?.state)

        // Check if order is already in ArrangingPayment state
        if (appStore.activeOrder?.state === 'ArrangingPayment') {
          console.log('Order already in ArrangingPayment state, proceeding to payment step...')
          goToNextStep()
          return
        }

        console.log('Setting up shipping information before proceeding to payment...')

        // 1. Set shipping address
        console.log('Setting shipping address...')
        const addressResult = await setOrderShippingAddressMutation({
          fullName: shippingAddress.value.fullName,
          company: shippingAddress.value.company,
          streetLine1: shippingAddress.value.streetLine1,
          streetLine2: shippingAddress.value.streetLine2,
          city: shippingAddress.value.city,
          province: shippingAddress.value.province,
          postalCode: shippingAddress.value.postalCode,
          countryCode: shippingAddress.value.countryCode,
          phoneNumber: shippingAddress.value.phoneNumber
        })
        console.log('Shipping address result:', addressResult)

        if (addressResult?.__typename === 'ErrorResult') {
          alert(`Failed to set shipping address: ${addressResult.message}`)
          return
        }

        // 2. Set shipping method
        console.log('Setting shipping method...')
        console.log('Selected shipping method ID:', selectedShippingMethod.value?.id)
        const shippingMethodResult = await setOrderShippingMethodMutation(selectedShippingMethod.value.id)
        console.log('Shipping method result:', shippingMethodResult)

        if (shippingMethodResult?.__typename === 'ErrorResult') {
          console.error('Shipping method error details:', shippingMethodResult)
          alert(`Failed to set shipping method: ${shippingMethodResult.message}`)
          return
        }

        // 3. Transition to ArrangingPayment state
        console.log('Transitioning to ArrangingPayment state...')
        const transitionResult = await transitionToArrangingPaymentMutation()
        console.log('Transition result:', transitionResult)

        if (transitionResult?.__typename === 'ErrorResult') {
          alert(`Failed to transition order: ${transitionResult.message}`)
          return
        }

        // Check if transition was successful
        if (transitionResult?.state !== 'ArrangingPayment') {
          console.error('Order state transition failed. Current state:', transitionResult?.state)
          alert(`Order state transition failed. Current state: ${transitionResult?.state}`)
          return
        }

        console.log('Order successfully transitioned to ArrangingPayment state')

        // Update the active order in store
        const refreshedOrder = await getActiveOrderQuery()
        if (refreshedOrder) {
          appStore.setActiveOrder(refreshedOrder)
        }

        // 🔑 关键修复5：确保订单状态是 ArrangingPayment 后再初始化 Stripe
        if (refreshedOrder?.state === 'ArrangingPayment') {
          console.log('订单已进入支付状态，准备 Stripe Element...')
        }

        // Proceed to payment step
        console.log('Navigating to PAYMENT page...')
        goToNextStep()

        // Initialize Stripe after navigation to ensure DOM is ready
        console.log('Setting up delayed Stripe initialization...')
        setTimeout(() => {
          if (selectedPaymentMethod.value?.code === 'stripe') {
            console.log('Delayed Stripe Payment Element initialization...')
            initStripePayment()
          } else {
            console.log('Current payment method is not Stripe:', selectedPaymentMethod.value?.code)
          }
        }, 800)

      } catch (error) {
        console.error('Error during shipping setup:', error)
        alert('An error occurred while setting up shipping. Please try again.')
      }
    }

    async function confirmPayment() {
      try {
        // Stock validation already done in cart before checkout
        // In a real implementation, this would process the payment
        // For now, just move to confirmation step
        currentStep.value = 'CONFIRMATION'
        window.scrollTo(0, 0)
      } catch (error) {
        console.error('Error during checkout:', error)
        alert('An error occurred during checkout. Please try again.')
      }
    }

    // Navigation functions for step navigation
    function canNavigateToStep(targetStep) {
      const currentIndex = steps.findIndex(step => step.state === currentStep.value)
      const targetIndex = steps.findIndex(step => step.state === targetStep)

      // Allow navigation to previous steps only
      return targetIndex < currentIndex
    }

    function navigateToStep(targetStep) {
      if (canNavigateToStep(targetStep)) {
        currentStep.value = targetStep
        window.scrollTo(0, 0)
      }
    }

    return {
      onStripeElementsLoad,         // ← Event handler
      onPaymentElementReady,        // ← Eve
      onPaymentElementLoad,
      paymentElementMounted,        // ← This was missing!
      stripeLoaded,                 // ← Optional but good to have
      appStore,
      steps,
      currentStep,
      customer,
      shippingAddress,
      countries,
      isShippingFormValid,
      formatPrice,
      goToNextStep,
      goToPreviousStep,
      proceedToPayment,
      confirmPayment,
      canNavigateToStep,
      navigateToStep,
      showAddressModal,
      showStripeModal,
      newAddress,
      isNewAddressValid,
      closeAddressModal,
      saveNewAddress,
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
      eligiblePaymentMethods,
      selectedPaymentMethod,
      selectPaymentMethod,
      paymentProcessing,
      paymentForm,
      paymentErrors,
      isPaymentFormValid,
      totalAmount,
      formatCardNumber,
      formatExpiryDate,
      validateCVV,
      processPayment,
      processStripePayment,
      triggerStripeSubmit,
      loadEligibleShippingMethods,
      stripePaymentLoading,
      paymentElementReady,
      clientSecret,
      publishableKey,
      elementsComponent,
      paymentComponent,
      stripeOptions,
      elementsOptions,
      paymentElementOptions
    }
  }
}
</script>