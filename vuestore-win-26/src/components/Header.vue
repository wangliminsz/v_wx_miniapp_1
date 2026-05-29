<template>
  <header class="sticky top-0 z-50 border-b bg-[#F8FAFC]">
    <div class="container mx-auto px-4">
      <div class="flex items-center h-16">
        <!-- Mobile Menu Button -->
        <button
          class="md:hidden p-2 hover:bg-muted rounded-md transition-colors mr-4"
          @click="toggleMobileMenu"
          aria-label="Toggle menu"
        >
          <MenuIcon class="w-5 h-5" />
        </button>

        <!-- Logo -->
        <router-link v-if="appStore.appReady" to="/" class="hidden md:block font-heading font-bold text-xl mr-6">
          <img src="/med160-logo-trans.png" alt="Vendure logo" class="h-10 w-auto" />
        </router-link>
        <div v-else class="hidden md:block w-40 mr-6">
          <div class="animate-pulse bg-gray-200 rounded h-10 w-32"></div>
        </div>

        <!-- Desktop Navigation - Left Aligned -->
        <nav v-if="appStore.appReady" class="hidden md:flex items-center gap-6 flex-1">
          <router-link
            v-for="collection in collections"
            :key="collection.id"
            :to="`/collections/${collection.slug}`"
            class="text-sm font-body hover:text-primary transition-colors"
          >
            {{ collection.name }}
          </router-link>
          <!-- Blog Link -->
          <router-link
            to="/blog"
            class="text-sm font-body hover:text-primary transition-colors"
          >
            {{ $t('common.blog') }}
          </router-link>

          <!-- About Website Link -->
          <router-link
            to="/about/company"
            class="text-sm font-body hover:text-primary transition-colors"
          >
            关于网站
          </router-link>
        </nav>
        <div v-else class="hidden md:flex items-center gap-6 flex-1">
          <div v-for="i in 6" :key="i" class="animate-pulse bg-gray-200 rounded h-4 w-20"></div>
        </div>

        <!-- Right Side Actions -->
        <div class="flex items-center gap-4 ml-auto">
          <!-- Language Switcher - Hidden on small screens -->
          <!-- <div class="hidden md:block">
            <LanguageSwitcher />
          </div> -->

          <!-- Search - Hidden on small screens -->
          <div v-if="appStore.appReady" class="hidden lg:block">
            <SearchBar />
          </div>
          <div v-else class="hidden lg:block w-24">
            <div class="animate-pulse bg-gray-200 rounded h-8 w-24"></div>
          </div>

          <!-- Cart -->
          <button
            v-if="appStore.appReady"
            class="relative p-2 hover:bg-muted rounded-md transition-colors"
            @click="appStore.toggleCart()"
            :aria-label="`${appStore.totalQuantity} items in cart`"
          >
            <SfIconShoppingCart class="w-5 h-5" />
            <span
              v-if="appStore.totalQuantity > 0"
              class="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
            >
              {{ appStore.totalQuantity }}
            </span>
          </button>
          <div v-else class="relative p-2">
            <div class="animate-pulse bg-gray-200 rounded h-5 w-5"></div>
          </div>

          <!-- Unsettled Orders (if logged in) -->
          <!-- <button
            v-if="appStore.isLoggedIn && unsettledOrderCount > 0"
            class="relative p-2 hover:bg-muted rounded-md transition-colors"
            @click="$router.push('/orders/unsettled')"
            aria-label="Unsettled orders"
          >
            <SfIconViewList class="w-5 h-5" />
            <span class="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {{ unsettledOrderCount }}
            </span>
          </button> -->

          <!-- User Menu -->
          <div class="relative user-menu">
            <button
              class="p-2 hover:bg-muted rounded-md transition-colors"
              @click="toggleUserMenu"
              :aria-label="appStore.isLoggedIn ? 'User menu' : 'Sign in'"
            >
              <!-- <UserIcon :class="[
                'w-5 h-5 font-bold',
                appStore.isLoggedIn ? 'text-green-600' : 'text-gray-600'
              ]" /> -->
              <UserIcon :class="[
                'w-6 h-6 font-bold',
                appStore.isLoggedIn
                  ? 'text-gray-800 dark:text-white'
                  : 'text-gray-400 dark:text-gray-400'
              ]" />
            </button>

            <!-- User Dropdown Menu -->
            <div
              v-if="showUserMenu"
              class="absolute right-0 mt-2 w-48 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg shadow-lg py-1 z-50"
            >
              <div v-if="appStore.isLoggedIn" class="px-4 py-2 border-b border-border">
              <p class="text-sm font-body">Hi, {{ displayName }}</p>
            </div>

            <router-link
              to="/"
              class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              @click="closeUserMenu"
            >
              {{ $t('common.home') }}
            </router-link>

             <router-link
               :to="appStore.isLoggedIn ? '/account' : '/sign-in'"
               class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
               @click="closeUserMenu"
             >
               {{ appStore.isLoggedIn ? $t('common.account') : $t('common.signIn') }}
             </router-link>

             <button
               @click="openCustomerService"
               class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
             >
               {{ $t('common.customerService') }}
             </button>

             <button
               v-if="appStore.isLoggedIn"
               @click="handleLogout"
               class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
             >
               {{ $t('common.logout') }}
             </button>
            </div>
          </div>
        </div>

        <!-- Customer Service Modal -->
        <div v-if="appStore.showCustomerServiceModal" class="fixed inset-0 z-60" @click="appStore.toggleCustomerServiceModal()">
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black bg-opacity-50"></div>

          <!-- Modal Content -->
          <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 max-w-md w-80">
            <div class="text-center">
              <!-- <h3 class="text-sm font-medium text-gray-900 mb-2">{{ $t('common.customerService') }}</h3> -->
              <div class="">
                <!-- Customer Service QR Code -->
                <div class="text-center">
                  <div class="rounded p-3">
                    <img :src="customerServiceQRCode"
                         alt="Customer Service QR Code"
                         class="w-36 h-36 mx-auto object-contain"
                         @error="handleQRCodeError" />
                  </div>
                  <p class="text-xs text-gray-600 mt-1">{{ $t('header.scanToContact') }}</p>
                  <p class="text-xs text-gray-600 mt-1">{{ weixinAccountNumber }}</p>
                </div>

              </div>

              <button @click.stop="appStore.toggleCustomerServiceModal()"
                      class="mt-8 px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors">
                {{ $t('common.close') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile Menu Overlay -->
      <div
        v-if="showMobileMenu"
        class="mobile-menu md:hidden fixed inset-0 top-16 bg-[#F8FAFC] border-t border-border z-40"
      >
        <nav class="container mx-auto px-4 py-4 space-y-4">
          <!-- Mobile Search -->
          <div class="pb-4">
            <SearchBar :closeMenu="closeMobileMenu" />
          </div>

          <!-- Mobile Navigation Links -->
          <router-link
            to="/"
            class="block py-2 text-sm font-body hover:text-primary transition-colors"
            @click="closeMobileMenu"
          >
            {{ $t('common.home') }}
          </router-link>

          <!-- Collections Section (Collapsible) -->
          <div class="md:hidden">
            <button
              @click="toggleCollections"
              class="flex items-center justify-between w-full py-2 text-sm font-body hover:text-primary transition-colors"
            >
              <span>{{ $t('header.collections') }}</span>
              <svg
                :class="['w-4 h-4 transition-transform duration-200', showCollections ? 'rotate-180' : '']"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Collections List -->
            <div
              :class="[
                'overflow-hidden transition-all duration-300 ease-in-out',
                showCollections ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              ]"
            >
              <div class="pl-4 space-y-1 border-l border-gray-200 ml-2 mt-2">
                <template v-if="!appStore.appReady">
                  <div v-for="i in 6" :key="i" class="animate-pulse bg-gray-200 rounded h-6 w-24 mb-2"></div>
                </template>
                <template v-else>
                  <router-link
                    v-for="collection in collections"
                    :key="collection.id"
                    :to="`/collections/${collection.slug}`"
                    class="block py-2 text-sm font-body text-gray-600 hover:text-primary transition-colors"
                    @click="closeMobileMenu"
                  >
                    {{ collection.name }}
                  </router-link>
                </template>
              </div>
            </div>
          </div>

          <!-- Mobile Blog Link -->
          <router-link
            to="/blog"
            class="block py-2 text-sm font-body hover:text-primary transition-colors"
            @click="closeMobileMenu"
          >
            {{ $t('common.blog') }}
          </router-link>

          <!-- Mobile About Us Link -->
          <router-link
            to="/about/company"
            class="block py-2 text-sm font-body hover:text-primary transition-colors"
            @click="closeMobileMenu"
          >
            关于网站
          </router-link>

          <!-- Mobile User Links -->
          <div class="border-t border-border pt-4 mt-4 space-y-2">
            <router-link
              :to="appStore.isLoggedIn ? '/account' : '/sign-in'"
              class="block py-2 text-sm font-body hover:text-primary transition-colors"
              @click="closeMobileMenu"
            >
              {{ appStore.isLoggedIn ? $t('common.account') : $t('common.signIn') }}
            </router-link>

            <!-- Mobile Language Switcher -->
            <!-- <div class="py-2">
              <LanguageSwitcher />
            </div> -->

            <button
              v-if="appStore.isLoggedIn"
              @click="handleLogout"
              class="block w-full text-left py-2 text-sm font-body hover:text-primary transition-colors"
            >
              {{ $t('common.logout') }}
            </button>
          </div>
        </nav>
      </div>
    </div>
  </header>
</template>



<script>
import { computed, ref, onMounted, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../stores/app'
import { logoutMutation } from '../providers/shop/account/account'
import SearchBar from './SearchBar.vue'
import UserIcon from './icons/UserIcon.vue'
import MenuIcon from './icons/MenuIcon.vue'
import LanguageSwitcher from './LanguageSwitcher.vue'
import { getUnsettledOrdersQuery } from '../providers/shop/orders/order'

export default {
  name: 'Header',
  components: {
    SearchBar,
    UserIcon,
    MenuIcon,
    LanguageSwitcher
  },
  setup() {
    // const { t } = useI18n()
    const appStore = useAppStore()
    const router = useRouter()
    const route = useRoute()

    // Menu states
    const showMobileMenu = ref(false)
    const showUserMenu = ref(false)
    const showCollections = ref(false)

    // Collections
    const collections = computed(() => {
      return appStore.collections.filter(
        item => item.parent?.name === '__root_collection__' && !!item.featuredAsset
      )
    })

    // User display name
    const displayName = computed(() => {
      const customer = appStore.customer
      if (customer.firstName && customer.lastName) {
        return `${customer.firstName}`
      }
      if (customer.firstName) {
        return customer.firstName
      }
      return customer.emailAddress || 'User'
    })

    // Unsettled orders count
    const unsettledOrders = ref([])
    const unsettledOrderCount = computed(() => unsettledOrders.value.length)

    // Fetch unsettled orders
    const fetchUnsettledOrders = async () => {
      if (!appStore.isLoggedIn) {
        unsettledOrders.value = []
        return
      }

      try {
        const result = await getUnsettledOrdersQuery()
        if (result && result.items) {
          const filtered = result.items.filter(order =>
            order.state?.toLowerCase() === 'arrangingpayment' ||
            order.active
          )
          unsettledOrders.value = filtered.sort((a, b) => parseInt(b.id) - parseInt(a.id))
        } else {
          unsettledOrders.value = []
        }
      } catch (error) {
        console.error('Error fetching unsettled orders:', error)
        unsettledOrders.value = []
      }
    }

    // Menu handlers
    const toggleMobileMenu = () => {
      showMobileMenu.value = !showMobileMenu.value
      if (showUserMenu.value) showUserMenu.value = false
    }

    const toggleUserMenu = () => {
      showUserMenu.value = !showUserMenu.value
      if (showMobileMenu.value) showMobileMenu.value = false
    }

    const closeMobileMenu = () => {
      showMobileMenu.value = false
      showCollections.value = false // Reset collections when closing mobile menu
    }

    const closeUserMenu = () => {
      showUserMenu.value = false
    }

    const openCustomerService = () => {
      // console.log('Opening customer service modal')
      appStore.openCustomerServiceModal()
      closeUserMenu()
    }

    // Customer service QR code from environment
    const customerServiceQRCode = computed(() => {
      return import.meta.env.VITE_CUSTOMER_SERVICE_QRCODE || ''
    })

    const weixinAccountNumber = computed(() => {
      return import.meta.env.VITE_CUSTOMER_SERVICE_WEIXIN || ''
    })

    // Handle QR code error
    const handleQRCodeError = (event) => {
      console.warn('Customer service QR code failed to load in header modal')
    }

    const toggleCollections = () => {
      showCollections.value = !showCollections.value
    }

    // Click outside handler
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-menu') && !event.target.closest('[aria-label="User menu"]') && !event.target.closest('[aria-label="Sign in"]')) {
        showUserMenu.value = false
      }
      if (!event.target.closest('.mobile-menu') && !event.target.closest('[aria-label="Toggle menu"]')) {
        showMobileMenu.value = false
      }
    }

    // Logout handler
    const handleLogout = async () => {
      try {
        await logoutMutation()
        appStore.resetCustomer()
        unsettledOrders.value = []
        showUserMenu.value = false
        router.push('/')
      } catch (error) {
        console.error('Logout error:', error)
        appStore.resetCustomer()
        unsettledOrders.value = []
        router.push('/')
      }
    }

    // Watchers
    watch(() => appStore.isLoggedIn, (isLoggedIn) => {
      if (isLoggedIn) {
        fetchUnsettledOrders()
      } else {
        unsettledOrders.value = []
      }
    })

    watch(() => appStore.activeOrder, () => {
      if (appStore.isLoggedIn) {
        fetchUnsettledOrders()
      }
    }, { deep: true })

    // Lifecycle
    onMounted(() => {
      document.addEventListener('click', handleClickOutside)
      if (appStore.isLoggedIn) {
        fetchUnsettledOrders()
      }
    })

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
    })

    return {
      // t,
      appStore,
      collections,
      displayName,
      unsettledOrderCount,
      showMobileMenu,
      showUserMenu,
      showCollections,
      toggleMobileMenu,
      toggleUserMenu,
      closeMobileMenu,
      closeUserMenu,
      openCustomerService,
      toggleCollections,
      customerServiceQRCode,
      weixinAccountNumber,
      handleQRCodeError,
      handleLogout
    }
  }
}
</script>