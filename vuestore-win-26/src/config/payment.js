// Payment method configuration
// Define available payment methods with names and codes
// Filtered based on environment variables

const ALL_PAYMENT_METHODS = [
  {
    id: 'standard-payment',
    name: 'Standard Payment',
    code: 'standard-payment',
    description: 'This is a dummy payment for demonstration purposes only',
    envKey: 'VITE_STANDARD_PAYMENT'
  },
  {
    id: 'nowpayments',
    name: 'Crypto Payment',
    code: 'nowpayments',
    description: 'Pay with cryptocurrency via NowPayments',
    envKey: 'VITE_CRYPTO_PAYMENT'
  },
  {
    id: 'omise',
    name: 'Omise Payment',
    code: 'omise',
    description: 'Pay securely with Omise payment gateway',
    envKey: 'VITE_OMISE_PAYMENT'
  },
  {
    id: 'promptpay',
    name: 'PromptPay',
    code: 'promptpay',
    description: 'Pay with PromptPay QR code',
    envKey: 'VITE_PROMPTPAY_PAYMENT'
  },
  {
    id: 'promptpay-partial',
    name: 'PromptPay (Partial)',
    code: 'promptpay-partial',
    description: 'Pay partially with PromptPay QR code',
    envKey: 'VITE_PROMPTPAY_PARTIAL_PAYMENT'
  }
  // {
  //   id: 'stripe',
  //   name: 'Stripe',
  //   code: 'stripe',
  //   description: 'Pay securely with your credit card via Stripe',
  //   envKey: 'VITE_STRIPE_PAYMENT'
  // }
]

// Filter payment methods based on environment variables
function getFilteredPaymentMethods() {
  return ALL_PAYMENT_METHODS.filter(method => {
    // Check if env variable exists and is 'true'
    const enabled = import.meta.env[method.envKey]
    return enabled === 'true' || enabled === true
  })
}

// Export filtered payment methods
export const PAYMENT_METHODS = getFilteredPaymentMethods()

// Helper function to get eligible payment methods - returns filtered methods
export function getEligiblePaymentMethods() {
  return PAYMENT_METHODS
}

// Helper function to get payment method by ID
export function getPaymentMethodById(id) {
  return PAYMENT_METHODS.find(method => method.id === id)
}

// Helper function to get default payment method
export function getDefaultPaymentMethod() {
  // Always return Standard Payment as default if available
  return PAYMENT_METHODS.find(method => method.id === 'standard-payment') || PAYMENT_METHODS[0]
}