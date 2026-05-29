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
        <h2 class="sr-only">{{ t('checkout.payment') }}</h2>

        <!-- Mobile Navigation -->
        <div class="sm:hidden pb-4 mb-6 border-b border-gray-200">
          <button @click="$router.push('/checkout/shipping')"
            class="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {{ t('checkout.backToShipping') }}
          </button>
        </div>

        <!-- Checkout Steps Navigation -->
        <nav class="hidden sm:block pb-8 mb-8 border-b">
          <ol class="flex space-x-4 justify-center">
            <li class="flex items-center">
              <router-link to="/checkout/shipping"
                class="text-sm font-medium text-gray-500 hover:text-primary-500 transition-colors">
                {{ t('checkout.shipping') }}
              </router-link>
              <span class="ml-4 text-gray-300">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </li>
            <li class="flex items-center">
              <span class="text-sm font-medium text-primary-600">{{ t('checkout.payment') }}</span>
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

          <!-- Left Column: Order Summary -->
          <div>
            <div class="hidden lg:block mt-10 lg:mt-0">
              <div class="flex justify-between items-center mb-4">
                <h2 class="text-lg font-medium text-gray-900">{{ t('checkout.orderSummary') }}</h2>
                <span v-if="appStore.activeOrder?.code" class="text-sm text-gray-500">{{ t('orderDetail.orderNumber')
                  }}{{ appStore.activeOrder.code }}</span>
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
                      {{ appStore.activeOrder?.shippingWithTax ? formatPrice(appStore.activeOrder.shippingWithTax,
                        appStore.activeOrder?.currencyCode) : t('checkout.selectMethod') }}
                    </span>
                  </div>
                  <div class="flex justify-between text-base font-medium text-gray-900 border-t border-gray-200 pt-2">
                    <span>{{ t('account.total') }}</span>
                    <span>{{ formatPrice(orderTotal, appStore.activeOrder?.currencyCode) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Customer Service -->
            <!-- border-t border-gray-200 -->

            <div class="hidden lg:block mt-10 lg:mt-10">
              <div class="flex justify-between items-center mb-4">
                <h2 class="text-lg font-medium text-gray-900">联络客服</h2>
                <!-- <span v-if="appStore.activeOrder?.code" class="text-sm text-gray-500">{{ t('orderDetail.orderNumber')
                  }}{{ appStore.activeOrder.code }}</span> -->
              </div>


              <div v-if="customerServiceQRCode" class="mt-4">
                <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div class="text-center">
                    <div class="rounded-lg p-3 bg-white dark:bg-gray-800 inline-block">
                      <img :src="customerServiceQRCode" alt="Customer Service QR Code"
                        class="w-28 h-28 mx-auto object-contain" @error="handleQRCodeError" />
                    </div>
                    <p class="text-xs text-gray-600 dark:text-gray-400 mt-2">{{ t('header.scanToContact') }}</p>
                    <p class="text-sm font-medium text-gray-900 dark:text-white mt-1">{{ weixinAccountNumber }}</p>
                  </div>
                </div>
              </div>
            </div>


          </div>

          <!-- Right Column: Offline Payment Instructions -->
          <div class="mt-0 md:mt-0">
            <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div class="hidden sm:block">
                <div class="flex flex-row justify-between items-center mb-4">
                  <h3 class="text-lg font-medium text-gray-900">{{ t('checkout.paymentInformation') }}</h3>
                  <span class="text-sm text-gray-500">{{ t('checkout.orderNumber') }}: {{ appStore.activeOrder?.code
                    }}</span>
                </div>
              </div>

              <div class="sm:hidden">
                <div class="flex flex-col justify-between mb-4">
                  <h3 class="text-lg font-medium text-gray-900">{{ t('checkout.paymentInformation') }}</h3>
                  <span class="text-sm text-gray-500">{{ t('checkout.orderNumber') }}: {{ appStore.activeOrder?.code
                  }}</span>
                </div>
              </div>

              <!-- Offline Payment Instructions -->
              <div class="space-y-4">
                <!-- Payment Countdown Timer -->
                <div v-if="paymentPageVisitedAt && !isExpired"
                  class="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div class="flex flex-row items-center gap-2">
                    <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>

                    <div class="text font-mono text-amber-700 tabular-nums">
                      {{ formattedCountdown }}
                    </div>
                  </div>

                  <div class="flex flex-col">
                    <!-- <div class="text-xl font-mono text-amber-700 tabular-nums">
                        {{ formattedCountdown }}
                      </div> -->

                    <p class="mt-2 text-xs text-amber-700">
                      {{ t('checkout.paymentDeadline') }}: {{ formatDateTime(paymentDeadline) }}, 过期后订单将关闭
                    </p>

                  </div>

                  <!-- <h4 class="text-sm font-medium text-amber-800">{{ t('checkout.paymentTimeLimit') }}</h4> -->


                </div>

                <!-- Expired Timer Alert -->
                <div v-else-if="isExpired" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div class="flex items-start">
                    <svg class="w-5 h-5 text-blue-700 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div class="ml-3">
                      <h4 class="text-sm font-medium text-blue-700">{{ t('checkout.paymentTimeExpired') }}</h4>
                      <p class="mt-1 text-sm text-blue-700">{{ t('header.customerService') }}: {{ weixinAccountNumber }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div class="flex items-start">
                    <svg class="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div class="ml-3">
                      <h4 class="text-sm font-medium text-blue-800">{{ t('checkout.offlinePaymentTitle') }}</h4>
                      <p class="mt-1 text-sm text-blue-700">{{ t('checkout.offlinePaymentDesc') }}</p>
                    </div>
                  </div>
                </div> -->

                <!-- Payment Instructions -->
                <div class="prose prose-sm">
                  <div v-html="paymentInstructions"></div>
                </div>

                <!-- Customer Message Input -->
                <div class="mt-6 pt-4 border-t border-gray-200">

                  <div class="flex flex-row justify-between">
                    <label for="customerMessage" class="block text-sm font-medium text-gray-700 mb-2">
                      {{ t('checkout.customerMessageLabel') }}
                    </label>

                    <!-- t('common.save')   -->
                    <p class="mt-1 text-xs text-gray-500">
                      {{ isSavingMessage ? t('common.saving') : '' }}
                    </p>
                  </div>

                  <!-- :disabled="isExpired" -->
                  <textarea id="customerMessage" v-model="customerMessage" @input="onMessageChange"
                    :placeholder="t('checkout.customerMessagePlaceholder')" rows="3"
                    class="block w-full border border-gray-500 hover:border-primary-500  rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm placeholder:text-sm resize-none"
                    ></textarea>
                </div>

                <!-- Payment Proof Upload -->
                <div class="mt-6 pt-4 border-t border-gray-200">
                  <div class="flex justify-between items-center mb-2">
                    <label class="block text-sm font-medium text-gray-700">
                      {{ t('checkout.paymentProofLabel') }}
                    </label>
                    <span class="text-xs text-gray-500">
                      {{ uploadedProofs.length }}/{{ maxImageAmount }}
                    </span>
                  </div>
                  <p class="text-xs text-gray-500 mb-3">{{ t('checkout.paymentProofHint') }}</p>

                  <!-- Upload Area -->
                  <!-- || isExpired -->
                  <!-- hover:bg-gray-100  -->
                  <!-- || isExpired -->
                  <div class="relative">
                    <input type="file" multiple accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" @change="handleFileUpload" :disabled="isUploading"
                      class="hidden" id="paymentProofInput" />
                    <label for="paymentProofInput"
                      :class="[
                        'flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
                        isUploading
                          ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                          : 'border-gray-300 bg-gray-50 hover:border-primary-400'
                      ]">
                      <div class="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg v-if="!isUploading" class="w-8 h-8 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                        <svg v-else class="animate-spin w-8 h-8 mb-3 text-primary-600" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p class="text-sm text-gray-500">{{ isUploading ? t('checkout.uploading') : t('checkout.clickToUpload') }}</p>
                        <p class="text-sm text-gray-500">(JPG/PNG/PDF 格式)</p>
                      </div>
                    </label>
                  </div>

                  <!-- Error Message -->
                  <p v-if="uploadError" class="mt-2 text-xs text-red-600">{{ uploadError }}</p>

                  <!-- Uploaded Images Preview -->
                  <!-- :disabled="isExpired" -->
                  <div v-if="uploadedProofs.length > 0" class="mt-4 grid grid-cols-3 gap-3">
                    <div v-for="proof in uploadedProofs" :key="proof.id" class="relative group">
                      <!-- PDF Icon -->
                      <div v-if="isPdfFile(proof.name)" class="w-full h-24 flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                        <svg class="w-10 h-10 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h5v7h7v9H6z"/>
                          <text x="12" y="17" text-anchor="middle" fill="white" font-size="6" font-weight="bold">PDF</text>
                        </svg>
                        <span class="text-xs text-gray-500 mt-1 px-2 truncate w-full text-center">{{ proof.name }}</span>
                      </div>
                      <!-- Image Preview -->
                      <img v-else :src="proof.preview" :alt="proof.name" class="w-full h-24 object-cover rounded-lg border border-gray-200" />
                      <button @click="removeProof(proof.id)"
                        class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Confirm Order Button -->
                <!-- @click="confirmOrder"  -->
                <!-- border-t border-gray-200 -->
                 
                <div class="mt-24 pt-10">
                  <div class="text-sm mb-1">
                    支付后，请等待后台处理，谢谢！(查询: 我的帐户-购买历史)
                  </div>
                  <button @click="goToHomepage" class="w-full flex items-center justify-center py-3 px-4 border border-transparent text-base font-medium rounded-md text-white transition-colors bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    <!-- {{ isConfirming ? t('checkout.processing') : t('checkout.confirmOrder') }} -->
                    返回首页
                  </button>
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
      <p class="mt-2 text-gray-500">{{ t('checkout.addItemsToCart') }}</p>
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '../stores/app'
import { formatPrice } from '../utils'
import { getActiveOrderQuery, cancelMyOrderMutation } from '../providers/shop/orders/order'
import { transitionToArrangingPaymentMutation, updateOrderCustomFieldsMutation, uploadCustomerFile } from '../providers/shop/checkout/checkout'

const ONE_HOUR_MS = (parseInt(import.meta.env.VITE_PAYMENT_EXPIRE_TIME) || 3600) * 1000

export default {
  name: 'CheckoutPayment',
  setup() {
    const { t } = useI18n()
    const router = useRouter()
    const appStore = useAppStore()

    const isInitialLoading = ref(true)
    const isConfirming = ref(false)
    const countdownSeconds = ref(0)
    const isExpired = ref(false)
    const customerMessage = ref('')
    const isSavingMessage = ref(false)
    const isAutoCancelling = ref(false)
    let countdownInterval = null
    let saveTimeout = null

    // Payment proof upload state
    const uploadedProofs = ref([])
    const isUploading = ref(false)
    const uploadError = ref('')

    // Environment config for uploads
    const maxImageAmount = computed(() => parseInt(import.meta.env.VITE_PAYMENT_MAX_IMAGE_AMOUNT) || 3)
    const maxFileSize = computed(() => {
      const envValue = import.meta.env.VITE_PAYMENT_MAX_IMAGE_SIZE
      if (!envValue) return 1048576 // Default 1MB

      const value = envValue.toString().toLowerCase().trim()
      if (value.endsWith('k')) {
        // Handle kilobytes (e.g., "1024k" = 1MB)
        return parseInt(value) * 1024
      } else if (value.endsWith('m')) {
        // Handle megabytes (e.g., "1m" = 1MB)
        return parseInt(value) * 1024 * 1024
      } else {
        // Treat as bytes
        return parseInt(value) || 1048576
      }
    })

    const paymentPageVisitedAt = computed(() => {
      return appStore.activeOrder?.customFields?.paymentPageVisitedAt || null
    })

    const paymentDeadline = computed(() => {
      if (!paymentPageVisitedAt.value) return null
      const visitedTime = new Date(paymentPageVisitedAt.value)
      visitedTime.setHours(visitedTime.getHours() + 1)
      return visitedTime.toISOString()
    })

    const customerMessageFromOrder = computed(() => {
      return appStore.activeOrder?.customFields?.customerMessage || ''
    })

    const cancelOrder = async () => {
      // const orderCode = appStore.activeOrder?.code
      // if (!orderCode || isAutoCancelling.value) return

      // isAutoCancelling.value = true
      // try {
      //   console.log('Auto-cancelling order due to payment timeout:', orderCode)
      //   const result = await cancelMyOrderMutation(orderCode)
      //   if (result) {
      //     console.log('Order auto-cancelled successfully:', orderCode)
      //     alert(t('checkout.orderAutoCancelled'))
      //     router.push('/')
      //   }
      // } catch (error) {
      //   console.error('Error auto-cancelling order:', error)
      // } finally {
      //   isAutoCancelling.value = false
      // }
    }

    const saveCustomerMessage = async () => {
      if (isSavingMessage.value) return

      isSavingMessage.value = true
      try {
        const result = await updateOrderCustomFieldsMutation({
          customFields: {
            customerMessage: customerMessage.value
          }
        })
        if (result?.__typename === 'ErrorResult') {
          console.error('Failed to save customer message:', result.message)
        }
      } catch (error) {
        console.error('Error saving customer message:', error)
      } finally {
        setTimeout(() => {
          isSavingMessage.value = false
        }, 500)
      }
    }

    const onMessageChange = () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout)
      }
      saveTimeout = setTimeout(() => {
        saveCustomerMessage()
      }, 1000)
    }

    // Payment proof upload functions
    const loadExistingProofs = () => {
      const proofs = appStore.activeOrder?.customFields?.paymentProofs || []
      uploadedProofs.value = proofs
    }

    const handleFileUpload = async (event) => {
      const files = event.target.files
      if (!files || files.length === 0) return

      const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
      const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf']

      // Check total count limit
      const currentCount = uploadedProofs.value.length
      const remainingSlots = maxImageAmount.value - currentCount
      
      if (remainingSlots <= 0) {
        uploadError.value = t('checkout.maxImagesReached', { max: maxImageAmount.value })
        event.target.value = ''
        return
      }

      isUploading.value = true
      uploadError.value = ''

      try {
        const newAssetIds = []
        const uploadedAssets = []
        const filesToUpload = Array.from(files).slice(0, remainingSlots)

        for (const file of filesToUpload) {
          // Validate file type
          const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
          if (!ALLOWED_EXTENSIONS.includes(fileExtension) || !ALLOWED_TYPES.includes(file.type)) {
            uploadError.value = t('checkout.invalidFileType', { allowed: '.jpg, .png, .pdf' })
            continue
          }

          // Validate file size
          if (file.size > maxFileSize.value) {
            const maxSizeMB = (maxFileSize.value / 1048576).toFixed(1)
            uploadError.value = t('checkout.fileTooLarge', { max: maxSizeMB + 'MB' })
            continue
          }

          const asset = await uploadCustomerFile(file)
          if (asset && asset.id) {
            uploadedAssets.push(asset)
            newAssetIds.push(asset.id)
          }
        }

        // Get existing proof IDs
        const existingProofIds = uploadedProofs.value.map(proof => proof.id)
        const allProofIds = [...existingProofIds, ...newAssetIds]

        // Save to order - use paymentProofsIds (not paymentProofs)
        const result = await updateOrderCustomFieldsMutation({
          customFields: {
            paymentProofsIds: allProofIds
          }
        })

        if (result?.__typename === 'ErrorResult') {
          console.error('Failed to save payment proofs:', result.message)
          uploadError.value = t('checkout.uploadFailed')
        } else {
          // Update local state with new proofs
          uploadedProofs.value = [...uploadedProofs.value, ...uploadedAssets]
        }
      } catch (error) {
        console.error('Error uploading payment proof:', error)
        uploadError.value = t('checkout.uploadFailed')
      } finally {
        isUploading.value = false
        // Clear input
        event.target.value = ''
      }
    }

    const removeProof = async (proofId) => {
      try {
        const remainingProofs = uploadedProofs.value.filter(proof => proof.id !== proofId)
        const remainingIds = remainingProofs.map(proof => proof.id)

        const result = await updateOrderCustomFieldsMutation({
          customFields: {
            paymentProofsIds: remainingIds
          }
        })

        if (result?.__typename === 'ErrorResult') {
          console.error('Failed to remove payment proof:', result.message)
        } else {
          uploadedProofs.value = remainingProofs
        }
      } catch (error) {
        console.error('Error removing payment proof:', error)
      }
    }

    const formatCountdown = (seconds) => {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const secs = seconds % 60
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const isPdfFile = (filename) => {
      if (!filename) return false
      return filename.toLowerCase().endsWith('.pdf')
    }

    const formattedCountdown = computed(() => {
      return formatCountdown(countdownSeconds.value)
    })

    const startCountdown = () => {
      if (!paymentPageVisitedAt.value) {
        countdownSeconds.value = 0
        return
      }

      const visitedTime = new Date(paymentPageVisitedAt.value).getTime()
      const deadline = visitedTime + ONE_HOUR_MS
      const now = Date.now()
      const remaining = Math.max(0, Math.floor((deadline - now) / 1000))

      if (remaining <= 0) {
        countdownSeconds.value = 0
        isExpired.value = true
        return
      }

      countdownSeconds.value = remaining
      isExpired.value = false

      if (countdownInterval) {
        clearInterval(countdownInterval)
      }

      countdownInterval = setInterval(() => {
        const currentRemaining = Math.max(0, Math.floor((deadline - Date.now()) / 1000))
        countdownSeconds.value = currentRemaining

        if (currentRemaining <= 0) {
          isExpired.value = true
          if (countdownInterval) {
            clearInterval(countdownInterval)
            countdownInterval = null
          }
          cancelOrder()
        }
      }, 1000)
    }

    const formatDateTime = (isoString) => {
      if (!isoString) return ''
      const date = new Date(isoString)
      const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }
      return date.toLocaleString('zh-CN', options)
    }

    const orderTotal = computed(() => {
      if (!appStore.activeOrder) return 0
      const subtotal = appStore.activeOrder.subTotalWithTax || 0
      const shipping = appStore.activeOrder.shippingWithTax || 0
      return subtotal + shipping
    })

    const paymentInstructions = computed(() => {
      const orderCode = appStore.activeOrder?.code || '________'
      const envInstructions = import.meta.env.VITE_PAYMENT_INSTRUCTIONS
      const paymentAccount = import.meta.env.VITE_PAYMENT_ACCOUNT_NUMBER

      //If env variable exists, replace {{ORDER_CODE}} placeholder with actual order code
      let my_envInstructions
      if (envInstructions) {
        my_envInstructions = envInstructions.replace(/{{ORDER_CODE}}/g, orderCode)
        my_envInstructions = my_envInstructions.replace(/{{PAYMENT_ACCOUNT_NUMBER}}/g, paymentAccount)
        return my_envInstructions
      }

      // Default instructions with dynamic order code
      return `
        <p class="mb-2"><strong>支付说明：</strong></p>
        <p class="mb-2">1. 请将订单金额转账至: ${paymentAccount}</p>
        <p class="mb-2">2. 转账时请备注订单号: ${orderCode}</p>
        <p class="mb-2">3. 转账完成后请联系客服确认</p>
      `
    })

    const customerServiceQRCode = computed(() => {
      return import.meta.env.VITE_CUSTOMER_SERVICE_QRCODE || ''
    })

    const weixinAccountNumber = computed(() => {
      return import.meta.env.VITE_CUSTOMER_SERVICE_WEIXIN || ''
    })

    const handleQRCodeError = (event) => {
      console.warn('Customer service QR code failed to load')
    }

    const confirmOrder = async () => {
      try {
        isConfirming.value = true

        const orderData = await getActiveOrderQuery()

        if (!orderData) {
          alert(t('checkout.orderNotFound'))
          return
        }

        if (orderData.state !== 'ArrangingPayment') {
          const result = await transitionToArrangingPaymentMutation()
          if (result?.__typename === 'ErrorResult') {
            console.error('Failed to transition order:', result.message)
            alert(t('checkout.transitionFailed'))
            return
          }
        }

        const orderCode = appStore.activeOrder?.code || orderData.code
        router.push(`/checkout/confirmation/${orderCode}`)
      } catch (error) {
        console.error('Error confirming order:', error)
        alert(t('checkout.confirmError'))
      } finally {
        isConfirming.value = false
      }
    }

    onMounted(async () => {
      appStore.setShowCart(false)

      const order = await getActiveOrderQuery()

      if (order) {
        appStore.setActiveOrder(order)
        startCountdown()
        customerMessage.value = order.customFields?.customerMessage || ''
        loadExistingProofs()
      }

      if (!order?.lines?.length) {
        isInitialLoading.value = false
        router.push('/')
        return
      }

      isInitialLoading.value = false
    })

    const goToHomepage = () => {
      router.push('/')
    }

    onUnmounted(() => {
      if (countdownInterval) {
        clearInterval(countdownInterval)
        countdownInterval = null
      }
      if (saveTimeout) {
        clearTimeout(saveTimeout)
        saveTimeout = null
      }
    })

    return {
      t,
      appStore,
      formatPrice,
      orderTotal,
      paymentInstructions,
      customerServiceQRCode,
      weixinAccountNumber,
      handleQRCodeError,
      isInitialLoading,
      isConfirming,
      confirmOrder,
      paymentPageVisitedAt,
      paymentDeadline,
      formattedCountdown,
      isExpired,
      formatDateTime,
      customerMessage,
      onMessageChange,
      isSavingMessage,
      isAutoCancelling,
      uploadedProofs,
      isUploading,
      uploadError,
      handleFileUpload,
      removeProof,
      goToHomepage,
      maxImageAmount,
      maxFileSize,
      isPdfFile
    }
  }
}
</script>
