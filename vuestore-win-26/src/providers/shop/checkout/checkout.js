import { gql } from 'graphql-tag'
import { graphqlRequest } from '../../../utils/api'
import { getToken } from '../../../utils/auth'

const GET_AVAILABLE_COUNTRIES = gql`
  query GetAvailableCountries {
    availableCountries {
      id
      code
      name
    }
  }
`

const GET_ELIGIBLE_SHIPPING_METHODS = gql`
  query GetEligibleShippingMethods {
    eligibleShippingMethods {
      id
      code
      name
      description
      price
      priceWithTax
    }
  }
`

const GET_ACTIVE_ORDER_SHIPPING_ADDRESS = gql`
  query GetActiveOrderShippingAddress {
    activeOrder {
      id
      code
      shippingAddress {
        fullName
        streetLine1
        # streetLine2
        # city
        # province
        countryCode
        # postalCode
        phoneNumber
      }
    }
  }
`

const SET_ORDER_SHIPPING_METHOD_MUTATION = gql`
  mutation SetOrderShippingMethod($shippingMethodId: [ID!]!) {
    setOrderShippingMethod(shippingMethodId: $shippingMethodId) {
      ... on Order {
        id
        code
        state
        shippingWithTax
        totalWithTax
        subTotalWithTax
        currencyCode
        shippingLines {
          shippingMethod {
            id
            code
            name
          }
          priceWithTax
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`

const SET_ORDER_SHIPPING_ADDRESS_MUTATION = gql`
  mutation SetOrderShippingAddress($input: CreateAddressInput!) {
    setOrderShippingAddress(input: $input) {
      ... on Order {
        id
        code
        state
        shippingWithTax
        totalWithTax
        subTotalWithTax
        currencyCode
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`

const TRANSITION_TO_ARRANGING_PAYMENT_MUTATION = gql`
  mutation TransitionToArrangingPayment($state: String!) {
    transitionOrderToState(state: $state) {
      ... on Order {
        id
        code
        state
        shippingWithTax
        totalWithTax
        subTotalWithTax
        currencyCode
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`

const ADD_PAYMENT_MUTATION = gql`
  mutation AddPayment($input: PaymentInput!) {
    addPaymentToOrder(input: $input) {
      ... on Order {
        id
        code
        state
        payments {
          id
          method
          state
          amount
          metadata
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`

const CREATE_STRIPE_PAYMENT_INTENT = gql`
  mutation CreateStripePaymentIntent($amount: Int) {
    createStripePaymentIntent(amount: $amount)
  }
`
// amount
// amount: $amount
// , $amount: Int
const SIMULATE_PAYMENT_MUTATION = gql`
  mutation SimulatePayment($orderId: ID!) {
    simulatePayment(orderId: $orderId) {
      id
      code
      state
      payments {
        id
        method
        state
        metadata
      }
    }
  }
`

export async function setOrderShippingMethodMutation(shippingMethodId) {
  try {
    // console.log('🚀 SHIPPING METHOD MUTATION - START')
    // console.log('🚀 Shipping Method ID to set:', shippingMethodId)
    // console.log('🚀 GraphQL Mutation Query:', SET_ORDER_SHIPPING_METHOD_MUTATION.loc.source.body)

    const variables = { shippingMethodId: [shippingMethodId] }
    // console.log('🚀 GraphQL Mutation Variables:', variables)

    // console.log('🚀 Calling graphqlRequest...')
    const data = await graphqlRequest(SET_ORDER_SHIPPING_METHOD_MUTATION, variables)
    // console.log('🚀 GraphQL Response Data:', data)

    const result = data.setOrderShippingMethod
    // console.log('🚀 Mutation Result:', result)
    // console.log('🚀 Result Type:', result?.__typename)
    // console.log('🚀 Shipping Cost in Result:', result?.shippingWithTax)
    // console.log('🚀 Order State in Result:', result?.state)
    // console.log('🚀 SHIPPING METHOD MUTATION - END')

    return result
  } catch (error) {
    console.error('❌ SHIPPING METHOD MUTATION - ERROR:', error)
    console.error('❌ Error details:', error.message)
    throw error
  }
}

export async function setOrderShippingAddressMutation(input) {
  try {
    const data = await graphqlRequest(SET_ORDER_SHIPPING_ADDRESS_MUTATION, { input })
    return data.setOrderShippingAddress
  } catch (error) {
    console.error('Error setting order shipping address:', error)
    throw error
  }
}

export async function transitionToArrangingPaymentMutation() {
  try {
    const data = await graphqlRequest(TRANSITION_TO_ARRANGING_PAYMENT_MUTATION, { state: "ArrangingPayment" })
    return data.transitionOrderToState
  } catch (error) {
    console.error('Error transitioning order to ArrangingPayment:', error)
    throw error
  }
}

export async function addPaymentToOrderMutation(input) {
  try {
    const data = await graphqlRequest(ADD_PAYMENT_MUTATION, { input })
    return data.addPaymentToOrder
  } catch (error) {
    console.error('Error adding payment to order:', error)
    throw error
  }
}

