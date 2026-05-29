import { getAuthHeader, storeToken } from './auth.js'


export async function graphqlRequest(query, variables = {}) {
  // const apiUrl = '/api' // 本地 must be proxied to Vendure admin-api

  // 🔥 这一行是关键！自动用环境变量，本地/dev 走代理，服务器走真实地址
  const apiUrl = import.meta.env.VITE_API_URL //服务器

  const queryString = query.loc ? query.loc.source.body : query

  const headers = { 'Content-Type': 'application/json' }
  const authHeader = getAuthHeader()
  if (authHeader) headers['Authorization'] = authHeader

  // Add channel token for multi-channel support
  const channelToken = import.meta.env.VITE_CHANNEL_TOKEN
  if (channelToken) headers['vendure-token'] = channelToken

  // console.log('🔧------------> GraphQL Request - URL:', apiUrl)
  // console.log('🔧------------> GraphQL Request - Query:', queryString.substring(0, 100) + '...')
  // console.log('🔧------------> GraphQL Request - Query:', queryString)
  // console.log('🔧------------> GraphQL Request - Variables:', variables)

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: queryString, variables }),
  })

  // Check for JWT token in response headers (Vendure hybrid mode)
  const vendureTokenHeader = response.headers.get('vendure-auth-token')
  if (vendureTokenHeader) {
    // console.log('🔐 Vendure token found in response headers, storing...')
    storeToken(vendureTokenHeader)
  }

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`HTTP error! status: ${response.status} - ${text}`)
  }

  const result = await response.json()
  // console.log('🔧 GraphQL Response - Full result:', result)

  if (result.errors) {
    console.error('🔧 GraphQL errors:', result.errors)
    // Throw the actual GraphQL errors so they can be handled properly
    throw new Error(`GraphQL Error: ${JSON.stringify(result.errors)}`)
  }

  // Always return the whole result so caller can inspect both data and errors
  return result.data ?? {}
}