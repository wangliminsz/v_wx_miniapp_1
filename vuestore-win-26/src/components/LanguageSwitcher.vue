<template>
  <div class="relative">
    <button
      @click="toggleLanguageMenu"
      class="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
      :aria-label="'Switch language to ' + (currentLanguage === 'en' ? 'Chinese' : 'English')"
    >
      <span>{{ currentLanguage.toUpperCase() }}</span>
      <svg
        :class="['w-4 h-4 transition-transform', showLanguageMenu ? 'rotate-180' : '']"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Language Dropdown -->
    <div
      v-if="showLanguageMenu"
      class="absolute right-0 mt-1 w-32 bg-white border border-gray-300 rounded-md shadow-sm py-1 z-50"
      @click.stop
    >
      <button
        v-for="lang in languages"
        :key="lang.code"
        @click="switchLanguage(lang.code)"
        :class="[
          'block w-full text-left px-4 py-2 text-sm transition-colors',
          currentLanguage === lang.code
            ? 'bg-primary/10 text-primary'
            : 'text-gray-700 hover:bg-gray-100'
        ]"
      >
        {{ lang.name }}
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '../stores/app'

export default {
  name: 'LanguageSwitcher',
  setup() {
    const { locale } = useI18n()
    const appStore = useAppStore()
    const showLanguageMenu = ref(false)

    const languages = [
      { code: 'en', name: 'English' },
      { code: 'zh', name: '中文' }
    ]

    const currentLanguage = computed(() => {
      return appStore.currentLanguage
    })

    const toggleLanguageMenu = () => {
      showLanguageMenu.value = !showLanguageMenu.value
    }

    const switchLanguage = (langCode) => {
      appStore.setLanguage(langCode)
      showLanguageMenu.value = false
    }

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (!event.target.closest('.relative')) {
        showLanguageMenu.value = false
      }
    }

    // Add event listener
    window.addEventListener('click', handleClickOutside)

    // Clean up event listener
    const cleanup = () => {
      window.removeEventListener('click', handleClickOutside)
    }

    // Return cleanup function
    return {
      showLanguageMenu,
      languages,
      currentLanguage,
      toggleLanguageMenu,
      switchLanguage,
      cleanup
    }
  },
  // Clean up event listener when component is unmounted
  unmounted() {
    this.cleanup()
  }
}
</script>
