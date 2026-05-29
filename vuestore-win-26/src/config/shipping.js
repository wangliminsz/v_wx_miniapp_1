// Shipping method configuration
// Define available shipping methods with names and prices
// Simple configuration matching Qwik example - always available

export const SHIPPING_METHODS = [
  {
    id: 'standard-shipping',
    name: 'Standard Shipping',
    price: 500, // $5.00 in cents
    priceWithTax: 500,
    code: 'STANDARD_SHIPPING'
  },
  {
    id: 'express-shipping',
    name: 'Express Shipping',
    price: 1000, // $10.00 in cents
    priceWithTax: 1000,
    code: 'EXPRESS_SHIPPING'
  }
]

// Helper function to get eligible shipping methods - always return all methods
export function getEligibleShippingMethods() {
  return SHIPPING_METHODS
}

// Helper function to get the first available shipping method ID
export function getFirstAvailableShippingMethodId() {
  // Return the ID of the first shipping method
  // In a real implementation, this would query the Vendure API for available methods
  return SHIPPING_METHODS[0]?.id || 'standard-shipping'
}

// Helper function to get shipping method by ID
export function getShippingMethodById(id) {
  return SHIPPING_METHODS.find(method => method.id === id)
}

// Helper function to get default shipping method
export function getDefaultShippingMethod() {
  // Always return Standard Shipping as default
  return SHIPPING_METHODS.find(method => method.id === 'standard-shipping') || SHIPPING_METHODS[0]
}