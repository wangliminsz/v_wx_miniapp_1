<template>
  <div class="relative">
    <SfInput
      v-model="query"
      placeholder="Search"
      size="lg"
      class="w-full border-0 focus:ring-0 focus:outline-none"
      @keyup.enter="handleSearch"
    >
      <template #suffix>
        <button
          @click="handleSearch"
          class="p-2 hover:bg-gray-100 rounded-md transition-colors"
          aria-label="Search"
        >
          <SfIconSearch class="w-5 h-5 text-gray-400" />
        </button>
      </template>
    </SfInput>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'SearchBar',
  props: {
    closeMenu: {
      type: Function,
      default: null
    }
  },
  setup(props) {
    const query = ref('')
    const router = useRouter()

    const search = () => {
      if (query.value.trim()) {
        // Navigate to search page with query parameter
        router.push(`/search?q=${encodeURIComponent(query.value)}`)
      }
    }

    const handleSearch = () => {
      search()
      if (props.closeMenu) {
        props.closeMenu()
      }
    }

    return {
      query,
      handleSearch
    }
  }
}
</script>