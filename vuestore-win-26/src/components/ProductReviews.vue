<template>
  <div class="max-w-6xl mx-auto pt-16 px-4 sm:px-6 lg:px-8">
    <!-- Review Header with Stats -->
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-12">
      <div class="flex-1">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold text-gray-900">Customer Reviews</h2>

          <!-- Write Review Button - Now aligned horizontally -->
          <div class="lg:ml-8">
            <button @click="openReviewForm"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200">
              Write a Review
            </button>
          </div>
        </div>

        <!-- Overall Rating -->
        <div class="mt-4 flex items-center">
          <div class="flex items-center">
            <StarRating :rating="Math.round(stats.averageRating)" :show-number="true" />
            <p class="ml-2 text-sm text-gray-600">
              {{ stats.averageRating.toFixed(1) }} out of 5
            </p>
          </div>
          <p class="ml-4 text-sm text-gray-500">
            {{ stats.totalReviews }} {{ stats.totalReviews === 1 ? 'review' : 'reviews' }}
          </p>
        </div>

        <!-- Rating Distribution -->
        <div class="mt-6 space-y-2">
          <div v-for="rating in [5, 4, 3, 2, 1]" :key="rating" class="flex items-center text-sm">
            <div class="w-12 text-gray-600">{{ rating }} star</div>
            <div class="flex-1 mx-4">
              <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div class="h-full bg-yellow-400"
                  :style="{ width: stats.totalReviews > 0 ? (stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution] / stats.totalReviews * 100) + '%' : '0%' }" />
              </div>
            </div>
            <div class="w-12 text-right text-gray-600">
              {{ stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution] }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Review Form Modal -->
    <div v-if="showReviewForm" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Write a Review</h3>

          <form @submit.prevent="submitNewReview">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Your Rating
              </label>
              <StarRating v-model:rating="newReview.rating" :interactive="true" :show-number="true" />
            </div>

            <div class="mb-4">
              <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
                Review Title
              </label>
              <input id="title" v-model="newReview.title" type="text" :class="[
                'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2',
                formErrors.title
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
              ]" placeholder="Summarize your experience" required />
              <p v-if="formErrors.title" class="mt-1 text-sm text-red-600">{{ formErrors.title }}</p>
            </div>

            <div class="mb-4">
              <label for="content" class="block text-sm font-medium text-gray-700 mb-2">
                Your Review
              </label>
              <textarea id="content" v-model="newReview.content" rows="4" :class="[
                'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2',
                formErrors.content
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
              ]" placeholder="Share your thoughts about this product..." required />
              <p v-if="formErrors.content" class="mt-1 text-sm text-red-600">{{ formErrors.content }}</p>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label for="author" class="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <input id="author" v-model="newReview.author" type="text" :class="[
                  'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2',
                  formErrors.author
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : isLoggedIn
                      ? 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed'
                      : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                ]" :placeholder="isLoggedIn ? '' : 'John Doe'" :required="!isLoggedIn" :disabled="isLoggedIn"
                  :readonly="isLoggedIn" />
                <p v-if="formErrors.author" class="mt-1 text-sm text-red-600">{{ formErrors.author }}</p>
              </div>
              <div>
                <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                  Email (optional)
                </label>
                <input id="email" v-model="newReview.authorEmail" type="email" :class="[
                  'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2',
                  formErrors.authorEmail
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : isLoggedIn
                      ? 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed'
                      : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                ]" :placeholder="isLoggedIn ? '' : 'john@example.com'" :disabled="isLoggedIn"
                  :readonly="isLoggedIn" />
                <p v-if="formErrors.authorEmail" class="mt-1 text-sm text-red-600">{{ formErrors.authorEmail }}</p>
              </div>
            </div>

            <div class="flex items-center mb-6">
              <input id="verifiedPurchase" v-model="newReview.verifiedPurchase" type="checkbox"
                class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
              <label for="verifiedPurchase" class="ml-2 block text-sm text-gray-700">
                I purchased this product
              </label>
            </div>

            <div class="flex justify-end space-x-3">
              <button type="button" @click="closeReviewForm"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                Cancel
              </button>
              <button type="submit" :disabled="submitting"
                class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed">
                {{ submitting ? 'Submitting...' : 'Submit Review' }}
              </button>
            </div>
          </form>



        </div>
      </div>
    </div>

    <!-- Reviews List -->
    <div class="mt-12 border-t border-gray-200 divide-y divide-gray-200 space-y-12">
      <div v-for="review in reviews" :key="review.id" class="pt-12 lg:grid lg:grid-cols-12 lg:gap-x-8">
        <!-- Review Content -->
        <div
          class="lg:col-start-5 lg:col-span-8 xl:col-start-4 xl:col-span-9 xl:grid xl:grid-cols-3 xl:gap-x-8 xl:items-start">
          <!-- Rating and Title -->
          <div class="flex items-center xl:col-span-1">
            <div class="flex items-center">
              <StarRating :rating="review.rating" :show-number="true" />
            </div>
          </div>

          <!-- Review Body -->
          <div class="mt-4 lg:mt-6 xl:mt-0 xl:col-span-2">
            <h3 class="text-sm font-medium text-gray-900">{{ review.title }}</h3>

            <div class="mt-3 space-y-6 text-sm text-gray-500">
              <p class="whitespace-pre-line">{{ review.content }}</p>
            </div>

            <!-- Helpful Actions -->
            <div class="mt-6 flex items-center space-x-4 text-sm">
              <button @click="markHelpful(review.id, true)" class="text-gray-500 hover:text-gray-700">
                Helpful ({{ review.helpful || 0 }})
              </button>
              <button @click="markHelpful(review.id, false)" class="text-gray-500 hover:text-gray-700">
                Not helpful ({{ review.notHelpful || 0 }})
              </button>
            </div>
          </div>
        </div>

        <!-- Author Info -->
        <div
          class="mt-6 flex items-center text-sm lg:mt-0 lg:col-start-1 lg:col-span-4 lg:row-start-1 lg:flex-col lg:items-start xl:col-span-3">
          <p class="font-medium text-gray-900">{{ review.author }}</p>

          <div class="mt-1 space-y-1">
            <time :datetime="review.datetime" class="text-gray-500">
              {{ review.date }}
            </time>

            <div v-if="review.verifiedPurchase" class="flex items-center text-green-600 text-xs">
              <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd" />
              </svg>
              Verified Purchase
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      <p class="mt-4 text-gray-600">Loading reviews...</p>
    </div>

    <!-- No Reviews -->
    <div v-else-if="reviews.length === 0" class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">No reviews yet</h3>
      <p class="mt-1 text-sm text-gray-500">Be the first to share your thoughts about this product!</p>
    </div>

    <!-- Pagination Section -->
    <div v-if="reviews.length > 0 && totalPages > 1"
      class="flex justify-between items-center py-8 mt-8 border-t border-gray-200">
      <!-- Left side: Showing results info -->
      <div class="text-sm text-gray-600">
        Showing {{ ((currentPage - 1) * pageSize) + 1 }} to
        {{ Math.min(currentPage * pageSize, totalReviewsCount) }}
        of {{ totalReviewsCount }} reviews
      </div>

      <!-- Right side: Page navigation -->
      <div class="flex items-center space-x-2">
        <!-- Previous button -->
        <button v-if="currentPage > 1" @click="prevPage" :disabled="loading"
          class="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
          Previous
        </button>

        <!-- Page numbers -->
        <div class="flex space-x-1">
          <button v-for="pageNum in visiblePages" :key="pageNum" @click="goToPage(pageNum)" :class="[
            'px-3 py-1 text-sm font-medium rounded-md',
            pageNum === currentPage
              ? 'bg-primary-600 text-white'
              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
          ]" :disabled="loading">
            {{ pageNum }}
          </button>
        </div>

        <!-- Next button -->
        <button v-if="currentPage < totalPages" @click="nextPage" :disabled="loading"
          class="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAppStore } from '../stores/app'
