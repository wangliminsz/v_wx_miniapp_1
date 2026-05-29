export function isCheckoutPage(url) {
  return url.includes('/checkout/')
}

// export function formatPrice(price, currencyCode = 'USD') {
//   return new Intl.NumberFormat('en-US', {
//     style: 'currency',
//     currency: currencyCode
//   }).format(price / 100)
// }

export function formatPrice(price, currencyCode = 'USD') {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode
  }).format(price / 100)

  // Insert a space after the currency symbol if missing
  return formatted.replace(/^(\D+)(\d)/, '$1 $2')
}
