import { gql } from 'graphql-tag'
import { graphqlRequest } from '../../../utils/api'

const GET_PRODUCT_BY_SLUG = gql`
  query GetProductBySlug($slug: String!) {
    product(slug: $slug) {
      id
      name
      slug
      description
      collections {
        id
        slug
        name
        breadcrumbs {
          id
          name
          slug
        }
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
      featuredAsset {
        id
        preview
      }
      assets {
        id
        preview
      }
      optionGroups {
        id
        code
        name
        options {
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
        sku
        stockLevel
        featuredAsset {
          id
          preview
        }
        assets {
          id
          preview
        }
        options {
          id
          name
          code
          group {
            id
            code
            name
          }
        }
        facetValues {
          id
          name
          facet {
            id
            code
            name
          }
        }
      }
    }
  }
`

export async function getProductBySlug(slug) {
  try {
    const variables = { slug }
    const data = await graphqlRequest(GET_PRODUCT_BY_SLUG, variables)
    return data.product
  } catch (error) {
    console.error('Error fetching product by slug:', error)
    throw error
  }
}

// Query to get product by ID
const GET_PRODUCT_BY_ID = gql`
  query GetProductById($id: ID!) {
    product(id: $id) {
      id
      name
      slug
      description
      collections {
        id
        slug
        name
        breadcrumbs {
          id
          name
          slug
        }
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
      featuredAsset {
        id
        preview
      }
      assets {
        id
        preview
      }
      optionGroups {
        id
        code
        name
        options {
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
        sku
        stockLevel
        featuredAsset {
          id
          preview
        }
        assets {
          id
          preview
        }
        options {
          id
          name
          code
        }
      }
    }
  }
`

export async function getProductById(id) {
  try {
    const variables = { id }
    const data = await graphqlRequest(GET_PRODUCT_BY_ID, variables)
    return data.product
  } catch (error) {
    console.error('Error fetching product by id:', error)
    throw error
  }
}

// Query to get variant by ID
const GET_VARIANT_BY_ID = gql`
  query GetVariantById($id: ID!) {
    productVariant(id: $id) {
      id
      name
      sku
      priceWithTax
      currencyCode
      stockLevel
      featuredAsset {
        id
        preview
      }
      assets {
        id
        preview
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
      }
    }
  }
`

// Query to get product variants
const GET_PRODUCT_VARIANTS = gql`
  query GetProductVariants($id: ID!) {
    product(id: $id) {
      id
      name
      slug
      variants {
        id
        name
        sku
        priceWithTax
        currencyCode
        stockLevel
        featuredAsset {
          id
          preview
        }
        assets {
          id
          preview
        }
        options {
          id
          name
          code
          group {
            id
            code
            name
          }
        }
        facetValues {
          id
          name
          facet {
            id
            code
            name
          }
        }
      }
    }
  }
`

export async function getProductVariants(productId) {
  try {
    const variables = { id: productId }
    const data = await graphqlRequest(GET_PRODUCT_VARIANTS, variables)
    return data.product?.variants || []
  } catch (error) {
    console.error('Error fetching product variants:', error)
    return []
  }
}

export async function getVariantById(id) {
  try {
    const variables = { id }
    const data = await graphqlRequest(GET_VARIANT_BY_ID, variables)
    return data.productVariant
  } catch (error) {
    console.error('Error fetching variant by id:', error)
    throw error
  }
}