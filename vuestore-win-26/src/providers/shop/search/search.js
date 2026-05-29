import { gql } from 'graphql-tag'
import { graphqlRequest } from '../../../utils/api'

// Basic search query - returns product-level data
export const SEARCH_PRODUCTS = gql`
  query SearchProducts($input: SearchInput!) {
    search(input: $input) {
      items {
        productId
        productName
        slug
        description
        productAsset {
          preview
        }
        price {
          ... on PriceRange {
            min
            max
          }
          ... on SinglePrice {
            value
          }
        }
      }
      totalItems
    }
  }
`

// Get all facets and facet values
export const GET_ALL_FACETS = gql`
  query GetAllFacets {
    facets {
      items {
        id
        name
        values {
          id
          name
        }
      }
    }
  }
`

// Search with facets for advanced filtering - returns product-level data
export const SEARCH_PRODUCTS_WITH_FACETS = gql`
  query SearchProductsWithFacets($input: SearchInput!) {
    search(input: $input) {
      items {
        productId
        productName
        slug
        description
        productAsset {
          preview
        }
        price {
          ... on PriceRange {
            min
            max
          }
          ... on SinglePrice {
            value
          }
        }
        facetValueIds
      }
      totalItems
      facetValues {
        facetValue {
          id
          name
          facet {
            id
            name
          }
        }
        count
      }
    }
  }
`

// Enhanced search query that supports facetValueFilters for proper AND logic
export const SEARCH_PRODUCTS_WITH_FILTERS = gql`
  query SearchProductsWithFilters(
    $term: String!
    $facetValueFilters: [FacetValueFilterInput!]
    $skip: Int!
    $take: Int!
  ) {
    search(
      input: {
        term: $term
        skip: $skip
        take: $take
        facetValueFilters: $facetValueFilters
      }
    ) {
      items {
        productId
        productName
        slug
        description
        productAsset {
          preview
        }
        price {
          ... on PriceRange {
            min
            max
          }
          ... on SinglePrice {
            value
          }
        }
        facetValueIds
      }
      totalItems
      facetValues {
        facetValue {
          id
          name
          facet {
            id
            name
          }
        }
        count
      }
    }
  }
`

// SearchWithOptions plugin query - supports combined facet and option filtering
export const SEARCH_WITH_OPTIONS = gql`
  query SearchWithOptions(
    $term: String
    $facetValueIds: [ID!]
    $optionIds: [ID!]
    $skip: Int!
    $take: Int!
  ) {
    searchWithOptions(
      input: {
        term: $term
        facetValueIds: $facetValueIds
        optionIds: $optionIds
        skip: $skip
        take: $take
      }
    ) {
      items {
        productId
        productName
        productVariantName
        facetValueIds
        variantOptions {
          id
          name
        }
      }
      totalItems
      totalProducts
    }
  }
`

// Query to search for products and filter by variant options
export const SEARCH_PRODUCTS_WITH_OPTION_FILTERS = gql`
  query SearchProductsWithOptionFilters($term: String!, $optionIds: [ID!]) {
    search(input: { term: $term, take: 50, skip: 0 }) {
      items {
        productId
        productName
        slug
        description
        productAsset {
          preview
        }
        price {
          ... on PriceRange {
            min
            max
          }
          ... on SinglePrice {
            value
          }
        }
        facetValueIds
      }
      totalItems
      facetValues {
        facetValue {
          id
          name
          facet {
            id
            name
          }
        }
        count
      }
    }
  }
`

// Paginated search for infinite scroll - returns product-level data
export const SEARCH_PRODUCTS_PAGINATED = gql`
  query SearchProductsPaginated($input: SearchInput!) {
    search(input: $input) {
      items {
        productId
        productName
        slug
        description
        productAsset {
          preview
        }
        price {
          ... on PriceRange {
            min
            max
          }
          ... on SinglePrice {
            value
          }
        }
      }
      totalItems
    }
  }
`

