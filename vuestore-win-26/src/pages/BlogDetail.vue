<template>
  <div class="min-h-screen bg-white">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>

    <!-- Content -->
    <div v-else-if="content" class="max-w-3xl mx-auto px-4 py-10">
      <!-- Type Badge -->
      <div class="mb-4">
        <span :class="[
          'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
          content.type === 'post' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
        ]">
          {{ content.type === 'post' ? '📝 Blog Post' : '🛒 Product Story' }}
        </span>
      </div>

      <!-- Title -->
      <!-- <h1 class="text-3xl md:text-4xl font-bold mb-6 text-center text-gray-900">
        {{ content.title }}
      </h1> -->

      <div class="w-full max-w-5xl mx-auto px-2"> <!-- single source of truth for width & centering -->

        <h1
          class="text-xl sm:text-2xl md:text-2.5xl font-medium tracking-tight text-gray-900 leading-tight mb-3 break-words hyphens-auto overflow-hidden  text-ellipsis line-clamp-4"
          :title="content.title">
          {{ content.title }}
        </h1>

      </div>

      <!-- Meta Information -->
      <div class="flex items-center justify-center text-sm text-gray-500 mb-6">
        <div class="flex items-center space-x-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{{ formatDate(content.publishDate) }}</span>
        </div>
        <div v-if="content.readTime" class="flex items-center space-x-2 ml-4">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <!-- <span>{{ content.readTime }} min read</span> -->
        </div>
      </div>

      <!-- Product layout: Content first, then image -->
      <template v-if="content.type === 'product'">
        <!-- Content Body -->
        <div v-if="content.content"
          class="prose prose-neutral prose-sm sm:prose-base prose-headings:font-semibold prose-headings:text-gray-900 prose-p:mb-4 prose-p:leading-7 prose-p:text-gray-700 prose-ul:mb-4 prose-li:marker:text-blue-500 [&>h2]:mt-10 [&>h2]:mb-4 [&>h2]:text-2xl max-w-none"
          v-html="renderedContent"></div>

        <!-- Hero Image (after content for products) -->
        <div v-if="content.image" class="mb-10">
          <img :src="content.image" :alt="content.title" class="w-full h-auto rounded-2xl shadow-xl object-cover" />
        </div>
      </template>

      <!-- Post layout: Content first, then image -->
      <template v-else>
        <!-- Content Body -->
        <div class="px-2">
          <div v-if="content.content"
            class="prose prose-neutral prose-sm sm:prose-base prose-headings:font-semibold prose-headings:text-gray-900 prose-p:mb-4 prose-p:leading-7 prose-p:text-gray-700 prose-ul:mb-4 prose-li:marker:text-blue-500 [&>h2]:mt-10 [&>h2]:mb-4 [&>h2]:text-2xl max-w-none"
            v-html="renderedContent"></div>
        </div>

        <!-- Hero Image (after content for posts) -->
        <div v-if="content.image" class="mt-10 mb-10">
          <img :src="content.image" :alt="content.title" class="w-full h-auto rounded-2xl shadow-xl object-cover" />
        </div>
      </template>

      <!-- Story Images Gallery (Product Only) -->
      <div v-if="content.type === 'product' && content.storyImages && content.storyImages.length > 0" class="mt-12">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Gallery</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <template v-for="(item, index) in content.storyImages" :key="item?.image?.id || index">
            <div v-if="item?.image" class="group">
              <img :src="item.image.url" :alt="item.caption || 'Product image'"
                class="w-full h-auto rounded-xl shadow-lg transition-transform group-hover:scale-[1.02]" />
              <p v-if="item.caption" class="mt-3 text-center text-sm text-gray-600">
                {{ item.caption }}
              </p>
            </div>
          </template>
        </div>
      </div>

      <!-- Back Buttons -->
      <div class="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
        <!-- <router-link to="/blog"
          class="inline-flex items-center justify-center px-6 py-3 w-56 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Blog
        </router-link> -->
        <!-- <router-link v-if="content.type === 'product'" :to="productUrl"
          class="inline-flex items-center justify-center px-6 py-3 w-56 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:text-primary-600 transition-colors">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Back to Product
        </router-link> -->
      </div>
    </div>

    <!-- Error State -->
    <!-- <div v-else class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-.98-5.5-2.5m.5 5.5a7.963 7.963 0 006 0" />
        </svg>
        <h3 class="mt-4 text-lg font-medium text-gray-900">Content not found</h3>
        <p class="mt-2 text-gray-500">The content you're looking for doesn't exist or has been removed.</p>
        <router-link
          to="/blog"
          class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
        >
          Back to Blog
        </router-link>
      </div>
    </div> -->
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import RichTextRenderer from '../components/RichTextRenderer.vue'
import { parseMarkdown, extractMarkdownFromRichText } from '../utils/markdown'

