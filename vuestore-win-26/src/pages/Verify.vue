<template>
  <div class="min-h-[60vh] bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 class="mt-6 text-center text-3xl font-heading font-bold text-slate-900 dark:text-white">
        {{ t('auth.accountVerification') }}
      </h2>
      <p class="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
        {{ t('auth.verifyingAccount') }}
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white dark:bg-slate-800 py-8 px-4 shadow-lg rounded-xl sm:px-10 border border-slate-200 dark:border-slate-700">
        <!-- Loading State -->
        <div v-if="loading" class="text-center py-8">
          <div class="flex justify-center mb-6">
            <SfLoaderCircular class="w-12 h-12 text-blue-500" />
          </div>
          <p class="text-slate-600 dark:text-slate-400 text-lg">{{ t('auth.verifying') }}</p>
          <p class="text-slate-500 dark:text-slate-500 text-sm mt-2">{{ t('auth.takesFewSeconds') }}</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center py-6">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-50 dark:bg-red-900/20 mb-6">
            <svg class="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h3 class="text-xl font-heading font-semibold text-slate-900 dark:text-white mb-3">
            {{ t('auth.verificationFailed') }}
          </h3>
          <p class="text-base text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
            {{ error }}
          </p>
          <button
            @click="$router.push('/sign-in')"
            class="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-500"
          >
            {{ t('auth.backToSignIn') }}
          </button>
        </div>

        <!-- Success State -->
        <div v-else-if="success" class="text-center py-6">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-50 dark:bg-green-900/20 mb-6">
            <svg class="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-xl font-heading font-semibold text-slate-900 dark:text-white mb-3">
            {{ t('auth.accountVerified') }}
          </h3>
          <p class="text-base text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
            {{ t('auth.accountVerifiedDesc') }}
          </p>
          <button
            @click="$router.push('/sign-in')"
            class="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-500"
          >
            {{ t('auth.goToSignIn') }}
          </button>
        </div>

        <!-- No Token State -->
        <div v-else class="text-center py-8">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-700 mb-6">
            <svg class="h-8 w-8 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
            </svg>
          </div>
          <p class="text-slate-600 dark:text-slate-400 text-lg mb-2">{{ t('auth.noToken') }}</p>
          <p class="text-slate-500 dark:text-slate-500 text-sm mb-8">{{ t('auth.invalidOrExpired') }}</p>
          <router-link
            to="/sign-in"
            class="inline-flex items-center text-base font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {{ t('auth.backToSignIn') }}
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { graphqlRequest } from '../utils/api'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const loading = ref(true)
const error = ref('')
const success = ref(false)

const VERIFY_MUTATION = `
  mutation VerifyCustomerAccount($token: String!) {
    verifyCustomerAccount(token: $token) {
      __typename
      ... on CurrentUser {
        id
        identifier
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`

const verifyAccount = async (token) => {
  try {
    const result = await graphqlRequest(VERIFY_MUTATION, { token })
    const verificationResult = result.verifyCustomerAccount

    if (verificationResult.__typename === 'CurrentUser') {
      success.value = true
    } else {
      error.value = verificationResult.message || 'Verification failed'
    }
  } catch (err) {
    error.value = err.message || 'An error occurred during verification'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  const token = route.query.token

  if (!token) {
    error.value = 'No verification token found in URL'
    loading.value = false
    return
  }

  await verifyAccount(token)
})
</script>