export async function searchProducts(term) {
  try {
    const variables = {
      input: {
        term,
        take: 12,
        skip: 0
      }
    }

    // console.log('🔍 BASIC SEARCH GRAPHQL QUERY:')
    // console.log('QUERY:', SEARCH_PRODUCTS.loc?.source.body)
    // console.log('VARIABLES:', JSON.stringify(variables, null, 2))

    const data = await graphqlRequest(SEARCH_PRODUCTS, variables)
    // console.log('Basic search API response:', data)
    // Handle different response structures
    if (data.search) {
      return data.search
    } else if (data) {
      // If data is the search result directly
      return data
    } else {
      return { items: [], totalItems: 0 }
    }
  } catch (error) {
    console.error('Error searching products:', error)
    return { items: [], totalItems: 0 }
  }
}

export async function getAllFacets() {
  try {
    // console.log('🔍 GET ALL FACETS GRAPHQL QUERY:')
    // console.log('QUERY:', GET_ALL_FACETS.loc?.source.body)
    // console.log('VARIABLES: {}')

    const data = await graphqlRequest(GET_ALL_FACETS)
    // console.log('Facets API response:', data)
    // Handle different response structures
    if (data.facets && data.facets.items) {
      return data.facets.items
    } else if (data) {
      // If data is the facets result directly
      return data
    } else {
      return []
    }
  } catch (error) {
    console.error('Error getting facets:', error)
    return []
  }
}

export async function searchProductsWithFacets(term, filters = {}) {
  try {
    const filterMode = import.meta.env.VITE_FILTER_MODE || 'server'

    // console.log(`🔧 Search Filter Mode: ${filterMode}`)

    // Server-side filtering: use Vendure's search API with facet filters
    if (filterMode === 'server') {
      // For server-side filtering, use the SearchWithOptions plugin which supports facet filtering
      // console.log('🔧 Using SearchWithOptions plugin for server-side filtering')

      const searchResult = await searchWithOptionsPlugin(term, filters, 1, 12)

      // Convert the SearchWithOptions response to match the expected format
      return {
        items: searchResult.items.map(item => ({
          productId: item.productId,
          productName: item.productName || item.productVariantName,
          slug: item.slug,
          description: '', // SearchWithOptions doesn't return description
          productAsset: { preview: '' }, // SearchWithOptions doesn't return assets
          price: { value: 0 }, // SearchWithOptions doesn't return price
          facetValueIds: item.facetValueIds || []
        })),
        totalItems: searchResult.totalItems || searchResult.totalProducts || 0,
        facetValues: [] // SearchWithOptions doesn't return facet values
      }
    } else {
      // Client-side filtering: fetch all products and filter locally
      // console.log('🔧 CLIENT-SIDE SEARCH: Fetching all products for local filtering')

      // First, fetch all products without filters
      const allProductsResult = await searchProducts(term)

      // Apply client-side facet filtering
      if (filters.facetValueIds && filters.facetValueIds.length > 0) {
        // console.log('🔧 Applying CLIENT-SIDE facet filtering:', filters.facetValueIds)

        const filteredItems = allProductsResult.items.filter(item => {
          const itemFacetValueIds = item.facetValueIds || []
          // Check if item has ALL selected facet values (AND logic)
          return filters.facetValueIds.every(facetValueId =>
            itemFacetValueIds.includes(facetValueId)
          )
        })

        return {
          ...allProductsResult,
          items: filteredItems,
          totalItems: filteredItems.length
        }
      }

      return allProductsResult
    }
  } catch (error) {
    console.error('Error searching products with facets:', error)
    return { items: [], totalItems: 0, facetValues: [] }
  }
}

