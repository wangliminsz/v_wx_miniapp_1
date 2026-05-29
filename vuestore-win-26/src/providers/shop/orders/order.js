import { gql } from 'graphql-tag'
import { graphqlRequest } from '../../../utils/api'

const GET_ACTIVE_ORDER = gql`
  query GetActiveOrder {
    activeOrder {
      id
      code
      state
      totalQuantity
      subTotal
      subTotalWithTax
      totalWithTax
      shippingWithTax
      currencyCode
      shippingLines {
        shippingMethod {
          id
          code
          name
        }
        priceWithTax
      }
      lines {
        id
        unitPriceWithTax
        linePriceWithTax
        quantity
        featuredAsset {
          id
          preview
        }
        productVariant {
          id
          name
          price
          stockLevel
          product {
            id
            name
            slug
          }
        }
      }
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
  }
`

const ADD_ITEM_TO_ORDER_MUTATION = gql`
  mutation AddItemToOrder($productVariantId: ID!, $quantity: Int!) {
    addItemToOrder(productVariantId: $productVariantId, quantity: $quantity) {
      __typename
      ... on Order {
        id
        code
        state
        totalQuantity
        subTotal
        subTotalWithTax
        totalWithTax
        currencyCode
        lines {
          id
          unitPriceWithTax
          linePriceWithTax
          quantity
          featuredAsset {
            id
            preview
          }
          productVariant {
            id
            name
            price
            stockLevel
            product {
              id
              name
              slug
            }
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

export async function getActiveOrderQuery() {
  try {
    const data = await graphqlRequest(GET_ACTIVE_ORDER)
    return data.activeOrder
  } catch (error) {
    console.error('Error fetching active order:', error)
    return null
  }
}

export async function addItemToOrderMutation(productVariantId, quantity) {
  try {
    const variables = {
      productVariantId,
      quantity
    }
    const result = await graphqlRequest(ADD_ITEM_TO_ORDER_MUTATION, variables)
    return result.addItemToOrder
  } catch (error) {
    console.error('Error adding item to order:', error)
    throw error
  }
}

const REMOVE_ORDER_LINE_MUTATION = gql`
  mutation RemoveOrderLine($orderLineId: ID!) {
    removeOrderLine(orderLineId: $orderLineId) {
      __typename
      ... on Order {
        id
        code
        state
        totalQuantity
        subTotal
        subTotalWithTax
        totalWithTax
        currencyCode
        lines {
          id
          unitPriceWithTax
          linePriceWithTax
          quantity
          featuredAsset {
            id
            preview
          }
          productVariant {
            id
            name
            price
            stockLevel
            product {
              id
              name
              slug
            }
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

export async function removeOrderLineMutation(orderLineId) {
  try {
    const variables = { orderLineId }
    const result = await graphqlRequest(REMOVE_ORDER_LINE_MUTATION, variables)
    return result.removeOrderLine
  } catch (error) {
    console.error('Error removing order line:', error)
    throw error
  }
}

const ADJUST_ORDER_LINE_MUTATION = gql`
  mutation AdjustOrderLine($orderLineId: ID!, $quantity: Int!) {
    adjustOrderLine(orderLineId: $orderLineId, quantity: $quantity) {
      __typename
      ... on Order {
        id
        code
        state
        totalQuantity
        subTotal
        subTotalWithTax
        totalWithTax
        currencyCode
        lines {
          id
          unitPriceWithTax
          linePriceWithTax
          quantity
          featuredAsset {
            id
            preview
          }
          productVariant {
            id
            name
            price
            stockLevel
            product {
              id
              name
              slug
            }
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

export async function adjustOrderLineMutation(orderLineId, quantity) {
  try {
    const variables = { orderLineId, quantity }
    const result = await graphqlRequest(ADJUST_ORDER_LINE_MUTATION, variables)
    return result.adjustOrderLine
  } catch (error) {
    console.error('Error adjusting order line:', error)
    throw error
  }
}

const GET_ORDER_BY_CODE = gql`
  query GetOrderByCode($code: String!) {
    orderByCode(code: $code) {
      id
      code
      state
      createdAt
      totalWithTax
      shippingWithTax
      subTotalWithTax
      currencyCode
      customFields {
        amountPaid
        paymentPageVisitedAt
        customerMessage
      }
      customer {
        firstName
        lastName
        emailAddress
        phoneNumber
      }
      shippingAddress {
        fullName
        company
        streetLine1
        streetLine2
        city
        province
        postalCode
        countryCode
        phoneNumber
      }
      shippingLines {
        shippingMethod {
          id
          code
          name
          description
        }
        priceWithTax
      }
      payments {
        id
        state
        transactionId
        method
        amount
        metadata
      }
      lines {
        id
        quantity
        linePriceWithTax
        featuredAsset {
          id
          preview
        }
        productVariant {
          id
          name
          sku
        }
      }
    }
  }
`

export async function getOrderByCodeQuery(code) {
  try {
    const data = await graphqlRequest(GET_ORDER_BY_CODE, { code })
    return data.orderByCode
  } catch (error) {
    console.error('Error fetching order by code:', error)
    throw error
  }
}

// Query to get all orders for the active customer (including active order)
const GET_UNSETTLED_ORDERS = gql`
  query GetUnsettledOrders {
    activeCustomer {
      orders(options: { sort: { createdAt: DESC } }) {
        items {
          id
          code
          state
          totalWithTax
          currencyCode
          active
      customFields {
        amountPaid
        paymentPageVisitedAt
        customerMessage
      }
          lines {
            id
            quantity
            linePriceWithTax
            featuredAsset {
              id
              preview
            }
            productVariant {
              name
              sku
            }
          }
          payments {
            id
            method
            state
            metadata
            amount
          }
          shippingLines {
            id
            priceWithTax
            shippingMethod {
              id
              code
              name
              description
            }
          }
        }
      }
    }
  }
`

export async function getUnsettledOrdersQuery() {
  try {
    const data = await graphqlRequest(GET_UNSETTLED_ORDERS)
    return data.activeCustomer?.orders || { items: [] }
  } catch (error) {
    console.error('Error fetching unsettled orders:', error)
    return { items: [] }
  }
}

const CANCEL_MY_ORDER_MUTATION = gql`
  mutation CancelMyOrder($code: String!) {
    cancelMyOrder(code: $code) {
      id
      code
      state
    }
  }
`

export async function cancelMyOrderMutation(code) {
  try {
    const variables = { code }
    const result = await graphqlRequest(CANCEL_MY_ORDER_MUTATION, variables)
    return result.cancelOrder
  } catch (error) {
    console.error('Error cancelling order:', error)
    throw error
  }
}

const REACTIVATE_ORDER_MUTATION = gql`
  mutation ReactivateOrder($orderCode: String!) {
    reactivateOrder(orderCode: $orderCode) {
      id
      code
      state
      lines {
        id
        quantity
        productVariant {
          id
          name
          sku
        }
      }
    }
  }
`

export async function reactivateOrderMutation(orderCode) {
  try {
    const variables = { orderCode }
    const result = await graphqlRequest(REACTIVATE_ORDER_MUTATION, variables)
    return result.reactivateOrder
  } catch (error) {
    console.error('Error reactivating order:', error)
    throw error
  }
}