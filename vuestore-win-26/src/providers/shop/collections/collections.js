import { gql } from 'graphql-tag'
import { graphqlRequest } from '../../../utils/api'

const GET_COLLECTIONS = gql`
  query GetCollections {
    collections {
      items {
        id
        name
        slug
        parent {
          name
        }
        featuredAsset {
          id
          preview
        }
        children {
          id
          name
          slug
          featuredAsset {
            id
            preview
          }
        }
        productVariants {
          totalItems
        }
        productCount
      }
    }
  }
`

const GET_COLLECTION_BY_SLUG = gql`
  query GetCollectionBySlug($slug: String!, $options: ProductVariantListOptions) {
    collection(slug: $slug) {
      id
      name
      slug
      description
      parent {
        id
        name
        slug
        children {
          id
          name
          slug
          featuredAsset {
            id
            preview
          }
        }
      }
      children {
        id
        name
        slug
        featuredAsset {
          id
          preview
        }
      }
      featuredAsset {
        id
        preview
      }
      productVariants(options: $options) {
        items {
          id
          name
          priceWithTax
          currencyCode
          stockLevel
          facetValues {
            id
            name
            facet {
              id
              code
              name
            }
          }
          product {
            id
            name
            slug
            description
            featuredAsset {
              id
              preview
            }
            facetValues {
              facet {
                id
                code
                name
              }
              id
              code
              name
            }
          }
        }
        totalItems
      }
      productCount
    }
  }
`


const GET_COLLECTION_PRODUCT_SUMMARY = gql`
  query GetCollectionProductSummary($collectionId: ID!, $skip: Int, $take: Int) {
    collectionProductSummary(collectionId: $collectionId, skip: $skip, take: $take) {
      productId
      productName
      slug
      description
      featuredAsset {
        id
        preview
      }
      variantCount
      minPriceWithTax
      maxPriceWithTax
      facetValues {
        id
        name
        code
      }
    }
  }
`

export async function getCollections() {
  try {
    const data = await graphqlRequest(GET_COLLECTIONS)
    // console.log('2025-12-31--------> Collections', data.collections)
    return data.collections.items
  } catch (error) {
    console.error('Error fetching collections:', error)
    return []
  }
}

export async function getCollectionBySlug(slug, page = 1, pageSize = parseInt(import.meta.env.VITE_PRODUCTS_NUMBER_IN_A_PAGE) || 12, facetValueIds = []) {
  try {
    const filterMode = import.meta.env.VITE_FILTER_MODE || 'server'

    // // console.log(`🔧 Filter Mode: ${filterMode}`)

    // Note: Collections always use client-side filtering due to Vendure API limitations
    // Even when VITE_FILTER_MODE=server, collections will use client-side filtering
    // // console.log('🔧 Collections always use CLIENT-SIDE filtering (Vendure limitation)')

    const collectionVariables = {
      slug,
      options: {
        skip: (page - 1) * pageSize,
        take: pageSize
      }
    }
    // // console.log('GraphQL variables being sent for collection:', JSON.stringify(collectionVariables, null, 2))

    const collectionData = await graphqlRequest(GET_COLLECTION_BY_SLUG, collectionVariables)
    // // console.log('Raw GraphQL response for collection:', collectionData)

    const collection = collectionData.collection
    // // console.log('Collection API response:', collection)
    // // console.log('Collection ID from API:', collection?.id)
    // // console.log('Collection name from API:', collection?.name)
    // // console.log('Collection children data:', collection?.children)
    // // console.log('Collection children length:', collection?.children?.length)
    // // console.log('Product variants count:', collection?.productVariants?.items?.length)
    // // console.log('Product variants totalItems:', collection?.productVariants?.totalItems)
    // // console.log('First product variant:', collection?.productVariants?.items?.[0])

    // Return null if collection doesn't exist
    if (!collection) {
      // // console.log('Collection not found')
      return null
    }

    // Note: Facets are now loaded from collectionProductSummary API for product-level filtering
    // No need for separate variant-level facets API call
    collection.availableFacets = []

    return collection
  } catch (error) {
    console.error('Error fetching collection by slug:', error)
    throw error
  }
}

