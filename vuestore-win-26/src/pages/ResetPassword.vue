<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="text-center">
        <h2 class="mt-6 text-3xl font-heading font-bold text-slate-900 dark:text-white">
          {{ t('auth.resetPasswordTitle') }}
        </h2>
        <p class="mt-3 text-sm text-slate-600 dark:text-slate-400">
          {{ t('auth.resetPasswordSubtitle') }}
        </p>
      </div>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white dark:bg-slate-800 py-8 px-4 shadow-lg rounded-xl sm:px-10 border border-slate-200 dark:border-slate-700">
        <!-- Error Message -->
        <div v-if="message && messageType === 'error'" class="mb-6 rounded-lg p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <div class="ml-3 flex-1">
              <p class="text-sm text-red-800 dark:text-red-300">{{ message }}</p>
            </div>
          </div>
        </div>

        <!-- Success Message -->
        <div v-if="message && messageType === 'success'" class="text-center py-8">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-50 dark:bg-green-900/20 mb-6">
            <svg class="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-xl font-heading font-semibold text-slate-900 dark:text-white mb-3">
            {{ t('auth.passwordResetSuccess') }}
          </h3>
          <!-- <p class="text-base text-slate-600 dark:text-slate-400 mb-2">
            {{ message }}
          </p> -->
          <p class="text-sm text-slate-500 dark:text-slate-500 mb-8">
            {{ t('auth.passwordResetDesc') }}
          </p>
          <router-link
            to="/sign-in"
            class="inline-flex items-center px-6 py-3 border border-blue-600 rounded-lg shadow-sm text-base font-medium text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 dark:bg-slate-700 dark:text-blue-400 dark:border-blue-500 dark:hover:bg-slate-600"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {{ t('auth.backToSignIn') }}
          </router-link>
        </div>

        <form v-if="!(message && messageType === 'success')" class="space-y-6" @submit.prevent="handleResetPassword">
          <div>
            <div class="flex items-center justify-between mb-2">
              <label for="password" class="block text-sm font-heading font-medium text-slate-700 dark:text-slate-300">
                {{ t('auth.newPassword') }}
              </label>
              <span class="text-xs text-slate-500 dark:text-slate-500">
                {{ t('auth.minCharacters') }}
              </span>
            </div>
            <div class="relative">
              <SfInput
                id="password"
                v-model="password"
                name="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                required
                size="lg"
                :placeholder="t('auth.enterNewPassword')"
                class="pr-12 dark:border-transparent"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 pr-8 flex items-center text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                @click="showPassword = !showPassword"
              >
                <SfIconVisibilityOff v-if="showPassword" class="w-5 h-5" />
                <SfIconVisibility v-else class="w-5 h-5" />
              </button>
            </div>
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-heading font-medium text-slate-700 dark:text-slate-300 mb-2">
              {{ t('auth.confirmPassword') }}
            </label>
            <div class="relative">
              <SfInput
                id="confirmPassword"
                v-model="confirmPassword"
                name="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                autocomplete="new-password"
                required
                size="lg"
                :placeholder="t('auth.confirmNewPasswordPlaceholder')"
                class="pr-12 dark:border-transparent"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 pr-8 flex items-center text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                <SfIconVisibilityOff v-if="showConfirmPassword" class="w-5 h-5" />
                <SfIconVisibility v-else class="w-5 h-5" />
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              :disabled="loading"
              class="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-200 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-500"
            >
              <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ loading ? t('auth.resetting') : t('auth.resetPassword') }}</span>
            </button>
          </div>

          <div class="text-center">
            <router-link to="/sign-in" class="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {{ t('auth.backToSignIn') }}
            </router-link>
          </div>
        </form>
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

const loading = ref(false)
const password = ref('')
const confirmPassword = ref('')
const message = ref('')
const messageType = ref('')
const token = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const RESET_PASSWORD_MUTATION = `
  mutation ResetPassword($token: String!, $password: String!) {
    resetPassword(token: $token, password: $password) {
      __typename
      ... on CurrentUser {
        id
        identifier
      }
      ... on PasswordResetTokenExpiredError {
        errorCode
        message
      }
      ... on PasswordResetTokenInvalidError {
        errorCode
        message
      }
      ... on PasswordValidationError {
        errorCode
        message
      }
    }
  }
`

onMounted(() => {
  token.value = route.query.token || ''
  if (!token.value) {
    message.value = 'Invalid or missing reset token.'
    messageType.value = 'error'
  }
})

const handleResetPassword = async () => {
  if (!token.value) return
  if (password.value !== confirmPassword.value) {
    message.value = 'Passwords do not match.'
    messageType.value = 'error'
    return
  }

  loading.value = true
  message.value = ''
  messageType.value = ''

  window.scrollTo({ top: 0, behavior: 'smooth' })

  try {
    const result = await graphqlRequest(RESET_PASSWORD_MUTATION, {
      token: token.value,
      password: password.value,
    })

    const response = result?.resetPassword

    if (response?.__typename === 'CurrentUser') {
      message.value = 'Password reset successful! You can now log in.'
      messageType.value = 'success'
    } else {
      message.value = response?.message || 'Password reset failed.'
      messageType.value = 'error'
    }
  } catch (err) {
    console.error('Reset password error:', err)
    message.value = 'Unable to reset password. Please try again later.'
    messageType.value = 'error'
  } finally {
    loading.value = false
  }
}
</script>