// Enhanced search function that uses proper Vendure search API with facetValueFilters
export async function searchProductsWithCombinedFilters(term, filters = {}, page = 1, pageSize = parseInt(import.meta.env.VITE_PRODUCTS_NUMBER_IN_A_PAGE) || 12) {
  try {
    const filterMode = import.meta.env.VITE_FILTER_MODE || 'server'

    // Server-side filtering: use SearchWithOptions plugin
    if (filterMode === 'server') {
      // console.log('🔧 Using SearchWithOptions plugin for combined server-side filtering')
      const searchResult = await searchWithOptionsPlugin(term, filters, page, pageSize)

      // Convert the SearchWithOptions response to match the expected format
      return {
        items: searchResult.items.map(item => ({
          productId: item.productId,
          productName: item.productName || item.productVariantName,
          slug: item.slug,
          description: '',
          productAsset: { preview: '' },
          price: { value: 0 },
          facetValueIds: item.facetValueIds || []
        })),
        totalItems: searchResult.totalItems || searchResult.totalProducts || 0,
        facetValues: []
      }
    }

    // Client-side filtering: use the original implementation
    // console.log('🔧 Using client-side combined filtering')

    // Combine facetValueIds and optionIds into facetValueFilters for proper AND logic
    const facetValueFilters = (filters.facetValueIds || [])
      .concat(filters.optionIds || [])
      .map(id => ({ facetValueId: id }))

    const variables = {
      term,
      skip: (page - 1) * pageSize,
      take: pageSize,
      facetValueFilters: facetValueFilters.length > 0 ? facetValueFilters : undefined
    }

    // console.log('🔍 COMBINED SEARCH WITH FILTERS GRAPHQL QUERY:')
    // console.log('QUERY:', SEARCH_PRODUCTS_WITH_FILTERS.loc?.source.body)
    // console.log('VARIABLES:', JSON.stringify(variables, null, 2))

    const data = await graphqlRequest(SEARCH_PRODUCTS_WITH_FILTERS, variables)
    // console.log('🔍 Combined search API response:', data)

    if (data.search) {
      return data.search
    } else if (data) {
      return data
    } else {
      return { items: [], totalItems: 0, facetValues: [] }
    }
  } catch (error) {
    console.error('Error searching products with combined filters:', error)
    return { items: [], totalItems: 0, facetValues: [] }
  }
}

// Enhanced search function that supports option filtering
export async function searchProductsWithOptions(term, filters = {}) {
  try {
    const filterMode = import.meta.env.VITE_FILTER_MODE || 'server'

    // Server-side filtering: use SearchWithOptions plugin which supports both facets and options
    if (filterMode === 'server') {
      // console.log('🔧 Using SearchWithOptions plugin for server-side option filtering')
      const searchResult = await searchWithOptionsPlugin(term, filters, 1, 12)

      // Convert the SearchWithOptions response to match the expected format
      return {
        items: searchResult.items.map(item => ({
          productId: item.productId,
          productName: item.productName || item.productVariantName,
          slug: item.slug,
          description: '',
          productAsset: { preview: '' },
          price: { value: 0 },
          facetValueIds: item.facetValueIds || []
        })),
        totalItems: searchResult.totalItems || searchResult.totalProducts || 0,
        facetValues: []
      }
    }

    // Client-side filtering: use the original implementation
    // console.log('🔍 Starting search with options:', { term, filters })

    // First, perform regular search to get products
    // console.log('🔍 SEARCH WITH OPTIONS - STARTING REGULAR SEARCH')
    const searchResult = await searchProductsWithFacets(term, {
      facetValueIds: filters.facetValueIds || []
    })

    // If no option filters, return the regular search result
    if (!filters.optionIds || filters.optionIds.length === 0) {
      // console.log('🔍 No option filters, returning regular search result')
      return searchResult
    }

    // If option filters are selected, we need to filter by variants
    const selectedOptionIds = filters.optionIds
    // console.log('🔍 Option filtering enabled with selected options:', selectedOptionIds)

    // Fetch variants for all products in search results
    const { getProductVariants } = await import('../products/products.js')

    const variantPromises = searchResult.items.map(async (product) => {
      try {
        const variants = await getProductVariants(product.productId)
        return { product, variants }
      } catch (error) {
        console.error(`Error fetching variants for product ${product.productId}:`, error)
        return { product, variants: [] }
      }
    })

    const productsWithVariants = await Promise.all(variantPromises)
    // console.log('🔄 Products with variants:', productsWithVariants)

    // Filter products to only include those that have variants matching the selected options
    const filteredProducts = productsWithVariants
      .filter(({ variants }) => {
        // Check if any variant has ALL the selected options
        const hasMatchingVariant = variants.some(variant => {
          const variantOptionIds = variant.options?.map(opt => opt.id) || []

          // Simple approach: check if variant has ALL selected options
          // This implements AND logic between all selected options
          const hasAllSelectedOptions = selectedOptionIds.every(selectedId =>
            variantOptionIds.includes(selectedId)
          )

          // console.log(`✅ Variant "${variant.name}" has all selected options: ${hasAllSelectedOptions}`)
          // console.log(`  Variant options: ${variantOptionIds.join(', ')}`)
          // console.log(`  Selected options: ${selectedOptionIds.join(', ')}`)

          return hasAllSelectedOptions
        })

        // console.log(`🎯 Product "${variants[0]?.product?.name || 'Unknown'}" has matching variant: ${hasMatchingVariant}`)
        return hasMatchingVariant
      })
      .map(({ product }) => product)

    // console.log('🎯 Filtered products after option filtering:', filteredProducts.length)

    return {
      ...searchResult,
      items: filteredProducts,
      totalItems: filteredProducts.length
    }

  } catch (error) {
    console.error('Error searching products with options:', error)
    return { items: [], totalItems: 0, facetValues: [] }
  }
}

