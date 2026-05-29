<template>
  <div class="p-6 max-w-md mx-auto">
    <h1 class="text-2xl font-bold mb-4">JWT Authentication Test</h1>

    <div class="space-y-4">
      <div class="p-4 border rounded">
        <h2 class="font-semibold mb-2">Authentication Status</h2>
        <p>Store Status: <span :class="isLoggedIn ? 'text-green-600' : 'text-red-600'">{{ isLoggedIn ? 'Yes' : 'No'
            }}</span> <span class="text-xs text-gray-500">(checks token existence)</span></p>
        <p>Actual Status: <span :class="isActuallyLoggedIn ? 'text-green-600' : 'text-red-600'">{{ isActuallyLoggedIn ?
          'Yes' : 'No' }}</span> <span class="text-xs text-gray-500">(verifies token works)</span></p>
        <p>Has JWT Token: <span :class="hasToken ? 'text-green-600' : 'text-red-600'">{{ hasToken ? 'Yes' : 'No'
            }}</span></p>
        <p>Token Effective: <span :class="tokenEffective ? 'text-green-600' : 'text-red-600'">{{ tokenEffective ? 'Yes'
            : 'No' }}</span></p>
        <p>Customer ID: {{ customerId }}</p>
      </div>

      <div class="p-4 border rounded">
        <h2 class="font-semibold mb-2">JWT Token Info</h2>
        <p>Token in localStorage: {{ tokenInStorage ? 'Yes' : 'No' }}</p>
        <p v-if="tokenInStorage">Token length: {{ tokenLength }} characters</p>
        <p v-if="tokenInStorage">Token value (first 10 chars): {{ tokenPreview }}</p>
        <button @click="clearToken" class="bg-red-500 text-white px-3 py-1 rounded text-sm" :disabled="!tokenInStorage">
          Clear Token
        </button>
      </div>

      <div class="p-4 border rounded">
        <h2 class="font-semibold mb-2">Test Actions</h2>
        <button @click="testTokenEffectiveness" class="bg-purple-500 text-white px-3 py-1 rounded text-sm mr-2">
          Verify Token
        </button>
        <button @click="testApiCall" class="bg-blue-500 text-white px-3 py-1 rounded text-sm mr-2">
          Test API Call
        </button>
        <button @click="testDirectLogin" class="bg-green-500 text-white px-3 py-1 rounded text-sm mr-2">
          Test Direct Login
        </button>
        <button @click="refreshStatus" class="bg-gray-500 text-white px-3 py-1 rounded text-sm">
          Refresh Status
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '../stores/app'
import { getToken, removeToken } from '../utils/auth'
import { graphqlRequest } from '../utils/api'

const appStore = useAppStore()

const tokenInStorage = ref(false)
const tokenLength = ref(0)
const tokenPreview = ref('')
const tokenEffective = ref(false)

const isLoggedIn = computed(() => appStore.isLoggedIn)
const hasToken = computed(() => appStore.isLoggedIn && getToken())
const customerId = computed(() => appStore.customer.id)

// More accurate logged in status that considers token effectiveness
const isActuallyLoggedIn = computed(() => {
  // User is actually logged in if:
  // 1. They have a valid customer ID (cookie-based auth) OR
  // 2. They have an effective JWT token
  const hasValidCustomer = appStore.customer.id !== 'CUSTOMER_NOT_DEFINED_ID'
  return hasValidCustomer || tokenEffective.value
})

const refreshStatus = () => {
  const token = getToken()
  tokenInStorage.value = !!token
  tokenLength.value = token ? token.length : 0
  tokenPreview.value = token ? token.substring(0, 10) + '...' : ''
}

const clearToken = () => {
  removeToken()
  refreshStatus()
}

const testTokenEffectiveness = async () => {
  try {
    // console.log('Testing token effectiveness...')
    tokenEffective.value = false

    // Make a simple API call that requires authentication
    const query = `
      query {
        activeCustomer {
          id
          firstName
        }
      }
    `

    const result = await graphqlRequest(query)

    // If we get a valid response with customer data, the token is effective
    if (result.activeCustomer && result.activeCustomer.id) {
      tokenEffective.value = true
      // console.log('✅ Token is EFFECTIVE - API call successful with customer data')
      // alert('Token is EFFECTIVE! You are properly authenticated.')
    } else {
      // console.log('❌ Token is INEFFECTIVE - No customer data returned')
      // alert('Token is INEFFECTIVE! You are not properly authenticated.')
    }
  } catch (error) {
    tokenEffective.value = false
    console.error('❌ Token is INEFFECTIVE - API call failed:', error)
    // alert('Token is INEFFECTIVE! API call failed. Check console for details.')
  }
}

const testApiCall = async () => {
  try {
    // console.log('Testing API call with current auth state...')
    // Try to fetch active customer to test if JWT token is working
    const query = `
      query {
        activeCustomer {
          id
          firstName
        }
      }
    `
    const result = await graphqlRequest(query)
    // console.log('API call successful:', result)
    // alert('API call successful! Check console for details.')
  } catch (error) {
    console.error('API call failed:', error)
    // alert('API call failed. Check console for error details.')
  }
}

const testDirectLogin = async () => {
  try {
    // console.log('Testing direct login to Vendure server...')

    const loginMutation = `
      mutation Login($email: String!, $password: String!) {
        login(username: $email, password: $password) {
          __typename
          ... on CurrentUser {
            id
            identifier
          }
        }
      }
    `

    const response = await fetch(`${import.meta.env.VITE_GRAPHQL_URL}/shop-api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: loginMutation,
        variables: {
          email: 'test@example.com', // Replace with actual test credentials
          password: 'test'
        }
      })
    })

    // console.log('Direct response headers:', Object.fromEntries(response.headers.entries()))
    const result = await response.json()
    // console.log('Direct response data:', result)

    // alert('Direct login test completed. Check console for headers.')
  } catch (error) {
    console.error('Direct login test failed:', error)
    // alert('Direct login test failed. Check console for error details.')
  }
}

onMounted(async () => {
  refreshStatus()

  // Automatically test token effectiveness if there's a token
  if (tokenInStorage.value) {
    await testTokenEffectiveness()
  }
})
</script>