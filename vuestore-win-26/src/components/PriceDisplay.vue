<template>
  <!-- items-end -->
  <div class="flex flex-col">
    <span>{{ formatPrice(price, currencyCode) }}</span>
     <span v-if="showCny && (currencyCode === 'THB' || currencyCode === 'USD') && cnyRate" class="text-sm text-gray-500">
       ≈ {{ formatCnyPrice(price * cnyRate) }}
     </span>
  </div>
</template>

<script>
import { computed } from 'vue'
import { formatPrice } from '../utils'
import { useAppStore } from '../stores/app'

export default {
  name: 'PriceDisplay',
  props: {
    price: {
      type: Number,
      required: true
    },
    currencyCode: {
      type: String,
      default: 'USD'
    }
  },
   setup(props) {
     const appStore = useAppStore()
     const showCny = import.meta.env.VITE_SHOW_CNY_AMOUNT === 'true'
    const cnyRate = computed(() => {
      if (props.currencyCode === 'THB') {
        return appStore.thbRates?.CNY || 0
      } else if (props.currencyCode === 'USD') {
        return appStore.usdRates?.CNY || 0
      }
      return 0
    })

     // Format CNY price with space between symbol and number
     const formatCnyPrice = (amount) => {
       const rawPrice = formatPrice(amount, 'CNY')
       // For CNY, extract symbol and number, then add space
       const symbolMatch = rawPrice.match(/^([^\d]+)(.+)$/)
       if (symbolMatch) {
         return `${symbolMatch[1]} ${symbolMatch[2]}`
       }
       return rawPrice
     }

     return {
       formatPrice,
       showCny,
       cnyRate,
       formatCnyPrice
     }
   }
}
</script>