// New searchProductsWithOptions plugin query - returns product-level data with pagination
export const SEARCH_PRODUCTS_WITH_OPTIONS_PRODUCT_LEVEL = gql`
  query SearchProductsWithOptions(
    $term: String!
    $page: Int
    $pageSize: Int
  ) {
    searchProductsWithOptions(
      term: $term
      page: $page
      pageSize: $pageSize
    ) {
      totalCount
      items {
        productId
        productName
        slug
        description
        productAsset {
          id
          preview
        }
        productFacets {
          id
          name
          code
        }
        variantCount
        minPrice
        maxPrice
        minPriceWithTax
        maxPriceWithTax
        variants {
          variantId
          variantName
          variantFacets {
            id
            name
            code
          }
          options {
            id
            name
          }
          price
          priceWithTax
        }
      }
    }
  }
`

// Search using the SearchWithOptions plugin - supports combined facet and option filtering
export async function searchWithOptionsPlugin(term, filters = {}, page = 1, pageSize = parseInt(import.meta.env.VITE_PRODUCTS_NUMBER_IN_A_PAGE) || 12) {
  try {
    const filterMode = import.meta.env.VITE_FILTER_MODE || 'server'

    // console.log(`🔧 SearchWithOptions Filter Mode: ${filterMode}`)

    // Server-side filtering: use the SearchWithOptions plugin
    if (filterMode === 'server') {
      const variables = {
        term: term || undefined,
        facetValueIds: filters.facetValueIds?.length > 0 ? filters.facetValueIds : undefined,
        optionIds: filters.optionIds?.length > 0 ? filters.optionIds : undefined,
        skip: (page - 1) * pageSize,
        take: pageSize
      }

      // console.log('🔍 SERVER-SIDE SEARCH WITH OPTIONS PLUGIN GRAPHQL QUERY:')
      // console.log('QUERY:', SEARCH_WITH_OPTIONS.loc?.source.body)
      // console.log('VARIABLES:', JSON.stringify(variables, null, 2))

      // Debug: Log the exact GraphQL request being made
      // console.log('🔍 DEBUG: Full GraphQL request details:')
      // console.log('🔍 term:', variables.term)
      // console.log('🔍 facetValueIds:', variables.facetValueIds)
      // console.log('🔍 facetValueIds count:', variables.facetValueIds?.length || 0)
      // console.log('🔍 optionIds:', variables.optionIds)
      // console.log('🔍 skip:', variables.skip)
      // console.log('🔍 take:', variables.take)

      const data = await graphqlRequest(SEARCH_WITH_OPTIONS, variables)
      // console.log('🔍 SearchWithOptions plugin API response:', data)
      // console.log('🔍 Response items count:', data.searchWithOptions?.items?.length)

      if (data.searchWithOptions) {
        return {
          ...data.searchWithOptions,
          // Ensure both fields are present for backward compatibility
          totalItems: data.searchWithOptions.totalItems || 0,
          totalProducts: data.searchWithOptions.totalProducts || 0
        }
      } else if (data) {
        return data
      } else {
        return { items: [], totalItems: 0, totalProducts: 0 }
      }
    } else {
      // Client-side filtering: use regular search and apply filters locally
      // console.log('🔧 CLIENT-SIDE SearchWithOptions: Using regular search with local filtering')

      // Use the regular search with combined filters function
      const searchResult = await searchProductsWithCombinedFilters(term, filters, page, pageSize)

      return {
        ...searchResult,
        totalProducts: searchResult.totalItems || 0
      }
    }
  } catch (error) {
    console.error('Error searching with options plugin:', error)
    return { items: [], totalItems: 0, totalProducts: 0 }
  }
}

