// JWT Token management utilities for hybrid authentication

const TOKEN_KEY = 'vendure_auth_token'

/**
 * Store JWT token in localStorage
 */
export function storeToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
    return true
  } catch (error) {
    console.error('Failed to store token:', error)
    return false
  }
}

/**
 * Retrieve JWT token from localStorage
 */
export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch (error) {
    console.error('Failed to retrieve token:', error)
    return null
  }
}

/**
 * Remove JWT token from localStorage
 */
export function removeToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
    return true
  } catch (error) {
    console.error('Failed to remove token:', error)
    return false
  }
}

/**
 * Check if we have a valid JWT token stored
 */
export function hasToken() {
  const token = getToken()
  return token && token.length > 0
}

/**
 * Get Authorization header value for JWT token
 */
export function getAuthHeader() {
  const token = getToken()
  return token ? `Bearer ${token}` : null
}