export async function getCollectionProductSummary(collectionId, page = 1, pageSize = parseInt(import.meta.env.VITE_PRODUCTS_NUMBER_IN_A_PAGE) || 12) {
  try {
    const variables = {
      collectionId,
      skip: (page - 1) * pageSize,
      take: pageSize
    }

    // // console.log('🔧 Using collectionProductSummary plugin with variables:', JSON.stringify(variables, null, 2))

    const data = await graphqlRequest(GET_COLLECTION_PRODUCT_SUMMARY, variables)
    // // console.log('🔧 collectionProductSummary API response:', data)

    return data.collectionProductSummary || []
  } catch (error) {
    console.error('Error fetching collection product summary:', error)
    return []
  }
}

// Query for available product facets in a collection
const GET_AVAILABLE_PRODUCT_FACETS = gql`
  query GetAvailableProductFacets($collectionId: ID!) {
    availableProductFacets(collectionId: $collectionId) {
      id
      name
      code
      values {
        id
        name
        code
      }
    }
  }
`

export async function getAvailableProductFacets(collectionId) {
  try {
    const variables = { collectionId }

    // // console.log('🔧 Fetching available product facets for collection:', collectionId)

    const data = await graphqlRequest(GET_AVAILABLE_PRODUCT_FACETS, variables)
    // // console.log('🔧 Available product facets API response:', data)

    return data.availableProductFacets || []
  } catch (error) {
    console.error('Error fetching available product facets:', error)
    return []
  }
}

// Query for products filtered by facets in a collection
const GET_PRODUCTS_BY_FACETS = gql`
  query GetProductsByFacets($collectionId: ID!, $facetValueIds: [ID!]!, $skip: Int, $take: Int) {
    productsByFacets(collectionId: $collectionId, facetValueIds: $facetValueIds, skip: $skip, take: $take) {
      totalCount
      items {
        id
        name
        slug
        description
        featuredAsset {
          id
          preview
        }
        facetValues {
          id
          name
          code
          facet {
            id
            code
            name
          }
        }
        variants {
          id
          name
          priceWithTax
          currencyCode
          stockLevel
          facetValues {
            id
            name
            code
            facet {
              id
              code
              name
            }
          }
        }
      }
    }
  }
`

export async function getProductsByFacets(collectionId, facetValueIds = [], skip = 0, take = 12) {
  try {
    const variables = {
      collectionId,
      facetValueIds,
      skip,
      take
    }

    // // console.log('🔧 [getProductsByFacets] Fetching products by facets for collection:', collectionId, 'with facets:', facetValueIds, 'skip:', skip, 'take:', take)
    // // console.log('🔧 [getProductsByFacets] GraphQL variables:', JSON.stringify(variables, null, 2))

    const data = await graphqlRequest(GET_PRODUCTS_BY_FACETS, variables)
    // // console.log('🔧 [getProductsByFacets] Raw API response:', data)

    const productsData = data.productsByFacets || {}
    const products = productsData.items || []
    const totalCount = productsData.totalCount || 0

    // // console.log('🔧 [getProductsByFacets] Processed products:', products)
    // // console.log('🔧 [getProductsByFacets] Products count:', products.length)
    // // console.log('🔧 [getProductsByFacets] Total count:', totalCount)

    return {
      items: products,
      totalCount: totalCount
    }
  } catch (error) {
    console.error('Error fetching products by facets:', error)
    // console.error('🔧 [getProductsByFacets] Error details:', error.message)
    return { items: [], totalCount: 0 }
  }
}

// Get active channel currency
const GET_ACTIVE_CHANNEL = gql`
  query GetActiveChannel {
    activeChannel {
      id
      code
      currencyCode
    }
  }
`

export async function getActiveChannelQuery() {
  try {
    const data = await graphqlRequest(GET_ACTIVE_CHANNEL)
    return data.activeChannel
  } catch (error) {
    console.error('Error fetching active channel:', error)
    return null
  }
}
