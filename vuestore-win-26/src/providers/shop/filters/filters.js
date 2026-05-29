import { gql } from 'graphql-tag'
import { graphqlRequest } from '../../../utils/api'

const GET_ALL_FILTERS = gql`
  query GetAllFilters {
    allOptionGroups {
      id
      code
      name
      options {
        id
        code
        name
      }
    }
    allFacets {
      id
      code
      name
      values {
        id
        code
        name
      }
    }
  }
`

export async function getAllFilters() {
  try {
    const data = await graphqlRequest(GET_ALL_FILTERS)

  return {
    optionGroups: data.allOptionGroups || [],
    facets: data.allFacets || []
  }
} catch (error) {
  console.error('Error fetching centralized filter data:', error)
  return {
    optionGroups: [],
    facets: []
  }
}
}