<template>
  <div class="flow-root">
    <!-- Stock Limit Notification -->
    <div v-if="showStockLimitMessage" class="mb-4 z-50 relative">
      <div :class="[
        'border rounded-md p-4 shadow-lg',
        stockLimitMessageKey === 'removed'
          ? 'bg-red-50 border-red-200'
          : 'bg-yellow-50 border-yellow-200'
      ]">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg :class="[
              'h-5 w-5',
              stockLimitMessageKey === 'removed'
                ? 'text-red-400'
                : 'text-yellow-400'
            ]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div class="flex-1">
            <h3 :class="[
              'text-sm font-medium',
              stockLimitMessageKey === 'removed'
                ? 'text-red-800'
                : 'text-yellow-800'
            ]">
              {{ stockLimitMessageKey === 'removed' ? t('cart.itemRemoved') : t('cart.stockLimit') }}
            </h3>
            <div :class="[
              'mt-1 text-sm',
              stockLimitMessageKey === 'removed'
                ? 'text-red-700'
                : 'text-yellow-700'
            ]">
              <p>{{ stockLimitMessage }}</p>
            </div>
          </div>
          <div class="ml-auto pl-3">
            <div class="-mx-1.5 -my-1.5">
              <button @click="closeStockLimitNotification" type="button" :class="[
                'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2',
                stockLimitMessageKey === 'removed'
                  ? 'bg-red-50 text-red-500 hover:bg-red-100 focus:ring-red-600 focus:ring-offset-red-50'
                  : 'bg-yellow-50 text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-600 focus:ring-offset-yellow-50'
              ]">
                <span class="sr-only">{{ t('common.close') }}</span>
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Cart Close Button -->
    <div class="mb-6 text-right text-sm underline text-blue-500 cursor-pointer" @click="$emit('close-cart')">{{ t('common.close') }}</div>

    <ul class="-my-6 divide-y divide-gray-200">
      <li v-for="line in appStore.activeOrder?.lines || []" :key="line.id" class="py-6 flex">
        <div class="flex-shrink-0 w-24 h-24 border border-gray-200 rounded-md overflow-hidden">
          <img v-if="line.featuredAsset" :src="line.featuredAsset.preview" :alt="line.productVariant.name"
            class="w-full h-full object-center object-cover" />
        </div>

        <div class="ml-4 mr-4 flex-1 flex flex-col">

          <div class="flex justify-between text-sm text-gray-900">
            <h3>
              {{ line.productVariant.name }}
            </h3>
          </div>

          <p class="mt-4 text-sm">
            {{ formatPrice(line.linePriceWithTax, appStore.activeOrder?.currencyCode) }}
          </p>

          <div class="mt-4 flex-1 flex items-end justify-between text-sm">
            <div class="flex items-center space-x-2">
              <!-- <span class="text-gray-500">{{ t('cart.qty') }}:</span> -->
              <div class="flex items-center border border-gray-300 rounded-md min-w-[80px] justify-center">
                <div class="flex items-center w-full">
                  <button @click="$event => decreaseQuantity(line, $event)" :disabled="loadingLines[line.id]" :class="[
                    'px-2 py-1 text-gray-600 hover:bg-gray-100 flex-1 transition-colors',
                    loadingLines[line.id] && 'opacity-50 cursor-not-allowed'
                  ]">
                    -
                  </button>
                  <span class="px-3 py-1 text-gray-700 min-w-8 text-center flex-1 border-l border-r border-gray-300">{{
                    line.quantity }}</span>
                  <button @click="$event => increaseQuantity(line, $event)"
                    :disabled="loadingLines[line.id] || isIncreaseDisabled(line)" :class="[
                      'px-2 py-1 text-gray-600 hover:bg-gray-100 flex-1 transition-colors',
                      (loadingLines[line.id] || isIncreaseDisabled(line)) && 'opacity-50 cursor-not-allowed'
                    ]">
                    +
                  </button>
                </div>
              </div>
            </div>
            <!-- <div class="flex min-w-[60px]"> -->
              <SfButton :disabled="loadingLines[line.id]" type="button" variant="tertiary" size="sm" :class="[
                'font-medium text-primary-600 hover:text-primary-500 transition-colors',
                loadingLines[line.id] && 'opacity-50 cursor-not-allowed'
              ]" @click="$event => removeItem(line.id, $event)">
                <span v-if="!loadingLines[line.id]">{{ t('cart.remove') }}</span>
              </SfButton>
            <!-- </div> -->
          </div>
        </div>
        </li>
    </ul>


  </div>
