import { gql } from 'graphql-tag'
import { graphqlRequest } from '../../../utils/api'
import { storeToken, removeToken } from '../../../utils/auth'

const LOGIN_MUTATION = gql`
  mutation LogIn($emailAddress: String!, $password: String!) {
    login(username: $emailAddress, password: $password) {
      __typename
      ... on CurrentUser {
        id
        identifier
        # JWT token is returned in response headers, not in GraphQL response body
      }
      ... on InvalidCredentialsError {
        errorCode
        message
      }
    }
  }
`

const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout {
      success
    }
  }
`

export async function loginMutation(emailAddress, password) {
  try {
    const result = await graphqlRequest(LOGIN_MUTATION, {
      emailAddress,
      password
    })

    // Handle successful login
    if (result.login.__typename === 'CurrentUser') {
      // // console.log('✅ Login successful - customer ID:', result.login.id)
      // // console.log('ℹ️ JWT token extraction is handled automatically in graphqlRequest')
    }

    return result.login
  } catch (error) {
    console.error('Error during login:', error)
    throw error
  }
}

export async function logoutMutation() {
  try {
    // Call the logout mutation first while we still have authentication
    const result = await graphqlRequest(LOGOUT_MUTATION)

    // Then remove JWT token
    removeToken()

    return { success: result.logout?.success || false }
  } catch (error) {
    console.error('Error during logout:', error)
    // Even if the mutation fails, remove the token locally
    removeToken()
    return { success: false }
  }
}