<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>

    <!-- Blog Content -->
    <div v-else class="max-w-7xl mx-auto px-4 py-8">
      <!-- Breadcrumb -->
      <div class="mb-6 text-sm text-gray-500">
        <router-link to="/" class="hover:text-primary-600 transition-colors">{{ t('common.home') }}</router-link>
        <span class="mx-2">/</span>
        <span class="text-primary-600">{{ t('blog.categories') }}</span>
        <span v-if="activeCategoryFilter !== 'all'" class="mx-2">/</span>
        <span v-if="activeCategoryFilter !== 'all'" class="text-primary-500">{{ getCategoryLabel(activeCategoryFilter)
          }}</span>
        <span v-if="activeSubcategoryFilter !== 'all'" class="mx-2">/</span>
        <span v-if="activeSubcategoryFilter !== 'all'" class="text-primary-400">
          {{
            oncologySubcategories.find(sc => sc.value === activeSubcategoryFilter)?.label ||
            otherDiseaseSubcategories.find(sc => sc.value === activeSubcategoryFilter)?.label ||
            ''
          }}
        </span>
      </div>

      <!-- Desktop Layout -->
      <div class="hidden lg:flex gap-8">
        <!-- Left Sidebar - Category Navigation -->
        <div class="w-64 flex-shrink-0">
          <div class="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
            <!-- Main Category: 文章中心 -->
            <div class="bg-primary-600 px-4 py-3">
              <h2 class="text-normal font-semibold text-white">{{ t('blog.categories') }}</h2>
            </div>

            <!-- Category List -->
            <div class="py-2">
              <!-- All Categories -->
              <div class="border-b border-gray-200">
                <button @click="setCategoryFilter('all')" :class="[
                  'w-full px-4 py-3 text-left transition-colors',
                  activeCategoryFilter === 'all'
                    ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600'
                    : 'text-gray-700 hover:text-primary-500'
                ]">
                  <span class="">{{ t('blog.all') }}</span>
                </button>
              </div>

              <!-- 最新资讯 -->
              <div class="border-b border-gray-200">
                <button @click="setCategoryFilter('newest-news')" :class="[
                  'w-full px-4 py-3 text-left transition-colors',
                  activeCategoryFilter === 'newest-news'
                    ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600'
                    : 'text-gray-700 hover:text-primary-500'
                ]">
                  <span class="font-medium">{{ t('blog.newestNews') }}</span>
                </button>
              </div>

              <!-- 肿瘤资讯 with Subcategories -->
              <div>
                <button @click="handleOncologyCategoryClick" :class="[
                  'w-full px-4 py-3 text-left flex items-center justify-between transition-colors',
                  activeCategoryFilter === 'oncology-info'
                    ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600'
                    : 'text-gray-700 hover:text-primary-500'
                ]">
                  <span class="font-medium">{{ t('blog.oncologyInfo') }}</span>
                  <svg :class="['w-4 h-4 transition-transform', showOncologySubcategories ? 'rotate-180' : '']"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <!-- Subcategories -->
                <div v-if="showOncologySubcategories" class="pl-6 border-l-2 border-gray-200 bg-gray-50">
                  <button v-for="subcategory in oncologySubcategories" :key="subcategory.value"
                    @click="setSubcategoryFilter(subcategory.value)" :class="[
                      'w-full px-3 py-2 text-left text-sm transition-colors',
                      activeSubcategoryFilter === subcategory.value
                        ? 'bg-white text-primary-700 font-medium border-l-2 border-primary-600'
                        : 'text-gray-600 hover:bg-white hover:text-gray-800'
                    ]">
                    {{ subcategory.label }}
                  </button>
                </div>
              </div>

              <!-- 其它疾病资讯 with Subcategories -->
              <div class="border-b border-gray-200">
                <button @click="handleOtherDiseaseCategoryClick" :class="[
                  'w-full px-4 py-3 text-left flex items-center justify-between transition-colors',
                  activeCategoryFilter === 'other-disease-info'
                    ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600'
                    : 'text-gray-700 hover:text-primary-500'
                ]">
                  <span class="font-medium">{{ t('blog.otherDiseaseInfo') }}</span>
                  <svg :class="['w-4 h-4 transition-transform', showOtherDiseaseSubcategories ? 'rotate-180' : '']"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <!-- Subcategories -->
                <div v-if="showOtherDiseaseSubcategories" class="pl-6 border-l-2 border-gray-200 bg-gray-50">
                  <button v-for="subcategory in otherDiseaseSubcategories" :key="subcategory.value"
                    @click="setSubcategoryFilter(subcategory.value)" :class="[
                      'w-full px-3 py-2 text-left text-sm transition-colors',
                      activeSubcategoryFilter === subcategory.value
                        ? 'bg-white text-primary-700 font-medium border-l-2 border-primary-600'
                        : 'text-gray-600 hover:bg-white hover:text-gray-800'
                    ]">
                    {{ subcategory.label }}
                  </button>
                </div>
              </div>

              <!-- 其它资讯 -->
              <div>
                <button @click="setCategoryFilter('other-info')" :class="[
                  'w-full px-4 py-3 text-left transition-colors',
                  activeCategoryFilter === 'other-info'
                    ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600'
                    : 'text-gray-700 hover:text-primary-500'
                ]">
                  <span class="font-medium">{{ t('blog.otherInfo') }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Content - Article List -->
        <div class="flex-1">
          <!-- Search Bar -->
          <div class="mb-6">
            <div class="relative">
              <input v-model="searchQuery" @keyup.enter="performSearch" type="text"
                :placeholder="t('blog.searchPlaceholder')"
                class="text-sm w-full px-4 py-2 pr-24 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 placeholder-gray-500" />
              <!-- Clear button -->
              <button v-if="searchQuery" @click="clearSearch"
                class="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                :title="t('blog.clearSearch')">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <!-- Search button -->
              <button @click="performSearch"
                class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                :title="t('blog.search')">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Article List -->
          <div class="space-y-4">
            <div v-for="item in blogPosts" :key="item.id"
              class="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div class="flex justify-between items-start">
                <router-link :to="`/blog/${item.slug}`" target="_blank" rel="noopener noreferrer" class="flex-1 hover:text-primary-600 transition-colors">

                  <!-- {{ item.title }} -->
                  <h5 class="text-sm font-medium text-gray-900">{{ item.title }}</h5>
                </router-link>
                <div class="ml-4 text-right">
                  <div class="text-xs text-gray-500 whitespace-nowrap">
                    {{ formatDate(item.publishDate) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- No Results -->
          <div v-if="blogPosts.length === 0" class="py-12 text-center">
            <p class="text-gray-500">{{ t('blog.noResults') }}</p>
          </div>

          <!-- Pagination -->
          <div v-if="blogPosts.length > 0 && totalPages > 1" class="mt-8 flex justify-center">
            <nav class="inline-flex rounded-md shadow">
              <button @click="goToPreviousPage" :disabled="currentPage === 1"
                class="px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                {{ t('blog.previousPage') }}
              </button>
              <button v-for="page in totalPages" :key="page" @click="goToPage(page)" :class="[
                'px-3 py-2 border-t border-b border-gray-300 text-sm font-medium hover:bg-gray-50',
                currentPage === page
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700'
              ]">
                {{ page }}
              </button>
              <button @click="goToNextPage" :disabled="currentPage === totalPages"
                class="px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                {{ t('blog.nextPage') }}
              </button>
            </nav>
          </div>
        </div>
      </div>

      <!-- Mobile Layout -->
      <div class="lg:hidden">
        <!-- Search and Filter Controls -->
        <div class="mb-6 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <!-- Search Input -->
          <div class="mb-4">
            <div class="relative">
              <input v-model="searchQuery" @keyup.enter="performSearch" type="text"
                :placeholder="t('blog.searchPlaceholder')"
                class="w-full px-4 py-2 pr-24 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 placeholder-gray-500" />
              <!-- Clear button -->
              <button v-if="searchQuery" @click="clearSearch"
                class="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                :title="t('blog.clearSearch')">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <!-- Search button -->
              <button @click="performSearch"
                class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                :title="t('blog.search')">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Category Filter -->
          <div class="flex flex-wrap gap-2 mb-4">
            <button @click="setCategoryFilter('all')" :class="[
              'px-3 py-1 rounded-full text-sm font-medium transition-colors',
              activeCategoryFilter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            ]">
              {{ t('blog.allCategory') }}
            </button>
            <button @click="setCategoryFilter('newest-news')" :class="[
              'px-3 py-1 rounded-full text-sm font-medium transition-colors',
              activeCategoryFilter === 'newest-news'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            ]">
              {{ t('blog.newsCategory') }}
            </button>
            <button @click="setCategoryFilter('oncology-info')" :class="[
              'px-3 py-1 rounded-full text-sm font-medium transition-colors',
              activeCategoryFilter === 'oncology-info'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            ]">
              {{ t('blog.oncologyInfo') }}
            </button>
            <button @click="setCategoryFilter('other-disease-info')" :class="[
              'px-3 py-1 rounded-full text-sm font-medium transition-colors',
              activeCategoryFilter === 'other-disease-info'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            ]">
              {{ t('blog.otherDiseaseInfo') }}
            </button>
            <button @click="setCategoryFilter('other-info')" :class="[
              'px-3 py-1 rounded-full text-sm font-medium transition-colors',
              activeCategoryFilter === 'other-info'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            ]">
              {{ t('blog.otherInfo') }}
            </button>
          </div>

          <!-- Mobile Subcategories -->
          <div v-if="activeCategoryFilter === 'oncology-info' && showOncologySubcategories" class="mb-4">
            <p class="text-xs text-gray-500 mb-2">{{ t('blog.oncologySubcategories') }}</p>
            <div class="flex flex-wrap gap-2">
              <button v-for="subcategory in oncologySubcategories" :key="subcategory.value"
                @click="setSubcategoryFilter(subcategory.value)" :class="[
                  'px-2 py-1 rounded-full text-xs font-medium transition-colors',
                  activeSubcategoryFilter === subcategory.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                ]">
                {{ subcategory.label }}
              </button>
            </div>
          </div>

          <div v-if="activeCategoryFilter === 'other-disease-info' && showOtherDiseaseSubcategories" class="mb-4">
            <p class="text-xs text-gray-500 mb-2">{{ t('blog.diseaseSubcategories') }}</p>
            <div class="flex flex-wrap gap-2">
              <button v-for="subcategory in otherDiseaseSubcategories" :key="subcategory.value"
                @click="setSubcategoryFilter(subcategory.value)" :class="[
                  'px-2 py-1 rounded-full text-xs font-medium transition-colors',
                  activeSubcategoryFilter === subcategory.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                ]">
                {{ subcategory.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- Mobile Article List -->
        <div class="space-y-4">
          <div v-for="item in blogPosts" :key="item.id"
            class="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <router-link :to="`/blog/${item.slug}`" class="block hover:text-primary-600 transition-colors">
              <h3 class="text-gray-900 mb-2">{{ item.title }}</h3>
              <div class="text-sm text-gray-500">
                {{ formatDate(item.publishDate) }}
              </div>
            </router-link>
          </div>
        </div>

        <!-- Mobile Pagination -->
        <div v-if="blogPosts.length > 0 && totalPages > 1" class="mt-8 flex justify-center">
          <nav class="inline-flex rounded-md shadow">
            <button @click="goToPreviousPage" :disabled="currentPage === 1"
              class="px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              {{ t('blog.previousPage') }}
            </button>
            <button v-for="page in totalPages" :key="page" @click="goToPage(page)" :class="[
              'px-3 py-2 border-t border-b border-gray-300 text-sm font-medium hover:bg-gray-50',
              currentPage === page
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700'
            ]">
              {{ page }}
            </button>
            <button @click="goToNextPage" :disabled="currentPage === totalPages"
              class="px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              {{ t('blog.nextPage') }}
            </button>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { throttle } from '../utils/throttle'

export default {
  name: 'Blog',
  setup() {

    const { t } = useI18n()

    const isLoading = ref(true)
    const blogPosts = ref([])
    const searchQuery = ref('')
    const activeCategoryFilter = ref('all')
    const activeSubcategoryFilter = ref('all')
    const currentPage = ref(1)
    const totalPages = ref(1)
    const showOncologySubcategories = ref(false)
    const showOtherDiseaseSubcategories = ref(false)

    // Oncology subcategories for the sidebar - using translations
    // { value: 'renal-bladder-cancer', label: t('blog.subcategories.oncology.renalBladderCancer') },
    
    const oncologySubcategories = computed(() => [
      { value: 'lymphoma', label: t('blog.subcategories.oncology.lymphoma') },
      { value: 'breast-cancer', label: t('blog.subcategories.oncology.breastCancer') },
      { value: 'kidney-bladder-cancer', label: t('blog.subcategories.oncology.kidneyBladderCancer') },
      { value: 'liver-cancer', label: t('blog.subcategories.oncology.liverCancer') },
      { value: 'colorectal-cancer', label: t('blog.subcategories.oncology.colorectalCancer') },
      { value: 'stomach-cancer', label: t('blog.subcategories.oncology.stomachCancer') },
      { value: 'pancreatic-cancer', label: t('blog.subcategories.oncology.pancreaticCancer') },
      { value: 'leukemia', label: t('blog.subcategories.oncology.leukemia') },
      { value: 'lung-cancer', label: t('blog.subcategories.oncology.lungCancer') },
      { value: 'myeloma', label: t('blog.subcategories.oncology.myeloma') },
      { value: 'melanoma', label: t('blog.subcategories.oncology.melanoma') },
      { value: 'urothelial-cancer', label: t('blog.subcategories.oncology.urothelialCancer') },
      { value: 'endometrial-cancer', label: t('blog.subcategories.oncology.endometrialCancer') },
      { value: 'cervical-cancer', label: t('blog.subcategories.oncology.cervicalCancer') },
      { value: 'ovarian-cancer', label: t('blog.subcategories.oncology.ovarianCancer') },
      { value: 'thyroid-cancer', label: t('blog.subcategories.oncology.thyroidCancer') },
      { value: 'other-cancer', label: t('blog.subcategories.oncology.otherCancer') }
    ])

    // Other disease subcategories for the sidebar - using translations
    const otherDiseaseSubcategories = computed(() => [
      { value: 'liver-disease', label: t('blog.subcategories.otherDisease.liverDisease') },
      { value: 'rheumatology', label: t('blog.subcategories.otherDisease.rheumatology') },
      { value: 'hiv', label: t('blog.subcategories.otherDisease.hiv') },
      { value: 'diabetes', label: t('blog.subcategories.otherDisease.diabetes') },
      { value: 'heart-disease', label: t('blog.subcategories.otherDisease.heartDisease') },
      { value: 'thrombocytopenia', label: t('blog.subcategories.otherDisease.thrombocytopenia') },
      { value: 'hepatitis-c', label: t('blog.subcategories.otherDisease.hepatitisC') },
      { value: 'hepatitis-b', label: t('blog.subcategories.otherDisease.hepatitisB') },
      { value: 'psoriasis', label: t('blog.subcategories.otherDisease.psoriasis') },
      { value: 'pulmonary-fibrosis', label: t('blog.subcategories.otherDisease.pulmonaryFibrosis') },
      { value: 'vitiligo', label: t('blog.subcategories.otherDisease.vitiligo') }
    ])

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

    const getCategoryLabel = (category) => {
      const categoryLabels = {
        'newest-news': t('blog.newestNews'),
        'oncology-info': t('blog.oncologyInfo'),
        'other-disease-info': t('blog.otherDiseaseInfo'),
        'other-info': t('blog.otherInfo'),
        'Product': t('blog.product')
      }
      return categoryLabels[category] || category
    }

    const getSubcategoryLabel = (subcategory) => {
      // Handle if subcategory is an array
      if (Array.isArray(subcategory)) {
        // Filter out 'nil' values and map to labels
        const validSubcategories = subcategory.filter(sc => sc && sc !== 'nil')
        if (validSubcategories.length === 0) return ''

        const labels = validSubcategories.map(sc => {
          // Search in oncology subcategories
          const oncology = oncologySubcategories.value.find(item => item.value === sc)
          if (oncology) return oncology.label

          // Search in other disease subcategories
          const otherDisease = otherDiseaseSubcategories.value.find(item => item.value === sc)
          if (otherDisease) return otherDisease.label

          return sc
        })

        return labels.join(', ')
      }

      // Handle single subcategory value
      if (!subcategory || subcategory === 'nil') return ''

      // Search in oncology subcategories
      const oncology = oncologySubcategories.value.find(sc => sc.value === subcategory)
      if (oncology) return oncology.label

      // Search in other disease subcategories
      const otherDisease = otherDiseaseSubcategories.value.find(sc => sc.value === subcategory)
      if (otherDisease) return otherDisease.label

      return subcategory
    }

    // Filter methods
    const setCategoryFilter = (category) => {
      activeCategoryFilter.value = category
      activeSubcategoryFilter.value = 'all' // Reset subcategory when changing category
      // Only show subcategories if it's the relevant category
      if (category === 'oncology-info') {
        showOncologySubcategories.value = true
      } else {
        showOncologySubcategories.value = false
      }
      if (category === 'other-disease-info') {
        showOtherDiseaseSubcategories.value = true
      } else {
        showOtherDiseaseSubcategories.value = false
      }
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' })
      // Refresh content
      fetchFilteredPosts()
    }

    const setSubcategoryFilter = (subcategory) => {
      activeSubcategoryFilter.value = subcategory
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' })
      // Refresh content
      fetchFilteredPosts()
    }

    const toggleOncologySubcategories = () => {
      showOncologySubcategories.value = !showOncologySubcategories.value
    }

    const toggleOtherDiseaseSubcategories = () => {
      showOtherDiseaseSubcategories.value = !showOtherDiseaseSubcategories.value
    }

    const handleOncologyCategoryClick = () => {
      if (activeCategoryFilter.value === 'oncology-info') {
        // If already selected, just toggle subcategories
        showOncologySubcategories.value = !showOncologySubcategories.value
      } else {
        // If different category, select it and show subcategories
        activeCategoryFilter.value = 'oncology-info'
        activeSubcategoryFilter.value = 'all' // Reset to include all subcategories
        showOncologySubcategories.value = true
        showOtherDiseaseSubcategories.value = false
      }
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' })
      // Refresh content
      fetchFilteredPosts()
    }

    const handleOtherDiseaseCategoryClick = () => {
      if (activeCategoryFilter.value === 'other-disease-info') {
        // If already selected, just toggle subcategories
        showOtherDiseaseSubcategories.value = !showOtherDiseaseSubcategories.value
      } else {
        // If different category, select it and show subcategories
        activeCategoryFilter.value = 'other-disease-info'
        activeSubcategoryFilter.value = 'all' // Reset to include all subcategories
        showOtherDiseaseSubcategories.value = true
        showOncologySubcategories.value = false
      }
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' })
      // Refresh content
      fetchFilteredPosts()
    }

    const clearFilters = () => {
      searchQuery.value = ''
      activeCategoryFilter.value = 'all'
      activeSubcategoryFilter.value = 'all'
      showOncologySubcategories.value = false
      showOtherDiseaseSubcategories.value = false
      currentPage.value = 1
      fetchFilteredPosts()
    }

    const fetchFilteredPosts = async () => {
      try {
        isLoading.value = true

        // If searching, use search API
        if (searchQuery.value && searchQuery.value.trim()) {
          await fetchSearchResults()
          return
        }

        // For filtering (no search), use original approach - fetch from separate APIs
        let allItems = []
        let totalItems = 0

        // Fetch posts
        const postsParams = new URLSearchParams()
        postsParams.append('depth', '2')
        postsParams.append('limit', '12')
        postsParams.append('page', currentPage.value.toString())
        postsParams.append('where[status][equals]', 'published')

        // Add category filter for posts
        if (activeCategoryFilter.value && activeCategoryFilter.value !== 'all') {
          postsParams.append('where[taxonomy.category][equals]', activeCategoryFilter.value)
        }

        // Add subcategory filter for posts
        if (activeSubcategoryFilter.value && activeSubcategoryFilter.value !== 'all') {
          postsParams.append('where[taxonomy.subcategory][contains]', activeSubcategoryFilter.value)
        }

        // Fetch products with same taxonomy filtering
        const productsParams = new URLSearchParams()
        productsParams.append('depth', '2')
        productsParams.append('limit', '12')
        productsParams.append('page', currentPage.value.toString())
        productsParams.append('where[status][equals]', 'published')

        // Add same taxonomy filters for products
        if (activeCategoryFilter.value && activeCategoryFilter.value !== 'all') {
          productsParams.append('where[taxonomy.category][equals]', activeCategoryFilter.value)
        }

        if (activeSubcategoryFilter.value && activeSubcategoryFilter.value !== 'all') {
          productsParams.append('where[taxonomy.subcategory][contains]', activeSubcategoryFilter.value)
        }

        const postsResponse = await fetch(`${import.meta.env.VITE_PAYLOAD_CMS_URL}/api/posts?${postsParams.toString()}`)
        if (postsResponse.ok) {
          const postsData = await postsResponse.json()
          const posts = (postsData.docs || []).map(post => ({
            id: post.id,
            title: post.title,
            slug: post.slug || post.id,
            excerpt: post.excerpt,
            category: post.taxonomy?.category || 'newest-news',
            subcategory: post.taxonomy?.subcategory || 'nil',
            image: post.featuredImage ? post.featuredImage.url : null,
            publishDate: post.createdAt,
            readTime: post.readTime || 5,
            type: 'post'
          }))
          allItems = allItems.concat(posts)
          totalItems += postsData.totalDocs || 0
        }

        // Always fetch products with taxonomy filtering applied
        const productsResponse = await fetch(`${import.meta.env.VITE_PAYLOAD_CMS_URL}/api/vendure-product?${productsParams.toString()}`)
        if (productsResponse.ok) {
          const productsData = await productsResponse.json()
          const products = (productsData.docs || []).map(product => ({
            id: product.id,
            title: product.name,
            slug: product.slug || product.id,
            excerpt: product.description || 'Discover this amazing product',
            category: product.taxonomy?.category || 'Product',
            subcategory: product.taxonomy?.subcategory || 'nil',
            image: product.heroImage ? product.heroImage.url : (product.images && product.images.length > 0 ? product.images[0].url : null),
            publishDate: product.createdAt || product.updatedAt,
            readTime: 3,
            type: 'product'
          }))
          allItems = allItems.concat(products)
          totalItems += productsData.totalDocs || 0
        }

        // Sort items by publish date (newest first)
        allItems.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))

        blogPosts.value = allItems
        totalPages.value = Math.ceil(totalItems / 12)

      } catch (error) {
        console.error('Error fetching filtered content:', error)
        blogPosts.value = []
        totalPages.value = 1
      } finally {
        isLoading.value = false
      }
    }

    // const fetchSearchResults = async () => {
    //   try {
    //     isLoading.value = true

    //     const searchParams = new URLSearchParams()
    //     searchParams.append('depth', '2')
    //     searchParams.append('limit', '12')
    //     searchParams.append('page', currentPage.value.toString())
    //     searchParams.append('sort', '-priority')

    //     // Search in title only
    //     searchParams.append('where[title][like]', searchQuery.value)

    //     const response = await fetch(`${import.meta.env.VITE_PAYLOAD_CMS_URL}/api/search?${searchParams.toString()}`)

    //     if (response.ok) {
    //       const data = await response.json()
    //       const allItems = (data.docs || []).map(item => {
    //         const doc = item.doc
    //         const content = doc.value

    //         if (doc.relationTo === 'vendure-product') {
    //           return {
    //             id: content.id,
    //             title: content.name || item.title,
    //             slug: content.slug || content.id,
    //             excerpt: content.description || 'Discover this amazing product',
    //             category: 'Product',
    //             subcategory: 'nil',
    //             image: content.heroImage?.url || (content.images?.length > 0 ? content.images[0].url : null),
    //             publishDate: content.createdAt || content.updatedAt || item.createdAt,
    //             readTime: 3,
    //             type: 'product'
    //           }
    //         } else if (doc.relationTo === 'posts') {
    //           return {
    //             id: content.id,
    //             title: content.title || item.title,
    //             slug: content.slug || content.id,
    //             excerpt: content.excerpt || '',
    //             category: content.taxonomy?.category || 'newest-news',
    //             subcategory: content.taxonomy?.subcategory || 'nil',
    //             image: content.featuredImage?.url || null,
    //             publishDate: content.createdAt || item.createdAt,
    //             readTime: content.readTime || 5,
    //             type: 'post'
    //           }
    //         }
    //         return null
    //       }).filter(item => item !== null)

    //       // Sort by priority and date
    //       allItems.sort((a, b) => {
    //         const priorityDiff = (b.priority || 0) - (a.priority || 0)
    //         if (priorityDiff !== 0) return priorityDiff
    //         return new Date(b.publishDate) - new Date(a.publishDate)
    //       })

    //       blogPosts.value = allItems
    //       totalPages.value = Math.ceil((data.totalDocs || 0) / 12)
    //     } else {
    //       console.error('Failed to fetch search results')
    //       blogPosts.value = []
    //       totalPages.value = 1
    //     }
    //   } catch (error) {
    //     console.error('Error fetching search results:', error)
    //     blogPosts.value = []
    //     totalPages.value = 1
    //   } finally {
    //     isLoading.value = false
    //   }
    // }

















    const fetchSearchResults = async () => {
      try {
        const searchParams = new URLSearchParams()
        searchParams.append('depth', '2') // Increase depth to get full document data
        searchParams.append('limit', '12')
        searchParams.append('page', currentPage.value.toString())
        searchParams.append('sort', '-priority')

        // Add search condition - only search title to avoid excerpt error
        searchParams.append('where[title][like]', searchQuery.value)

        const response = await fetch(`${import.meta.env.VITE_PAYLOAD_CMS_URL}/api/search?${searchParams.toString()}`)

        if (response.ok) {
          const data = await response.json()
          // console.log('🔍 Search API response:', data)

          const allItems = (data.docs || []).map(item => {
            const doc = item.doc

            // console.log('📄 Processing search item:', { relationTo: doc.relationTo, item })

            if (doc.relationTo === 'vendure-product') {
              const productSlug = item.slug || doc.value || item.id
              // console.log('🏷️ Product slug:', productSlug, 'from item.slug:', item.slug, 'doc.value:', doc.value)

              return {
                id: doc.value || item.id,
                title: item.title,
                slug: productSlug,
                excerpt: 'Discover this amazing product',
                category: 'Product',
                subcategory: 'nil',
                image: null,
                publishDate: item.createdAt,
                readTime: 3,
                type: 'product'
              }
            } else if (doc.relationTo === 'posts') {
              const postSlug = item.slug || doc.value || item.id
              // console.log('🏷️ Post slug:', postSlug, 'from item.slug:', item.slug, 'doc.value:', doc.value)

              return {
                id: doc.value || item.id,
                title: item.title,
                slug: postSlug,
                excerpt: '',
                category: 'newest-news',
                subcategory: 'nil',
                image: null,
                publishDate: item.createdAt,
                readTime: 5,
                type: 'post'
              }
            }
            return null
          }).filter(item => item !== null)

          // console.log('✅ Mapped search items:', allItems)

          // Apply additional client-side filtering for categories/subcategories
          const filteredItems = allItems.filter(item => {
            // Apply category filter if specified
            if (activeCategoryFilter.value && activeCategoryFilter.value !== 'all') {
              if (activeCategoryFilter.value === 'newest-news') {
                return item.type === 'post' && item.category === 'newest-news'
              } else if (activeCategoryFilter.value === 'oncology-info' || activeCategoryFilter.value === 'other-disease-info') {
                if (item.type !== 'post') return false
                if (item.category !== activeCategoryFilter.value) return false
                if (activeSubcategoryFilter.value && activeSubcategoryFilter.value !== 'all') {
                  return item.subcategory === activeSubcategoryFilter.value
                }
                return true
              } else if (activeCategoryFilter.value === 'other-info') {
                return item.type === 'post' && item.category === 'other-info'
              }
            }
            return true
          })

          // Sort by priority and date
          filteredItems.sort((a, b) => {
            const priorityDiff = (b.priority || 0) - (a.priority || 0)
            if (priorityDiff !== 0) return priorityDiff
            return new Date(b.publishDate) - new Date(a.publishDate)
          })

          blogPosts.value = filteredItems
          totalPages.value = Math.ceil(filteredItems.length / 12)
        } else {
          console.error('Failed to fetch search results')
          blogPosts.value = []
          totalPages.value = 1
        }
      } catch (error) {
        console.error('Error fetching search results:', error)
        blogPosts.value = []
        totalPages.value = 1
      }
    }

    // Manual search function
    const performSearch = () => {
      currentPage.value = 1
      fetchFilteredPosts()
    }

    // Clear search function
    const clearSearch = () => {
      searchQuery.value = ''
      currentPage.value = 1
      fetchFilteredPosts()
    }

    // Watch for filter changes
    watch([activeCategoryFilter, activeSubcategoryFilter], () => {
      currentPage.value = 1
      fetchFilteredPosts()
    })

    // Pagination methods
    const goToPage = (page) => {
      if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page
        fetchFilteredPosts()
      }
    }

    const goToNextPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++
        fetchFilteredPosts()
      }
    }

    const goToPreviousPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--
        fetchFilteredPosts()
      }
    }

    onMounted(() => {
      fetchFilteredPosts()
    })

    return {
      t,
      isLoading,
      blogPosts,
      formatDate,
      searchQuery,
      activeCategoryFilter,
      activeSubcategoryFilter,
      currentPage,
      totalPages,
      showOncologySubcategories,
      showOtherDiseaseSubcategories,
      oncologySubcategories,
      otherDiseaseSubcategories,
      setCategoryFilter,
      setSubcategoryFilter,
      toggleOncologySubcategories,
      toggleOtherDiseaseSubcategories,
      handleOncologyCategoryClick,
      handleOtherDiseaseCategoryClick,
      clearFilters,
      goToPage,
      goToNextPage,
      goToPreviousPage,
      performSearch,
      clearSearch,
      getCategoryLabel,
      getSubcategoryLabel
    }
  }
}
</script>