</template>

  <script>
  import { ref, defineEmits } from 'vue'
  import { useAppStore } from '../stores/app'
  import { formatPrice } from '../utils'
  import { removeOrderLineMutation, adjustOrderLineMutation } from '../providers/shop/orders/order'
  import { updateOrderCustomFieldsMutation } from '../providers/shop/checkout/checkout'
  import { useI18n } from 'vue-i18n'

  export default {
    name: 'CartContents',
    setup() {
      const { t } = useI18n()
      const appStore = useAppStore()
      const loading = ref(false)
      const stockLimitMessage = ref('')
      const stockLimitMessageKey = ref('') // 'removed' or 'limit'
      const showStockLimitMessage = ref(false)
      const loadingLines = ref({}) // Track loading state for each line
      const stockLimitTimeout = ref(null) // Track timeout for auto-dismissal

      async function clearPaymentPageVisitedAt() {
        try {
          const result = await updateOrderCustomFieldsMutation({
            customFields: {
              paymentPageVisitedAt: null
            }
          })
          if (result?.__typename === 'ErrorResult') {
            console.error('Failed to clear paymentPageVisitedAt:', result.message)
          } else {
            console.log('Successfully cleared paymentPageVisitedAt')
          }
        } catch (error) {
          console.error('Error clearing paymentPageVisitedAt:', error)
        }
      }

      function showStockLimitNotification(message, messageKey = 'limit') {
        console.log('showStockLimitNotification called with message:', message)
        stockLimitMessage.value = message
        stockLimitMessageKey.value = messageKey
        showStockLimitMessage.value = true
        console.log('Notification state set - showStockLimitMessage:', showStockLimitMessage.value, 'stockLimitMessage:', stockLimitMessage.value)

        // Clear any existing timeout to prevent multiple timeouts
        if (stockLimitTimeout.value) {
          clearTimeout(stockLimitTimeout.value)
        }

        // Set new timeout for auto-dismissal
        stockLimitTimeout.value = setTimeout(() => {
          showStockLimitMessage.value = false
          console.log('Notification auto-dismissed')
        }, 12000)
      }

      function closeStockLimitNotification() {
        console.log('Closing stock limit notification manually')
        showStockLimitMessage.value = false

        // Clear the auto-dismiss timeout when manually closed
        if (stockLimitTimeout.value) {
          clearTimeout(stockLimitTimeout.value)
          stockLimitTimeout.value = null
        }
      }

    async function removeItem(orderLineId, event) {
      // Prevent default browser behavior that causes red circle
      if (event) event.preventDefault()

      // Prevent multiple clicks if already loading
      if (loadingLines.value[orderLineId]) return

      console.log('Attempting to remove item:', orderLineId)

      // Set loading state for this specific line
      loadingLines.value[orderLineId] = true

      // Optimistic update: remove the item locally first for instant feedback
      const originalOrder = appStore.activeOrder
      if (originalOrder && originalOrder.lines) {
        const updatedLines = originalOrder.lines.filter(line => line.id !== orderLineId)

        // Update totals based on new quantities
        const subTotalWithTax = updatedLines.reduce((sum, line) => sum + line.linePriceWithTax, 0)
        const totalQuantity = updatedLines.reduce((sum, line) => sum + line.quantity, 0)

        const optimisticOrder = {
          ...originalOrder,
          lines: updatedLines,
          subTotalWithTax,
          totalQuantity
        }

        console.log('Applying optimistic update for removal')
        appStore.setActiveOrder(optimisticOrder)
      }

      try {
        console.log('Calling removeOrderLineMutation with orderLineId:', orderLineId)
        const result = await removeOrderLineMutation(orderLineId)
        console.log('Remove mutation result:', result)

        if (result.__typename === 'Order') {
          console.log('Remove successful, updating order')
          // Only update if the server response differs from our optimistic update
          if (JSON.stringify(result) !== JSON.stringify(appStore.activeOrder)) {
            appStore.setActiveOrder(result)
          }

          // Clear paymentPageVisitedAt if cart is now empty
          if (!result.lines || result.lines.length === 0) {
            await clearPaymentPageVisitedAt()
            // Also clear in local state
            appStore.setActiveOrder({
              ...result,
              customFields: {
                ...result.customFields,
                paymentPageVisitedAt: null
              }
            })
          }
        } else {
          console.error('Error removing item:', result.errorCode, result.message)
          // If remove fails, refresh the order from server to get valid state
          try {
            const { getActiveOrderQuery } = await import('../providers/shop/orders/order')
            const freshOrder = await getActiveOrderQuery()
            if (freshOrder) {
              appStore.setActiveOrder(freshOrder)
            } else {
              // Fallback: revert to original order if refresh fails
              if (originalOrder) {
                console.log('Reverting optimistic update due to error')
                appStore.setActiveOrder(originalOrder)
              }
            }
          } catch (refreshError) {
            console.error('Error refreshing order after remove error:', refreshError)
            // Final fallback: revert to original order
            if (originalOrder) {
              console.log('Reverting optimistic update due to network error')
              appStore.setActiveOrder(originalOrder)
            }
          }
        }
      } catch (error) {
        console.error('Error removing item:', error)
        // If remove fails due to network error, refresh the order from server
        try {
          const { getActiveOrderQuery } = await import('../providers/shop/orders/order')
          const freshOrder = await getActiveOrderQuery()
          if (freshOrder) {
            appStore.setActiveOrder(freshOrder)
          } else {
            // Fallback: revert to original order if refresh fails
            if (originalOrder) {
              console.log('Reverting optimistic update due to network error')
              appStore.setActiveOrder(originalOrder)
            }
          }
        } catch (refreshError) {
          console.error('Error refreshing order after network error:', refreshError)
          // Final fallback: revert to original order
          if (originalOrder) {
            console.log('Reverting optimistic update due to network error')
            appStore.setActiveOrder(originalOrder)
          }
        }
      } finally {
        // Clear loading state for this line
        loadingLines.value[orderLineId] = false
      }
    }

    async function adjustQuantity(orderLineId, newQuantity) {
      if (newQuantity < 0) return

      // Set loading state for this specific line
      loadingLines.value[orderLineId] = true

      // Optimistic update: update the quantity locally first for instant feedback
      const originalOrder = appStore.activeOrder
      if (originalOrder && originalOrder.lines) {
        const updatedLines = originalOrder.lines.map(line => {
          if (line.id === orderLineId) {
            return {
              ...line,
              quantity: newQuantity,
              linePriceWithTax: line.unitPriceWithTax * newQuantity
            }
          }
          return line
        })

        // Update totals based on new quantities
        const subTotalWithTax = updatedLines.reduce((sum, line) => sum + line.linePriceWithTax, 0)
        const totalQuantity = updatedLines.reduce((sum, line) => sum + line.quantity, 0)

        const optimisticOrder = {
          ...originalOrder,
          lines: updatedLines,
          subTotalWithTax,
          totalQuantity
        }

        appStore.setActiveOrder(optimisticOrder)
      }

      try {
        const result = await adjustOrderLineMutation(orderLineId, newQuantity)
        if (result.__typename === 'Order') {
          // Only update if the server response differs from our optimistic update
          // This prevents unnecessary re-renders
          if (JSON.stringify(result) !== JSON.stringify(appStore.activeOrder)) {
            appStore.setActiveOrder(result)
          }
        } else {
          console.error('Error adjusting quantity:', result.errorCode, result.message)
          // Show stock limit notification when we get stock-related errors from backend
          if (result.errorCode === 'INSUFFICIENT_STOCK_ERROR' || result.errorCode === 'INSUFFICIENT_STOCK') {
            // Extract the available quantity from the error message if possible
            const match = result.message.match(/(\d+)\s+items?.*available/i)
            const availableQuantity = match ? match[1] : 'some'

            // Check if the item was completely removed from the order
            try {
              const { getActiveOrderQuery } = await import('../providers/shop/orders/order')
              const freshOrder = await getActiveOrderQuery()
              if (freshOrder) {
                const itemStillExists = freshOrder.lines?.some(line => line.id === orderLineId)
                if (!itemStillExists) {
                  // Item was completely removed due to insufficient stock
                  showStockLimitNotification(t('cart.stockInsufficientRemoved'), 'removed')
                } else {
                  // Item still exists but quantity was adjusted
                  showStockLimitNotification(t('cart.onlyNAvailable', { n: availableQuantity }), 'limit')
                }
                appStore.setActiveOrder(freshOrder)
              }
            } catch (refreshError) {
              console.error('Error refreshing order after stock error:', refreshError)
              // Fallback: revert to original order if refresh fails
              if (originalOrder) {
                appStore.setActiveOrder(originalOrder)
              }
            }
          } else {
            // Revert optimistic update for other errors
            if (originalOrder) {
              appStore.setActiveOrder(originalOrder)
            }
          }
        }
      } catch (error) {
        console.error('Error adjusting quantity:', error)
        // Revert optimistic update on network errors
        if (originalOrder) {
          appStore.setActiveOrder(originalOrder)
        }
      } finally {
        // Clear loading state for this line
        loadingLines.value[orderLineId] = false
      }
    }

    function increaseQuantity(line, event) {
      // Prevent default browser behavior that causes red circle
      if (event) event.preventDefault()

      // Prevent multiple clicks if already loading
      if (loadingLines.value[line.id]) return

      const currentQuantity = line.quantity
      const stockLevel = line.productVariant?.stockLevel

      // Debug: log stock level data
      console.log('Stock level check:', {
        currentQuantity,
        stockLevel,
        productVariant: line.productVariant,
        hasStockLevel: line.productVariant?.hasOwnProperty('stockLevel'),
        stockLevelType: typeof line.productVariant?.stockLevel
      })

      // Check if stock level is available and if we're at the limit
      if (stockLevel !== undefined && stockLevel !== null) {
        console.log('Stock level is available:', stockLevel)

        // Handle both numeric stock levels and string status values
        if (typeof stockLevel === 'number') {
          // Numeric stock level - compare directly
          if (currentQuantity >= stockLevel) {
            console.log('Stock limit reached (numeric), showing notification')
            showStockLimitNotification(t('cart.maxStockReached', { n: stockLevel }), 'limit')
            return
          }
        } else if (typeof stockLevel === 'string') {
          // String status - check if it's OUT_OF_STOCK or similar
          if (stockLevel === 'OUT_OF_STOCK' || stockLevel === 'INSUFFICIENT_STOCK') {
            console.log('Stock limit reached (string status), showing notification')
            showStockLimitNotification(t('cart.outOfStock'), 'limit')
            return
          }
          // For IN_STOCK, we can't determine the exact limit from the string status
          // So we'll let the mutation fail and show the error from the backend
        }
      } else {
        console.log('Stock level is not available or null/undefined')
      }

      adjustQuantity(line.id, currentQuantity + 1)
    }

    function decreaseQuantity(line, event) {
      // Prevent default browser behavior that causes red circle
      if (event) event.preventDefault()

      // Prevent multiple clicks if already loading
      if (loadingLines.value[line.id]) return

      // When quantity is 1, clicking - removes the item (sets quantity to 0)
      if (line.quantity === 1) {
        removeItem(line.id)
      } else {
        adjustQuantity(line.id, line.quantity - 1)
      }
    }

    // Function to check if + button should be disabled for a line
    function isIncreaseDisabled(line) {
      const currentQuantity = line.quantity
      const stockLevel = line.productVariant?.stockLevel

      // If stock level is available and current quantity >= stock level, disable +
      if (stockLevel !== undefined && stockLevel !== null) {
        return currentQuantity >= stockLevel
      }

      // If no stock level info, don't disable
      return false
    }

    return {
      t,
      appStore,
      formatPrice,
      removeItem,
      increaseQuantity,
      decreaseQuantity,
      loading,
      loadingLines,
      stockLimitMessage,
      stockLimitMessageKey,
      showStockLimitMessage,
      showStockLimitNotification,
      closeStockLimitNotification,
      isIncreaseDisabled
    }
  }
}
</script>

<style scoped>
/* Subtle transitions for smooth interactions */
button {
  transition: all 0.2s ease-in-out;
}

/* Ensure disabled buttons don't show red circle */
button:disabled {
  cursor: not-allowed;
}
</style>