export default {
  name: 'BlogDetail',
  components: {
    RichTextRenderer,
  },
  setup() {
    const route = useRoute()
    const isLoading = ref(true)
    const content = ref(null)
    const error = ref('')

    // const formatDate = (dateString) => {
    //   const date = new Date(dateString)
    //   return date.toLocaleDateString('en-US', {
    //     year: 'numeric',
    //     month: 'long',
    //     day: 'numeric'
    //   })
    // }

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      // return date.toLocaleDateString('en-US', {
      //   year: 'numeric',
      //   month: 'long',
      //   day: 'numeric'
      // })

      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')

      return `${year}-${month}-${day}`

    }

    const fetchContent = async () => {
      try {
        const slug = route.params.slug
        let data = null
        let type = null

        // First try to fetch as a product
        const productResponse = await fetch(`${import.meta.env.VITE_PAYLOAD_CMS_URL}/api/vendure-product?where[slug][equals]=${encodeURIComponent(slug)}&depth=2&draft=false&limit=1`)
        if (productResponse.ok) {
          const result = await productResponse.json()
          data = result.docs && result.docs.length > 0 ? result.docs[0] : null
          if (data) {
            type = 'product'
          }
        }

        // If not found as product in Payload CMS, try as post
        if (!data) {
          const postResponse = await fetch(`${import.meta.env.VITE_PAYLOAD_CMS_URL}/api/posts?where[slug][equals]=${encodeURIComponent(slug)}&limit=1&depth=2&draft=false`)
          if (postResponse.ok) {
            const result = await postResponse.json()
            data = result.docs && result.docs.length > 0 ? result.docs[0] : null
            if (data) {
              type = 'post'
            }
          }
        }

        // If still not found, try to fetch from Vendure as a fallback
        if (!data) {
          console.log('🔄 Product not found in Payload CMS, trying Vendure fallback for:', slug)
          try {
            // Import the Vendure product fetcher
            const { getProductBySlug } = await import('../providers/shop/products/products.js')
            const vendureProduct = await getProductBySlug(slug)
            if (vendureProduct) {
              console.log('✅ Found product in Vendure:', vendureProduct.name)
              data = {
                id: vendureProduct.id,
                name: vendureProduct.name,
                slug: vendureProduct.slug,
                description: vendureProduct.description,
                richDescription: null, // Vendure doesn't have rich description
                heroImage: vendureProduct.featuredAsset,
                images: vendureProduct.assets,
                createdAt: vendureProduct.createdAt,
                updatedAt: vendureProduct.updatedAt
              }
              type = 'product'
            }
          } catch (error) {
            console.error('❌ Error fetching from Vendure fallback:', error)
          }
        }

        // Set content based on type
        if (data && type === 'product') {
          content.value = {
            id: data.id,
            title: data.name,
            excerpt: data.description || 'Discover this amazing product',
            description: data.description,
            content: data.richDescription,
            image: data.heroImage ? data.heroImage.url : (data.images && data.images.length > 0 ? data.images[0].url : null),
            publishDate: data.createdAt || data.updatedAt,
            readTime: 3,
            price: data.price ? `$${data.price}` : null,
            type: 'product',
            storyImages: data.storyImages || []
          }
        } else if (data && type === 'post') {
          content.value = {
            id: data.id,
            title: data.title,
            excerpt: data.excerpt,
            content: data.content,
            image: data.featuredImage ? data.featuredImage.url : null,
            publishDate: data.createdAt,
            readTime: data.readTime || 5,
            type: 'post'
          }
        } else {
          error.value = 'Content not found'
        }
      } catch (err) {
        console.error('Error fetching content:', err)
        error.value = 'Failed to load content'
      } finally {
        isLoading.value = false
      }
    }

    onMounted(() => {
      fetchContent()
    })

    const renderedContent = computed(() => {
      if (!content.value || !content.value.content) return ''

      const contentData = content.value.content

      if (typeof contentData === 'string') {
        return parseMarkdown(contentData)
      }

      if (contentData && contentData.root) {
        const markdown = extractMarkdownFromRichText(contentData)
        return parseMarkdown(markdown)
      }

      return ''
    })

    const productUrl = computed(() => {
      return `/products/${route.params.slug}`
    })

    return {
      isLoading,
      content,
      error,
      formatDate,
      renderedContent,
      productUrl
    }
  }
}
</script>