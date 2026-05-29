<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="text-center">
        <h2 class="mt-6 text-3xl font-heading font-bold text-slate-900 dark:text-white">
          {{ t('auth.welcomeBack') }}
        </h2>
        <p class="mt-3 text-sm text-slate-600 dark:text-slate-400">
          {{ t('auth.signInSubtitle') }}
        </p>
      </div>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white dark:bg-slate-800 py-8 px-4 shadow-lg rounded-xl sm:px-10 border border-slate-200 dark:border-slate-700">
        <form class="space-y-6" @submit.prevent="handleSignIn">
          <div>
            <label for="email" class="block text-sm font-heading font-medium text-slate-700 dark:text-slate-300 mb-2">
              {{ t('auth.email') }}
            </label>
            <SfInput
              id="email"
              v-model="form.email"
              name="email"
              type="email"
              autocomplete="email"
              required
              size="lg"
              :placeholder="t('auth.enterEmail')"
              class="dark:border-transparent"
            />
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <label for="password" class="block text-sm font-heading font-medium text-slate-700 dark:text-slate-300">
                {{ t('auth.password') }}
              </label>
              <router-link to="/forgot-password" class="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                {{ t('auth.forgotPassword') }}
              </router-link>
            </div>
            <div class="relative">
              <SfInput
                id="password"
                v-model="form.password"
                name="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                required
                size="lg"
                :placeholder="t('auth.enterPassword')"
                class="pr-12 dark:border-transparent"
              />
              <button
                type="button" class="absolute inset-y-0 right-0 pr-8 flex items-center text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                @click="showPassword = !showPassword"
              >
                <SfIconVisibilityOff v-if="showPassword" class="w-5 h-5" />
                <SfIconVisibility v-else class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- Message Display -->
          <div v-if="message" class="rounded-lg p-4" :class="messageType === 'success' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <svg v-if="messageType === 'success'" class="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <svg v-else class="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <div class="ml-3 flex-1">
                <p class="text-sm" :class="messageType === 'success' ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'">
                  {{ message }}
                </p>
              </div>
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
              <span>{{ loading ? t('auth.signingIn') : t('auth.signIn') }}</span>
            </button>
          </div>

          <div class="text-center">
            <p class="text-sm text-slate-600 dark:text-slate-400">
              {{ t('auth.noAccount') }}
              <router-link to="/sign-up" class="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 ml-1">
                {{ t('auth.signUp') }}
              </router-link>
            </p>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '../stores/app'
import { loginMutation } from '../providers/shop/account/account'
import { getActiveOrderQuery } from '../providers/shop/orders/order'

export default {
  name: 'SignIn',
  setup() {
    const router = useRouter()
    const appStore = useAppStore()
    const { t } = useI18n()
    const loading = ref(false)
    const message = ref('')
    const messageType = ref('')

    const form = ref({
      email: '',
      password: ''
    })

    const showPassword = ref(false)

    const handleSignIn = async () => {
      loading.value = true
      message.value = ''
      messageType.value = ''

      try {
        const result = await loginMutation(form.value.email, form.value.password)

        if (result.__typename === 'CurrentUser') {
          // message.value = `Successfully logged in as ${result.identifier}`
          message.value = `登录成功`
          messageType.value = 'success'

          appStore.setCustomer({
            id: result.id,
            firstName: result.identifier.split('@')[0],
            lastName: '',
            emailAddress: result.identifier
          })

          const tokenEffective = await appStore.verifyTokenEffectiveness()

          if (tokenEffective) {
            try {
              await appStore.loadCustomerAddresses()
            } catch (error) {
              console.error('Error loading customer addresses after login:', error)
            }

            try {
              const activeOrder = await getActiveOrderQuery()
              if (activeOrder) {
                appStore.setActiveOrder(activeOrder)
              }
            } catch (error) {
              console.error('Error refreshing active order after login:', error)
            }

            router.push('/account')
          } else {
            message.value = 'Login successful but could not load profile data'
            messageType.value = 'error'
          }
        } else {
          message.value = `${result.message}`
          messageType.value = 'error'
        }
      } catch (error) {
        console.error('Sign in failed:', error)
        message.value = `Error: ${error.message}`
        messageType.value = 'error'
      } finally {
        loading.value = false
      }
    }

    return {
      form,
      loading,
      message,
      messageType,
      showPassword,
      handleSignIn,
      t
    }
  }
}
</script>