import StarRating from './StarRating.vue'
import { getReviewsByProductId, getReviewStats, submitReview, markReviewHelpful, type Review, type ReviewStats } from '../providers/shop/comments/comments'

interface Props {
  productId: string
}

const props = defineProps<Props>()
const appStore = useAppStore()

// Authentication state
const isLoggedIn = computed(() => appStore.isLoggedIn)
const currentUser = computed(() => appStore.customer)

const reviews = ref<Review[]>([])
const stats = ref<ReviewStats>({
  averageRating: 0,
  totalReviews: 0,
  ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
})
const loading = ref(false)
const showReviewForm = ref(false)
const submitting = ref(false)
const formErrors = ref<Record<string, string>>({})

// Pagination state
const currentPage = ref(1)
const totalPages = ref(1)
const totalReviewsCount = ref(0)

// Environment variables
const envPageSize = import.meta.env.VITE_REVIEWS_NUMBER_IN_A_PAGE;
const pageSize = envPageSize ? parseInt(envPageSize) : 2;
// console.log('📄 ProductReviews page size:', pageSize, 'from env:', envPageSize);

const newReview = ref({
  rating: 5,
  title: '',
  content: '',
  author: '',
  authorEmail: '',
  verifiedPurchase: false
})

const loadReviews = async (page = 1) => {
  loading.value = true
  try {
    const [reviewsData, statsData] = await Promise.all([
      getReviewsByProductId(props.productId, page),
      getReviewStats(props.productId)
    ])
    reviews.value = reviewsData.items
    stats.value = statsData
    totalReviewsCount.value = reviewsData.totalCount

    // Calculate total pages based on total reviews count and page size
    totalPages.value = Math.ceil(totalReviewsCount.value / pageSize)
    currentPage.value = page
  } catch (error) {
    console.error('Error loading reviews:', error)
  } finally {
    loading.value = false
  }
}

