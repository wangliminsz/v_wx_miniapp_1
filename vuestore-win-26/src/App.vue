<template>
  <div id="app">
    <div v-if="!appReady" class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
    <template v-else>
      <div v-if="isBlogPage" class="blog-page-container">
        <router-view />
      </div>
      <Layout v-else>
        <router-view />
      </Layout>
    </template>
  </div>
</template>

<script>
import Layout from './components/Layout.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from './stores/app'

export default {
  name: 'App',
  components: { Layout },
  setup() {
    const route = useRoute()
    const appStore = useAppStore()
    
    const appReady = computed(() => appStore.appReady)
    const isBlogPage = computed(() => {
      const path = route.path
      return path.startsWith('/blog/') && path !== '/blog'
    })
    
    return { appReady, isBlogPage }
  }
}
</script>

<style>
.blog-page-container {
  min-height: 100vh;
  background: white;
}
</style>