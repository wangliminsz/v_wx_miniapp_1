import { gql } from 'graphql-tag'
import { graphqlRequest } from '../../../utils/api'

const GET_ACTIVE_CUSTOMER = gql`
  query GetActiveCustomer {
    activeCustomer {
      id
      title
      firstName
      lastName
      emailAddress
      phoneNumber
    }
  }
`

const GET_ACTIVE_CUSTOMER_ORDERS = gql`
  query GetActiveCustomerOrders($options: OrderListOptions) {
    activeCustomer {
      id
      orders(options: $options) {
        items {
          id
          code
          state
          totalWithTax
          currencyCode
          createdAt
          lines {
            id
            featuredAsset {
              preview
            }
            productVariant {
              name
            }
          }
        }
        totalItems
      }
    }
  }
`

const UPDATE_CUSTOMER_MUTATION = gql`
  mutation UpdateCustomer($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      id
      title
      firstName
      lastName
      emailAddress
      phoneNumber
    }
  }
`

const UPDATE_CUSTOMER_PASSWORD_MUTATION = gql`
  mutation UpdateCustomerPassword($currentPassword: String!, $newPassword: String!) {
    updateCustomerPassword(currentPassword: $currentPassword, newPassword: $newPassword) {
      __typename
      ... on Success {
        success
      }
      ... on InvalidCredentialsError {
        errorCode
        message
      }
      ... on PasswordValidationError {
        errorCode
        message
      }
      ... on NativeAuthStrategyError {
        errorCode
        message
      }
    }
  }
`

const GET_CUSTOMER_ADDRESSES = gql`
  query GetCustomerAddresses {
    activeCustomer {
      id
      addresses {
        id
        fullName
        company
        streetLine1
        streetLine2
        city
        province
        postalCode
        country {
          code
          name
        }
        phoneNumber
        defaultShippingAddress
        defaultBillingAddress
      }
    }
  }
`

// const CREATE_CUSTOMER_ADDRESS = gql`
//   mutation CreateCustomerAddress($input: CreateAddressInput!) {
//     createCustomerAddress(input: $input) {
//       id
//       fullName
//       company
//       streetLine1
//       streetLine2
//       city
//       province
//       postalCode
//       countryCode
//       phoneNumber
//       defaultShippingAddress
//       defaultBillingAddress
//     }
//   }
// `

// const UPDATE_CUSTOMER_ADDRESS = gql`
//   mutation UpdateCustomerAddress($input: UpdateAddressInput!) {
//     updateCustomerAddress(input: $input) {
//       id
//       fullName
//       company
//       streetLine1
//       streetLine2
//       city
//       province
//       postalCode
//       countryCode
//       phoneNumber
//       defaultShippingAddress
//       defaultBillingAddress
//     }
//   }
// `



const CREATE_CUSTOMER_ADDRESS = gql`
  mutation CreateCustomerAddress($input: CreateAddressInput!) {
    createCustomerAddress(input: $input) {
      id
      fullName
      company
      streetLine1
      streetLine2
      city
      province
      postalCode
      country {
        code
        name
      }
      phoneNumber
      defaultShippingAddress
      defaultBillingAddress
    }
  }
`

const UPDATE_CUSTOMER_ADDRESS = gql`
  mutation UpdateCustomerAddress($input: UpdateAddressInput!) {
    updateCustomerAddress(input: $input) {
      id
      fullName
      company
      streetLine1
      streetLine2
      city
      province
      postalCode
      country {
        code
        name
      }
      phoneNumber
      defaultShippingAddress
      defaultBillingAddress
    }
  }
`


const DELETE_CUSTOMER_ADDRESS = gql`
  mutation DeleteCustomerAddress($id: ID!) {
    deleteCustomerAddress(id: $id) {
      success
    }
  }
`


export async function getActiveCustomerQuery() {
  try {
    const data = await graphqlRequest(GET_ACTIVE_CUSTOMER)
    return data.activeCustomer
  } catch (error) {
    console.error('Error fetching active customer:', error)
    return null
  }
}

export async function getActiveCustomerOrdersQuery() {
  try {
    const variables = {
      options: {
        filter: {
          active: {
            eq: false
          }
        },
        sort: {
          createdAt: 'DESC'
        }
      }
    }
    const data = await graphqlRequest(GET_ACTIVE_CUSTOMER_ORDERS, variables)
    return data.activeCustomer
  } catch (error) {
    console.error('Error fetching active customer orders:', error)
    return null
  }
}

export async function updateCustomerMutation(input) {
  try {
    const result = await graphqlRequest(UPDATE_CUSTOMER_MUTATION, { input })
    return result.updateCustomer
  } catch (error) {
    console.error('Error updating customer:', error)
    throw error
  }
}

export async function updateCustomerPasswordMutation(currentPassword, newPassword) {
  try {
    const result = await graphqlRequest(UPDATE_CUSTOMER_PASSWORD_MUTATION, {
      currentPassword,
      newPassword
    })
    return result.updateCustomerPassword
  } catch (error) {
    console.error('Error updating customer password:', error)
    throw error
  }
}

export async function getCustomerAddressesQuery() {
  try {
    const data = await graphqlRequest(GET_CUSTOMER_ADDRESSES)
    return data?.activeCustomer?.addresses || []
  } catch (error) {
    console.error('Error fetching customer addresses:', error)
    return []
  }
}

export async function createCustomerAddressMutation(input) {
  try {
    const result = await graphqlRequest(CREATE_CUSTOMER_ADDRESS, { input })
    return result.createCustomerAddress
  } catch (error) {
    console.error('Error creating customer address:', error)
    throw error
  }
}

export async function updateCustomerAddressMutation(input) {
  try {
    const result = await graphqlRequest(UPDATE_CUSTOMER_ADDRESS, { input })
    return result.updateCustomerAddress
  } catch (error) {
    console.error('Error updating customer address:', error)
    throw error
  }
}

export async function deleteCustomerAddressMutation(id) {
  try {
    const result = await graphqlRequest(DELETE_CUSTOMER_ADDRESS, { id })
    return result.deleteCustomerAddress
  } catch (error) {
    console.error('Error deleting customer address:', error)
    throw error
  }
}