const validateForm = () => {
  const errors: Record<string, string> = {}

  if (!newReview.value.title.trim()) {
    errors.title = 'Review title is required'
  }

  if (!newReview.value.content.trim()) {
    errors.content = 'Review content is required'
  }

  // Only require author name for non-logged-in users
  if (!isLoggedIn.value && !newReview.value.author.trim()) {
    errors.author = 'Your name is required'
  }

  // Only validate email for non-logged-in users who enter an email
  if (!isLoggedIn.value && newReview.value.authorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newReview.value.authorEmail)) {
    errors.authorEmail = 'Please enter a valid email address'
  }

  formErrors.value = errors
  return Object.keys(errors).length === 0
}

const submitNewReview = async () => {
  // Validate form before submission
  if (!validateForm()) {
    return
  }

  submitting.value = true
  try {
    await submitReview({
      ...newReview.value,
      productId: props.productId
    })

    // Reset form and reload reviews
    newReview.value = {
      rating: 5,
      title: '',
      content: '',
      author: '',
      authorEmail: '',
      verifiedPurchase: false
    }
    formErrors.value = {}
    showReviewForm.value = false
    await loadReviews()
  } catch (error) {
    console.error('Error submitting review:', error)
    // You could add a generic error message here
  } finally {
    submitting.value = false
  }
}

const markHelpful = async (reviewId: string, helpful: boolean) => {
  try {
    await markReviewHelpful(reviewId, helpful)
    await loadReviews() // Reload to get updated counts
  } catch (error) {
    console.error('Error marking review helpful:', error)
  }
}

const openReviewForm = () => {
  showReviewForm.value = true

  // Pre-fill user info if logged in
  if (isLoggedIn.value && currentUser.value) {
    newReview.value.author = currentUser.value.firstName || ''
    newReview.value.authorEmail = currentUser.value.emailAddress || ''
    newReview.value.verifiedPurchase = true // Assume logged-in users have purchased
  }
}

const closeReviewForm = () => {
  showReviewForm.value = false
  formErrors.value = {}
}

// Pagination methods
const goToPage = (pageNum: number) => {
  if (pageNum === currentPage.value || loading.value) return
  loadReviews(pageNum)
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    goToPage(currentPage.value + 1)
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    goToPage(currentPage.value - 1)
  }
}

// Calculate visible pages for pagination (similar to Search.vue)
const visiblePages = computed(() => {
  const current = currentPage.value
  const total = totalPages.value
  const maxVisible = 5 // Show maximum 5 page numbers

  if (total <= maxVisible) {
    // Show all pages if total is less than maxVisible
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  // Calculate range of pages to show
  let start = Math.max(1, current - Math.floor(maxVisible / 2))
  let end = Math.min(total, start + maxVisible - 1)

  // Adjust start if we're near the end
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

onMounted(() => {
  loadReviews()
})
</script>