export async function createStripePaymentIntentMutation(amount) {
  try {
    const variables = amount ? { amount } : {}
    const data = await graphqlRequest(CREATE_STRIPE_PAYMENT_INTENT, variables)
    return data.createStripePaymentIntent
  } catch (error) {
    console.error('Error creating Stripe payment intent:', error)
    throw error
  }
}

export async function simulatePaymentMutation(orderId, amount) {
  try {
    const variables = { orderId }
    if (amount) {
      variables.amount = amount
    }
    const data = await graphqlRequest(SIMULATE_PAYMENT_MUTATION, variables)
    return data.simulatePayment
  } catch (error) {
    console.error('Error simulating payment:', error)
    throw error
  }
}

export async function getAvailableCountriesQuery() {
  try {
    const data = await graphqlRequest(GET_AVAILABLE_COUNTRIES)
    return data.availableCountries
  } catch (error) {
    console.error('Error fetching available countries:', error)
    return []
  }
}

export async function getEligibleShippingMethodsQuery() {
  try {
    const data = await graphqlRequest(GET_ELIGIBLE_SHIPPING_METHODS)
    return data.eligibleShippingMethods || []
  } catch (error) {
    console.error('Error fetching eligible shipping methods:', error)
    return []
  }
}

export async function getActiveOrderShippingAddressQuery() {
  try {
    const data = await graphqlRequest(GET_ACTIVE_ORDER_SHIPPING_ADDRESS)
    return data.activeOrder?.shippingAddress || null
  } catch (error) {
    console.error('Error fetching active order shipping address:', error)
    return null
  }
}

// 2025-12-08

const INITIATE_NOWPAYMENTS_PAYMENT = gql`
  mutation {
    initiateNowPaymentsPayment
  }
`

export async function initiateNowPaymentsPaymentMutation() {
  try {
    const data = await graphqlRequest(INITIATE_NOWPAYMENTS_PAYMENT)
    return data.initiateNowPaymentsPayment
  } catch (error) {
    console.error('Error initiating Nowpayments payment:', error)
    throw error
  }
}

// 2025-12-15 - PromptPay payment
const CREATE_PROMPTPAY_CHARGE = gql`
  mutation CreateOmisePromptPayCharge {
    createOmisePromptPayCharge {
      qrCodeUrl
    }
  }
`

export async function createOmisePromptPayChargeMutation() {
  try {
    const data = await graphqlRequest(CREATE_PROMPTPAY_CHARGE)
    return data.createOmisePromptPayCharge
  } catch (error) {
    console.error('Error creating Omise PromptPay charge:', error)
    throw error
  }
}

// 2025-12-29 - PromptPay Partial payment
const CREATE_PROMPTPAY_PARTIAL_CHARGE = gql`
  mutation CreateCharge {
    createOmisePromptPayPartialCharge {
      qrCodeUrl
    }
  }
`

export async function createOmisePromptPayPartialChargeMutation() {
  try {
    const data = await graphqlRequest(CREATE_PROMPTPAY_PARTIAL_CHARGE)
    return data.createOmisePromptPayPartialCharge
  } catch (error) {
    console.error('Error creating Omise PromptPay partial charge:', error)
    throw error
  }
}

const UPDATE_ORDER_CUSTOM_FIELDS_MUTATION = gql`
  mutation SetOrderCustomFields($input: UpdateOrderInput!) {
    setOrderCustomFields(input: $input) {
      ... on Order {
        id
        code
        state
        customFields {
          paymentPageVisitedAt
          customerMessage
          paymentProofs {
            id
            name
            preview
            source
          }
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`

export async function updateOrderCustomFieldsMutation(input) {
  try {
    const data = await graphqlRequest(UPDATE_ORDER_CUSTOM_FIELDS_MUTATION, { input })
    return data.updateOrderCustomFields
  } catch (error) {
    console.error('Error updating order custom fields:', error)
    throw error
  }
}

const UPLOAD_CUSTOMER_FILE_MUTATION = gql`
  mutation UploadCustomerFile($file: Upload!) {
    uploadCustomerFile(file: $file) {
      id
      name
      preview
      source
    }
  }
`

export async function uploadCustomerFile(file) {
  try {
    const formData = new FormData()
    
    const operations = {
      query: `
        mutation UploadCustomerFile($file: Upload!) {
          uploadCustomerFile(file: $file) {
            id
            name
            preview
            source
          }
        }
      `,
      variables: { file: null }
    }
    
    formData.append('operations', JSON.stringify(operations))
    formData.append('map', JSON.stringify({ '0': ['variables.file'] }))
    formData.append('0', file)

    const headers = {}
    const token = getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // Use the same API endpoint as regular GraphQL requests
    const apiUrl = '/api'

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: formData
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`HTTP error! status: ${response.status} - ${text}`)
    }

    const json = await response.json()
    if (json.errors) throw new Error(json.errors[0].message)
    
    return json.data.uploadCustomerFile
  } catch (error) {
    console.error('Error uploading file:', error)
    throw error
  }
}