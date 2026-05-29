import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { hasToken, removeToken, getToken } from '../utils/auth'
import { graphqlRequest } from '../utils/api'
import { getAllFilters } from '../providers/shop/filters/filters'
import { getCustomerAddressesQuery } from '../providers/shop/customer/customer'
import { detectBackendRestart, handleAuthError } from '../utils/backendMonitor'
import { useI18n } from 'vue-i18n'

export const useAppStore = defineStore('app', () => {
  // State
  const collections = ref([])
  const collectionsLoading = ref(false)
  const appReady = ref(false)
  const activeOrder = ref({})
   const showCart = ref(false)
   const showMenu = ref(false)
   const showCustomerServiceModal = ref(false)
  const customer = ref({
    id: 'CUSTOMER_NOT_DEFINED_ID',
    firstName: '',
    lastName: '',
    emailAddress: ''
  })
  const shippingAddress = ref({
    id: '',
    city: '',
    company: '',
    countryCode: '',
    fullName: '',
    phoneNumber: '',
    postalCode: '',
    province: '',
    streetLine1: '',
    streetLine2: ''
  })
  const availableCountries = ref([])
   const addressBook = ref([])
   const tokenEffective = ref(false)
   // Centralized filter data
   const allOptionGroups = ref([])
   const allFacets = ref([])
   const thbRates = ref({})
   const usdRates = ref({})
   // Language state
   const currentLanguage = ref(localStorage.getItem('language') || 'en')

  // Computed
  const totalQuantity = computed(() => {
    return activeOrder.value?.state !== 'PaymentAuthorized'
      ? activeOrder.value?.totalQuantity || 0
      : 0
  })

  const isLoggedIn = computed(() => {
    // Check if user is logged in via customer ID OR effective JWT token
    const hasCustomer = customer.value.id !== 'CUSTOMER_NOT_DEFINED_ID'
    const hasEffectiveJWT = hasToken() && tokenEffective.value
    // // console.log('Auth state - hasCustomer:', hasCustomer, 'hasEffectiveJWT:', hasEffectiveJWT)
    return hasCustomer || hasEffectiveJWT
  })

  // More accurate logged in status that considers token effectiveness
  const isActuallyLoggedIn = computed(() => {
    // User is actually logged in if:
    // 1. They have a valid customer ID (cookie-based auth) OR
    // 2. They have an effective JWT token
    const hasValidCustomer = customer.value.id !== 'CUSTOMER_NOT_DEFINED_ID'
    return hasValidCustomer
  })

  // Slug to ID mapping for collections
  const collectionsSlugToId = computed(() => {
    const mapping = {}
    collections.value.forEach(collection => {
      if (collection.slug && collection.id) {
        mapping[collection.slug] = collection.id
      }
    })
    return mapping
  })

  // Actions
  function setCollections(newCollections) {
    collections.value = newCollections
  }

  function setCollectionsLoading(loading) {
    collectionsLoading.value = loading
  }

  function setAllFilters(filterData) {
    allOptionGroups.value = filterData.optionGroups || []
    allFacets.value = filterData.facets || []
  }

  async function loadAllFilters() {
    try {
      const filterData = await getAllFilters()
      setAllFilters(filterData)
      return filterData
    } catch (error) {
      console.error('Error loading centralized filter data:', error)
      return { optionGroups: [], facets: [] }
    }
  }

  function setActiveOrder(order) {
    activeOrder.value = order
  }

  function setCustomer(customerData) {
    customer.value = { ...customer.value, ...customerData }
  }

  function setShowCart(value) {
    showCart.value = value
  }

  function setShowMenu(value) {
    showMenu.value = value
  }

  function setAvailableCountries(countries) {
    availableCountries.value = countries
    if (countries.length > 0 && !shippingAddress.value.countryCode) {
      shippingAddress.value.countryCode = countries[0].code
    }
  }

  function toggleCart() {
    showCart.value = !showCart.value
  }

   function toggleMenu() {
     showMenu.value = !showMenu.value
   }

   function toggleCustomerServiceModal() {
     showCustomerServiceModal.value = !showCustomerServiceModal.value
   }

   function openCustomerServiceModal() {
     showCustomerServiceModal.value = true
   }

  function resetCustomer() {
    customer.value = {
      id: 'CUSTOMER_NOT_DEFINED_ID',
      firstName: '',
      lastName: '',
      emailAddress: ''
    }
    // Also remove JWT token when resetting customer
    removeToken()
    tokenEffective.value = false
    // Note: We do NOT reset activeOrder here to preserve cart on logout
    // The cart will be preserved for guest users
  }

  // Verify if the current JWT token is actually effective
  async function verifyTokenEffectiveness() {
    try {
      if (!hasToken()) {
        tokenEffective.value = false
        detectBackendRestart(false)
        return false
      }

      // Make a simple API call that requires authentication
      const query = `
        query {
          activeCustomer {
            id
            firstName
            lastName
            emailAddress
            title
            phoneNumber
          }
        }
      `

      const result = await graphqlRequest(query)

      // If we get a valid response with customer data, the token is effective
      if (result.activeCustomer && result.activeCustomer.id) {
        tokenEffective.value = true
        // Always update customer data with the latest from the API
        setCustomer({
          id: result.activeCustomer.id,
          firstName: result.activeCustomer.firstName || '',
          lastName: result.activeCustomer.lastName || '',
          emailAddress: result.activeCustomer.emailAddress || '',
          title: result.activeCustomer.title || '',
          phoneNumber: result.activeCustomer.phoneNumber || ''
        })
        detectBackendRestart(true)
        return true
      } else {
        // Token is no longer valid - clear all authentication data
        tokenEffective.value = false
        detectBackendRestart(false)
        resetCustomer()
        return false
      }
    } catch (error) {
      // Use backend monitoring to handle authentication errors
      if (handleAuthError(error)) {
        tokenEffective.value = false
        resetCustomer()
      }
      detectBackendRestart(false)
      return false
    }
  }

  // Load exchange rates
  async function loadExchangeRates() {
    try {
      // Load THB rates
      const thbResponse = await fetch('https://api.exchangerate-api.com/v4/latest/THB')
      if (thbResponse.ok) {
        const thbData = await thbResponse.json()
        thbRates.value = thbData.rates
      } else {
        console.warn('Failed to load THB exchange rates')
      }

      // Load USD rates
      const usdResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
      if (usdResponse.ok) {
        const usdData = await usdResponse.json()
        usdRates.value = usdData.rates
      } else {
        console.warn('Failed to load USD exchange rates')
      }
    } catch (error) {
      console.error('Error loading exchange rates:', error)
    }
  }

  // Load customer addresses and set default shipping address
  async function loadCustomerAddresses() {
    try {
      const addresses = await getCustomerAddressesQuery()
      addressBook.value = addresses

      // Find and set the default shipping address
      const defaultShippingAddress = addresses.find(addr => addr.defaultShippingAddress)

      if (defaultShippingAddress) {
        setShippingAddress({
          id: defaultShippingAddress.id,
          fullName: defaultShippingAddress.fullName || '',
          company: defaultShippingAddress.company || '',
          streetLine1: defaultShippingAddress.streetLine1 || '',
          streetLine2: defaultShippingAddress.streetLine2 || '',
          city: defaultShippingAddress.city || '',
          province: defaultShippingAddress.province || '',
          postalCode: defaultShippingAddress.postalCode || '',
          countryCode: defaultShippingAddress.country?.code || '',
          phoneNumber: defaultShippingAddress.phoneNumber || ''
        })
      }

      return addresses
    } catch (error) {
      console.error('Error loading customer addresses:', error)
      addressBook.value = []
      return []
    }
  }

  // Set shipping address
  function setShippingAddress(addressData) {
    shippingAddress.value = { ...shippingAddress.value, ...addressData }
  }

  // Language-related actions
  function setLanguage(lang) {
    currentLanguage.value = lang
    localStorage.setItem('language', lang)
    // Update i18n locale
    const { locale } = useI18n()
    locale.value = lang
  }

  function getLanguage() {
    return currentLanguage.value
  }

  return {
    // State
    collections,
    collectionsLoading,
    appReady,
    activeOrder,
     showCart,
     showMenu,
     showCustomerServiceModal,
    customer,
    shippingAddress,
    availableCountries,
    addressBook,
    tokenEffective,
    allOptionGroups,
    allFacets,
    currentLanguage,

    // Computed
    totalQuantity,
    isLoggedIn,
    collectionsSlugToId,
    thbRates,
    usdRates,

    // Actions
    setCollections,
    setCollectionsLoading,
    setAllFilters,
    loadAllFilters,
    setActiveOrder,
    setCustomer,
    setShowCart,
    setShowMenu,
    setAvailableCountries,
     toggleCart,
     toggleMenu,
     toggleCustomerServiceModal,
     openCustomerServiceModal,
    resetCustomer,
    verifyTokenEffectiveness,
    loadCustomerAddresses,
    loadExchangeRates,
    setShippingAddress,
    setLanguage,
    getLanguage
  }
})