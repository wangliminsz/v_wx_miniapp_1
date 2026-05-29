<template>
  <div>
    <!-- Mobile menu placeholder -->
    <div v-if="appStore.showMenu" class="fixed inset-0 z-20 bg-white">
      <div class="p-4">
        <button @click="appStore.setShowMenu(false)" class="float-right">
          <CloseIcon />
        </button>
        <h2 class="text-xl font-bold mb-4">Menu</h2>
        <!-- Mobile menu content would go here -->
      </div>
    </div>
  </div>
</template>

<script>
import { useAppStore } from '../stores/app'
import CloseIcon from './icons/CloseIcon.vue'

export default {
  name: 'Menu',
  components: {
    CloseIcon
  },
  setup() {
    const appStore = useAppStore()

    return {
      appStore
    }
  }
}
</script>