<template>
  <div class="min-h-screen bg-background">
    <!-- Clean Hero Section -->
    <!-- bg-muted/30 -->
    <!-- min-h-[50vh] py-20 -->
    <!-- <section class="bg-slate-950 py-16 md:py-20"> -->
    <section class="relative overflow-hidden min-h-[30vh] sm:min-h-[50vh] py-16 sm:py-20">

      <!-- {{ heroBackgroundImages }} -->
      <!-- {{ currentBackgroundIndex }} -->


      <!-- 桌面版本 图片 -->
      <div class="absolute inset-0 z-0 hidden sm:block">
        <div v-for="(image, index) in desktopHeroBackgroundImages" :key="index"
          class="absolute inset-0 transition-opacity duration-1000 ease-in-out" :class="{
            'opacity-100': desktopCurrentBackgroundIndex === index,
            'opacity-0': desktopCurrentBackgroundIndex !== index
          }">
          <img :src="image" :alt="`Hero background ${index + 1}`" class="w-full h-full object-cover" />

          <!-- <div class="absolute inset-0 bg-cover bg-center" :style="{ backgroundImage: `url(${image})` }"></div> -->


          <!-- Dark overlay -->
          <div class="absolute inset-0 bg-black bg-opacity-50"></div>
        </div>
      </div>

      <!-- 手机版本 图片 -->
      <div class="absolute inset-0 z-0 sm:hidden">
        <div v-for="(image, index) in laptopHeroBackgroundImages" :key="index"
          class="absolute inset-0 transition-opacity duration-1000 ease-in-out" :class="{
            'opacity-100': laptopCurrentBackgroundIndex === index,
            'opacity-0': laptopCurrentBackgroundIndex !== index
          }">
          <img :src="image" :alt="`Hero background ${index + 1}`" class="w-full h-full object-cover" />

          <!-- <div class="absolute inset-0 bg-cover bg-center" :style="{ backgroundImage: `url(${image})` }"></div> -->


          <!-- Dark overlay -->
          <div class="absolute inset-0 bg-black bg-opacity-50"></div>
        </div>
      </div>

      <!-- <div class="container mx-auto px-4 inset-0 z-1"> -->


      <div class="max-w-7xl mx-auto px-6 text-center relative z-10">
        <div class="max-w-4xl mx-auto text-center space-y-8">
          <h1 class="text-3xl md:text-4xl font-heading font-normal text-gray-200 tracking-tight">
            <!-- <div class="mb-2">{{ t('home.heroTitle') }}</div> -->
            <div class="mb-2" style="letter-spacing: 0.8px;">{{ homepageHeroTitle }}</div>

          </h1>
          <!-- <h1 class="text-4xl md:text-5xl font-heading font-normal text-gray-200 tracking-tight">
            {{ t('home.heroTitle') }}
          </h1> -->

          <p class="text-gray-300 text-xl text-muted-foreground max-w-2xl mx-auto" style="letter-spacing: 2px;">
            <!-- {{ t('home.heroSubtitle') }} -->
            {{ homepageHeroSubTitle }}
          </p>
          <!-- <div class="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <button class="min-h-[44px] px-8 py-3 bg-primary text-primary-foreground hover:bg-primary/90 font-body font-medium rounded-lg transition-colors">
              Shop Now
            </button>
            <button class="min-h-[44px] px-8 py-3 border border-border bg-card hover:bg-accent font-body font-medium rounded-lg transition-colors">
              View Collections
            </button>
          </div> -->
        </div>
      </div>

    </section>
    <!-- </section> -->

    <!-- {{ heroBackgroundImages }} -->
    <!-- {{ currentBackgroundIndex }} -->


    <!-- Collections Section -->
    <section class="pt-10 pb-12 bg-muted/30">
      <div class="container mx-auto px-4">
        <!-- <div class="text-center mb-12">
          <h2 class="text-2xl font-heading mb-4">{{ t('home.shopByCategory') }}</h2>
          <p class="text-muted-foreground font-body max-w-2xl mx-auto">
            {{ t('home.browseCollections') }}
          </p>
        </div> -->

        <!-- Loading Spinner -->
        <div v-if="collectionsLoading" class="flex justify-center items-center py-20">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>

        <!-- Collections Grid -->
        <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <CollectionCard v-for="collection in collections" :key="collection.id" :collection="collection" />
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-6">
      <div class="container mx-auto px-4">
        <div class="grid md:grid-cols-3 gap-8 text-center">
          <div class="space-y-3">
            <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 class="text-xl font-heading font-semibold">{{ t('home.features.highQuality') }}</h3>
            <p class="text-muted-foreground font-body">{{ t('home.features.highQualityDesc') }}</p>
          </div>
          <div class="space-y-3">
            <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z">
                </path>
              </svg>
            </div>
            <h3 class="text-xl font-heading font-semibold">{{ t('home.features.fastDelivery') }}</h3>
            <p class="text-muted-foreground font-body">{{ t('home.features.fastDeliveryDesc') }}</p>
          </div>
          <div class="space-y-3">
            <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z">
                </path>
              </svg>
            </div>
            <h3 class="text-xl font-heading font-semibold">{{ t('home.features.customerLove') }}</h3>
            <p class="text-muted-foreground font-body">{{ t('home.features.customerLoveDesc') }}</p>
          </div>
        </div>
      </div>
    </section>

    <button @click="openHeaderCustomerService"
      class="lg:hidden fixed bottom-32 right-4 z-40 w-8 h-8 bg-transparent border border-gray-500 text-gray-600 rounded-full shadow-sm hover:border-gray-600 hover:text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all duration-200 flex items-center justify-center touch-manipulation opacity-80 hover:opacity-100">
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    </button>

    <!-- Mobile Scroll to Top Button -->
    <button v-if="showScrollToTop" @click="scrollToTop"
      class="lg:hidden fixed bottom-20 right-4 z-40 w-8 h-8 bg-transparent border border-gray-500 text-gray-600 rounded-full shadow-sm hover:border-gray-600 hover:text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all duration-200 flex items-center justify-center touch-manipulation opacity-80 hover:opacity-100">
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </button>


  </div>
