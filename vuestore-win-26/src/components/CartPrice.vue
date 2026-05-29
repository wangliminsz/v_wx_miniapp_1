<template>
  <span v-html="formatPriceWithCny(order[field], order.currencyCode)"></span>
</template>

<script>
import { formatPrice } from '../utils'
import { useAppStore } from '../stores/app'

export default {
  name: 'CartPrice',
  props: {
    order: {
      type: Object,
      required: true
    },
    field: {
      type: String,
      required: true
    }
  },
  setup() {
    const appStore = useAppStore()

    const formatPriceWithCny = (amount, currencyCode) => {
      const mainPrice = formatPrice(amount, currencyCode)

      const showCny = import.meta.env.VITE_SHOW_CNY_AMOUNT === 'true' && (currencyCode === 'THB' || currencyCode === 'USD')
      const cnyRate = currencyCode === 'THB' ? (appStore.thbRates?.CNY || 0) : (appStore.usdRates?.CNY || 0)

      if (showCny && cnyRate) {
        const cnyPriceRaw = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'CNY'
        }).format((amount / 100) * cnyRate)
        // Format CNY with space between symbol and number
        const cnySymbolMatch = cnyPriceRaw.match(/^([^\d]+)(.+)$/)
        const cnyCurrencySymbol = cnySymbolMatch ? cnySymbolMatch[1] : 'CN¥'
        const cnyNumeric = cnySymbolMatch ? cnySymbolMatch[2] : cnyPriceRaw
        const cnyPrice = `${cnyCurrencySymbol} ${cnyNumeric}`
        return `${mainPrice}<br><span class="text-sm text-gray-500">≈ ${cnyPrice}</span>`
      }

      return mainPrice
    }

    return {
      formatPriceWithCny
    }
  }
}
</script>