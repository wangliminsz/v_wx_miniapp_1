import { createRouter, createWebHistory } from 'vue-router'
import { getUnsettledOrdersQuery } from '../providers/shop/orders/order'
import { useAppStore } from '../stores/app'

const routes = [
  { path: '/', component: () => import('../pages/Home.vue') },
  { path: '/collections/:slug', component: () => import('../pages/Collection.vue') },

  { path: '/products/:slug', component: () => import('../pages/Product.vue') },
  {
    path: '/product/:productSlug/variant/:variantId',
    name: 'variant',
    component: () => import('../pages/Variant.vue'),
    props: true
  },
   { path: '/search', component: () => import('../pages/Search.vue') },
   { path: '/blog', component: () => import('../pages/Blog.vue') },
    { path: '/blog/:slug', component: () => import('../pages/BlogDetail.vue') },
  { path: '/checkout/shipping', component: () => import('../pages/CheckoutShipping.vue') },
  { path: '/checkout/payment', component: () => import('../pages/CheckoutPayment.vue') },
  { path: '/checkout/confirmation', component: () => import('../pages/CheckoutConfirm.vue') },


  {
    path: '/checkout/confirmation/:orderCode',
    name: 'CheckoutConfirmation',
    component: () => import('../pages/CheckoutConfirm.vue'),
    props: route => ({
      orderCode: route.params.orderCode,
      npId: route.query.NP_id
    })
  },
  // {
  //   path: '/checkout/cancel/:orderCode',
  //   name: 'CheckoutCancel',
  //   component: () => import('../pages/CheckoutCancel.vue'),
  //   props: true
  // }


  {
    path: '/order-confirmation/:code',
    name: 'OrderConfirmation',
    component: () => import('../pages/OrderConfirmation.vue'),
    props: true
  },
  {
    path: '/account',
    component: () => import('../pages/Account.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/account/orders/:code',
    name: 'OrderDetail',
    component: () => import('../pages/OrderDetail.vue'),
    meta: { requiresAuth: true },
    props: true
  },
  { path: '/sign-in', component: () => import('../pages/SignIn.vue') },
  { path: '/sign-up', component: () => import('../pages/SignUp.vue') },
  { path: '/verify', component: () => import('../pages/Verify.vue') },
  { path: '/forgot-password', component: () => import('../pages/ForgotPassword.vue') },
  { path: '/password-reset', component: () => import('../pages/ResetPassword.vue') },
  { path: '/test-auth', component: () => import('../pages/TestAuth.vue') },
  {
    path: '/orders/unsettled',
    component: () => import('../pages/Orders.vue'),
    meta: { requiresAuth: true }
  },
  // Footer info pages
  { path: '/about/:subcategory', component: () => import('../pages/InfoPage.vue') },
  { path: '/guide/:subcategory', component: () => import('../pages/InfoPage.vue') },
  { path: '/service/:subcategory', component: () => import('../pages/InfoPage.vue') },
  { path: '/shipping/:subcategory', component: () => import('../pages/InfoPage.vue') },
  { path: '/policy/:subcategory', component: () => import('../pages/InfoPage.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // Always scroll to top when navigating to a new page
    return { top: 0 }
  }
})

// Route guard for authentication and payment page access
router.beforeEach(async (to, from, next) => {
  const appStore = useAppStore()

  // Special handling for /checkout/shipping route
  if (to.path === '/checkout/shipping') {
    // Check if coming from cart or checkout pages (allowed flows)
    const fromPath = from.path || ''
    const isFromCart = fromPath === '/' || fromPath.includes('/collections') || fromPath.includes('/products')
    const isFromCheckout = fromPath.includes('/checkout')

    // Check if we have an active order in store
    let hasActiveOrder = appStore.activeOrder?.id && appStore.activeOrder?.lines?.length > 0

    // If no active order in store, try to fetch it
    if (!hasActiveOrder) {
      try {
        const { getActiveOrderQuery } = await import('../providers/shop/orders/order')
        const order = await getActiveOrderQuery()
        if (order?.lines?.length > 0) {
          appStore.setActiveOrder(order)
          hasActiveOrder = true
        }
      } catch (error) {
        console.error('Router Guard: Error fetching order:', error)
      }
    }

    if (isFromCart || isFromCheckout || hasActiveOrder) {
      // console.log(`🔍 Router Guard: isFromCart=${isFromCart}, isFromCheckout=${isFromCheckout}, hasActiveOrder=${hasActiveOrder}, allowing access`)
      next()
      return
    }

    // No valid order and not from allowed pages - redirect to homepage
    // console.log('🔍 Router Guard: No valid order, redirecting to /')
    next('/')
    return
  }

  // Special handling for /checkout/payment route
  if (to.path === '/checkout/payment') {
    // Check if coming from checkout/shipping or orders/unsettled (allowed flows)
    const isFromShipping = from.path && from.path.includes('/checkout/shipping')
    const isFromUnsettled = from.path && from.path.includes('/orders/unsettled')

    // Check if we have an active order in store
    let hasActiveOrder = appStore.activeOrder?.id && appStore.activeOrder?.lines?.length > 0

    // If no active order in store, try to fetch it
    if (!hasActiveOrder) {
      //console.log('🔍 Router Guard: No active order in store, fetching...')
      try {
        const { getActiveOrderQuery } = await import('../providers/shop/orders/order')
        const order = await getActiveOrderQuery()
        if (order?.lines?.length > 0) {
          appStore.setActiveOrder(order)
          hasActiveOrder = true
          //console.log('🔍 Router Guard: Fetched order with', order.lines.length, 'lines')
        }
      } catch (error) {
        console.error('🔍 Router Guard: Error fetching order:', error)
      }
    }

    if (isFromShipping || isFromUnsettled || hasActiveOrder) {
      // Coming from allowed internal flow or has active order - allow access
      //console.log(`🔍 Router Guard: isFromShipping=${isFromShipping}, isFromUnsettled=${isFromUnsettled}, hasActiveOrder=${hasActiveOrder}, allowing access`)
      next()
      return
    }

    // External access - always check unsettled orders first
    const { hasToken } = await import('../utils/auth')
    if (hasToken()) {
      const tokenEffective = await appStore.verifyTokenEffectiveness()
      if (!tokenEffective) {
        //console.log('🔍 Router Guard: Token not effective, redirecting to /')
        next('/')
        return
      }
    } else {
      //console.log('🔍 Router Guard: No token found, redirecting to /')
      next('/')
      return
    }

    // External access: Always check for unsettled orders (PaymentAuthorized orders are considered paid)
    try {
      //console.log('🔍 Router Guard: External access - fetching unsettled orders...')
      const result = await getUnsettledOrdersQuery()
      //console.log('🔍 Router Guard: Result from getUnsettledOrdersQuery:', result)

      // Check for ANY unsettled orders (PaymentAuthorized orders are considered paid)
      const hasUnsettledOrders = result?.items?.some(order =>
        order.state === 'ArrangingPayment'
      )

      if (hasUnsettledOrders) {
        //console.log('🔍 Router Guard: Unsettled orders exist, redirecting to /orders/unsettled')
        next('/orders/unsettled')
        return
      } else {
        //console.log('🔍 Router Guard: No unsettled orders, redirecting to /')
        next('/')
        return
      }
    } catch (error) {
      console.error('🔍 Router Guard: Error checking unsettled orders:', error)
      next('/')
      return
    }
  }

  // Check if the route requires authentication
  if (to.meta.requiresAuth && !appStore.isLoggedIn) {
    // If we have a token, verify it before redirecting
    const { hasToken } = await import('../utils/auth')
    if (hasToken()) {
      const tokenEffective = await appStore.verifyTokenEffectiveness()
      if (tokenEffective) {
        next()
        return
      }
    }

    // Redirect to sign-in page if not authenticated
    next('/sign-in')
  } else {
    // Continue to the requested route
    next()
  }
})

export default router