</template>

<script>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '../stores/app'
import { getCollections } from '../providers/shop/collections/collections'
import CollectionCard from '../components/CollectionCard.vue'

export default {
  name: 'Home',
  components: {
    CollectionCard
  },
  setup() {
    const { t } = useI18n()
    const appStore = useAppStore()

    const collections = computed(() => {
      return appStore.collections
        .filter(collection => collection.featuredAsset)
        .sort((a, b) => a.id - b.id)
    })

    const collectionsLoading = computed(() => appStore.collectionsLoading)

    const showScrollToTop = ref(false) // Mobile scroll to top button visibility
    const showCustomerService = ref(false) // Customer service QR code modal visibility
    const qrCodeError = ref(false) // QR code loading error state

    // Customer service QR code from environment
    const customerServiceQRCode = computed(() => {
      const envValue = import.meta.env.VITE_CUSTOMER_SERVICE_QRCODE
      // console.log('🔍 Environment VITE_CUSTOMER_SERVICE_QRCODE value:', envValue)
      // console.log('🔍 Environment VITE_CUSTOMER_SERVICE_QRCODE type:', typeof envValue)
      // console.log('🔍 All env vars starting with VITE:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')))

      const qrCodeUrl = envValue || ''
      // console.log('🔍 Final QR code URL:', qrCodeUrl)

      return qrCodeUrl
    })

    // Open customer service modal from Header
    const openHeaderCustomerService = () => {
      // console.log("openHeaderCustomerService ---------->")
      appStore.openCustomerServiceModal()
      qrCodeError.value = false // Reset error state when opening modal
    }

    // Scroll to top functionality
    const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // Toggle customer service modal
    const toggleCustomerService = () => {
      showCustomerService.value = !showCustomerService.value
      if (showCustomerService.value) {
        qrCodeError.value = false // Reset error state when opening modal
      }
    }

    // Handle image loading success
    const handleImageLoad = (event) => {
      console.log('✅ Customer service QR code loaded successfully:', event.target.src)
      console.log('✅ Image element src attribute:', event.target.getAttribute('src'))
    }

    // Handle image loading error
    const handleImageError = (event) => {
      console.error('❌ Customer service QR code failed to load')
      console.error('Failed URL:', event.target.src)
      console.error('Expected URL from env:', customerServiceQRCode.value)
      console.error('Error details:', event)
      qrCodeError.value = true
    }

    // Handle scroll events for mobile scroll-to-top button
    const handleScroll = () => {
      showScrollToTop.value = window.scrollY > 300 // Show after scrolling 300px
    }

    // Add scroll listener for mobile scroll-to-top button
    onMounted(() => {
      startBackgroundSlideshow();
      window.addEventListener('scroll', handleScroll)
    })

    // Clean up scroll listener
    onUnmounted(() => {
      window.removeEventListener('scroll', handleScroll)
    })

    // Watch QR code URL changes
    watch(customerServiceQRCode, (newUrl, oldUrl) => {
      console.log('🔄 QR code URL changed:', { old: oldUrl, new: newUrl })
    })

    const homepageHeroTitle = computed(() => {
      return import.meta.env.VITE_HOMEPAGE_HERO_TITLE || '暹罗印度大药房'
    })

    const homepageHeroSubTitle = computed(() => {
      return import.meta.env.VITE_HOMEPAGE_HERO_SUBTITLE || '全球进口药品'
    })

    const homepageSwipeImage = computed(() => {
      return import.meta.env.VITE_HOMEPAGE_SWITE_IMAGE
    })

    const laptopHeroBackgroundImages = computed(() => {
      return import.meta.env.VITE_HOMEPAGE_LAPTOP_IMAGE.split(",").map(s => s.trim())
    })

    const desktopHeroBackgroundImages = computed(() => {
      return import.meta.env.VITE_HOMEPAGE_DESKTOP_IMAGE.split(",").map(s => s.trim())
    })

    const laptopCurrentBackgroundIndex = ref(0);
    const desktopCurrentBackgroundIndex = ref(0);

    // Hero background images slideshow
    // const heroBackgroundImages = ref([
    //   "https://bkkschool-1304214433.cos.ap-guangzhou.myqcloud.com/1761471765660-618-15.jpg",
    //   "https://bkkschool-1304214433.cos.ap-guangzhou.myqcloud.com/1761471828632-72-1.jpg"
    // ]);

    // Background slideshow interval
    // let backgroundInterval;
    let backgroundInterval_laptop;
    let backgroundInterval_desktop;


    const startBackgroundSlideshow = () => {
      backgroundInterval_laptop = setInterval(() => {
        laptopCurrentBackgroundIndex.value = (laptopCurrentBackgroundIndex.value + 1) % laptopHeroBackgroundImages.value.length;
      }, 6000);

      backgroundInterval_desktop = setInterval(() => {
        desktopCurrentBackgroundIndex.value = (desktopCurrentBackgroundIndex.value + 1) % desktopHeroBackgroundImages.value.length;
      }, 6000);

    };




    return {
      t,
      collections,
      collectionsLoading,
      showScrollToTop,
      showCustomerService,
      qrCodeError,
      customerServiceQRCode,
      scrollToTop,
      toggleCustomerService,
      handleImageLoad,
      handleImageError,
      homepageHeroTitle,
      homepageHeroSubTitle,
      homepageSwipeImage,
      desktopHeroBackgroundImages,
      laptopHeroBackgroundImages,
      desktopCurrentBackgroundIndex,
      laptopCurrentBackgroundIndex,
      startBackgroundSlideshow,

      openHeaderCustomerService
    }
  }
}
</script>