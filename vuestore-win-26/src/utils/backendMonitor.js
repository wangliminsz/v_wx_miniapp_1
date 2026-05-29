/**
 * Backend restart detection and graceful handling
 * This utility helps detect when the Vendure backend restarts
 * and clears stale authentication and cart data
 */

import { hasToken, removeToken } from './auth'

// Store the last known backend state
let lastBackendState = {
  timestamp: Date.now(),
  isAuthenticated: false
}

/**
 * Check if backend has likely restarted by detecting authentication failures
 * after previously successful authentication
 */
export function detectBackendRestart(currentAuthState) {
  const now = Date.now()
  const timeSinceLastCheck = now - lastBackendState.timestamp

  // If we had authentication before but now we don't (and it's recent)
  if (lastBackendState.isAuthenticated && !currentAuthState && timeSinceLastCheck < 60000) {
    // Likely backend restart - clear all authentication data
    console.warn('Backend restart detected - clearing authentication data')
    removeToken()
    return true
  }

  // Update last known state
  lastBackendState = {
    timestamp: now,
    isAuthenticated: currentAuthState
  }

  return false
}

/**
 * Handle authentication errors that might indicate backend restart
 */
export function handleAuthError(error) {
  if (error.message?.includes('Unauthorized') ||
      error.message?.includes('authentication') ||
      error.message?.includes('token') ||
      error.message?.includes('expired')) {

    // If we have a token but getting auth errors, likely backend restart
    if (hasToken()) {
      console.warn('Authentication error with existing token - clearing data')
      removeToken()
      return true
    }
  }
  return false
}

/**
 * Reset backend monitoring state (useful for testing)
 */
export function resetBackendMonitor() {
  lastBackendState = {
    timestamp: Date.now(),
    isAuthenticated: false
  }
}