<template>
  <div class="min-h-[50vh] bg-gray-50 flex flex-col justify-center py-8 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        {{ t('auth.forgotPasswordTitle') }}
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        {{ t('auth.forgotPasswordSubtitle') }}
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <!-- Error Message -->
        <div v-if="message && messageType === 'error'" class="text-center mb-6 text-red-600">
          {{ message }}
        </div>

        <!-- Success Message -->
        <div v-if="message && messageType === 'success'" class="text-center mb-6 text-green-600">
          {{ message }}
        </div>

        <form class="space-y-6" @submit.prevent="handleForgotPassword">
          <div v-if="!linkSent">

            <label for="emailAddress" class="block text-sm font-medium text-gray-700">
              {{ t('auth.email') }}
            </label>

            <div class="mt-2">
              <SfInput class="w-full" id="emailAddress" v-model="emailAddress" name="emailAddress" type="email"
                autocomplete="email" required size="lg" :placeholder="t('auth.enterEmail')" />
            </div>
          </div>

          <div>
            <SfButton v-if="!linkSent" type="submit" size="lg" class="w-full flex justify-center border border-primary-600 border-1"
              :disabled="loading || linkSent">
              <SfLoaderCircular v-if="loading" class="w-[15px] h-[15px] !important mr-2" />
              <div class="text-gray-900 dark:text-white">{{ loading ? t('auth.sending') : linkSent ? t('auth.linkSent') : t('auth.sendResetLink') }}</div>
            </SfButton>

            <!-- ✅ Back link placed here -->
            <div class="text-center mt-2">
              <router-link to="/sign-in" class="text-sm font-medium text-primary-600 hover:text-primary-500">
                ← {{ t('auth.backToSignInLink') }}
              </router-link>
            </div>
          </div>

        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { graphqlRequest } from '../utils/api'

const { t } = useI18n()

const loading = ref(false)
const emailAddress = ref('')
const message = ref('')
const messageType = ref('') // 'success' or 'error'
const linkSent = ref(false) // Track if reset link has been sent

const REQUEST_RESET_MUTATION = `
  mutation RequestPasswordReset($emailAddress: String!) {
    requestPasswordReset(emailAddress: $emailAddress) {
      __typename
      ... on Success {
        success
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`

const handleForgotPassword = async () => {
  loading.value = true
  message.value = ''
  messageType.value = ''

  // Scroll to top of the page
  window.scrollTo({ top: 0, behavior: 'smooth' })

  try {
    const result = await graphqlRequest(REQUEST_RESET_MUTATION, {
      emailAddress: emailAddress.value,
    })

    const response = result?.requestPasswordReset

    if (response?.__typename === 'Success') {
      // message.value =
      //   "If an account exists for this email, you'll receive a reset link shortly."
      message.value = t('auth.resetLinkSent')
      messageType.value = 'success'
      emailAddress.value = ''
      linkSent.value = true // Disable button after successful submission
    } else {
      // Vendure usually still returns Success even if email not found
      // but handle ErrorResult just in case
      message.value = response?.message || t('auth.requestFailed')
      messageType.value = 'error'
    }
  } catch (err) {
    console.error('Forgot password error:', err)
    message.value = t('auth.unableToProcess')
    messageType.value = 'error'
  } finally {
    loading.value = false
  }
}
</script>