// New function to use the searchProductsWithOptions plugin for product-level search with pagination
export async function searchProductsWithOptionsProductLevel(term, page = 1, pageSize = parseInt(import.meta.env.VITE_PRODUCTS_NUMBER_IN_A_PAGE) || 12) {
  try {
    const variables = {
      term: term || '',
      page: page,
      pageSize: pageSize
    }

    // console.log('🔍 SEARCH_PRODUCTS_WITH_OPTIONS_PRODUCT_LEVEL GRAPHQL QUERY:')
    // console.log('QUERY:', SEARCH_PRODUCTS_WITH_OPTIONS_PRODUCT_LEVEL.loc?.source.body)
    // console.log('VARIABLES:', JSON.stringify(variables, null, 2))

    const data = await graphqlRequest(SEARCH_PRODUCTS_WITH_OPTIONS_PRODUCT_LEVEL, variables)
    // console.log('🔍 searchProductsWithOptions plugin API response:', data)

    if (data.searchProductsWithOptions) {
      // Transform the response to match the expected format
      const items = data.searchProductsWithOptions.items.map(product => ({
        productId: product.productId,
        productName: product.productName,
        slug: product.slug || product.productId, // Use actual slug or fallback to product ID
        description: product.description || '',
        productAsset: product.productAsset || { preview: '' },
        price: {
          min: product.minPrice,
          max: product.maxPrice
        },
        priceWithTax: {
          min: product.minPriceWithTax,
          max: product.maxPriceWithTax
        },
        variantCount: product.variantCount,
        variants: product.variants,
        productFacets: product.productFacets || [],
        facetValueIds: product.productFacets?.map(facet => facet.id) || []
      }))

      return {
        items,
        totalItems: data.searchProductsWithOptions.totalCount,
        totalProducts: data.searchProductsWithOptions.totalCount
      }
    } else {
      return { items: [], totalItems: 0, totalProducts: 0 }
    }
  } catch (error) {
    console.error('Error searching with searchProductsWithOptions plugin:', error)
    return { items: [], totalItems: 0, totalProducts: 0 }
  }
}

export async function searchProductsPaginated(term, page = 1, pageSize = parseInt(import.meta.env.VITE_PRODUCTS_NUMBER_IN_A_PAGE) || 12) {
  try {
    const variables = {
      input: {
        term,
        take: pageSize,
        skip: (page - 1) * pageSize
      }
    }

    // console.log('🔍 PAGINATED SEARCH GRAPHQL QUERY:')
    // console.log('QUERY:', SEARCH_PRODUCTS_PAGINATED.loc?.source.body)
    // console.log('VARIABLES:', JSON.stringify(variables, null, 2))

    const data = await graphqlRequest(SEARCH_PRODUCTS_PAGINATED, variables)
    // console.log('Paginated search API response:', data)
    // Handle different response structures
    if (data.search) {
      return data.search
    } else if (data) {
      // If data is the search result directly
      return data
    } else {
      return { items: [], totalItems: 0 }
    }
  } catch (error) {
    console.error('Error searching products:', error)
    return { items: [], totalItems: 0 }
  }
}