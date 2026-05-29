<template>
  <div>
    <Header v-if="!hideHeaderFooter" />
    <Cart />
    <Menu />
    <main class="pb-2" :class="hideHeaderFooter ? 'bg-white' : 'bg-gray-50'">
      <slot />
    </main>
    <Footer v-if="!hideHeaderFooter" />
  </div>
</template>

<script>
import { useAppStore } from '../stores/app'
import Header from './Header.vue'
import Cart from './Cart.vue'
import Menu from './Menu.vue'
import Footer from './Footer.vue'

export default {
  name: 'Layout',
  components: {
    Header,
    Cart,
    Menu,
    Footer
  },
  props: {
    hideHeaderFooter: {
      type: Boolean,
      default: false
    }
  },
  setup() {
    const appStore = useAppStore()

    return {
      appStore
    }
  }
}
</script>