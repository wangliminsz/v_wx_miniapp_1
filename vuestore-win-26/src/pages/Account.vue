<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">{{ t('account.loadingAccount') }}</p>
      </div>
    </div>

    <!-- Account Content -->
    <div v-else class="max-w-6xl mx-auto px-4 py-8">
      <!-- Account Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">{{ t('account.myAccount') }}</h1>
        <p class="text-gray-600 mt-2">{{ t('account.manageAccount') }}</p>
      </div>

      <!-- Account Navigation -->
      <div class="mb-8">
        <nav class="flex space-x-4 md:space-x-8 border-b border-gray-200 px-2 md:px-0">
          <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id" :class="[
            'py-4 px-1 border-b-2 font-medium text-sm',
            activeTab === tab.id
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          ]">
            {{ tab.name }}
          </button>
        </nav>
      </div>

      <!-- Profile Tab -->
      <div v-if="activeTab === 'profile'" class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-medium text-gray-900">{{ t('account.profileInformation') }}</h2>
          <p class="text-sm text-gray-600 mt-1">{{ t('account.updateProfileDesc') }}</p>
        </div>

        <div class="p-6">
          <!-- Profile Card -->
          <div class="flex flex-col items-center mb-8">
            <div
              class="relative flex flex-col items-center rounded-[20px] w-full max-w-md mx-auto p-4 bg-white bg-clip-border shadow-xl hover:shadow-2xl border border-gray-100">
              <div class="relative flex h-32 w-full justify-center rounded-xl bg-cover">
                <div
                  class="absolute flex h-32 w-full justify-center rounded-xl bg-gradient-to-r from-blue-500 to-purple-600">
                </div>
                <div
                  class="absolute -bottom-12 flex h-24 w-24 items-center justify-center rounded-full border-[4px] border-white bg-gray-100">
                  <div class="h-full w-full rounded-full bg-gray-300 flex items-center justify-center">
                    <span class="text-2xl font-bold text-gray-600">{{ customerInitials }}</span>
                  </div>
                </div>
                <div class="absolute -bottom-12 right-0">
                  <button @click="isEditing = !isEditing"
                    class="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow">
                    <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              </div>
              <div class="mt-16 flex flex-col items-center pb-4">
                <h4 class="text-xl md:text-2xl font-bold text-gray-900">

                  {{ displayName }}
                  <span v-if="customer.title" class="text-base font-normal mr-1">{{ customer.title }}</span>
                </h4>
              </div>
              <div class="flex flex-col items-center justify-center text-center">
                <div v-if="customer.phoneNumber" class="text-sm md:text-base text-gray-600 mb-2">
                  {{ t('account.phone') }} <span class="font-semibold">{{ customer.phoneNumber }}</span>
                </div>
                <div class="text-sm md:text-base text-gray-600">
                  {{ t('account.email') }} <span class="font-semibold">{{ customer.emailAddress }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Edit Form -->
          <div v-if="isEditing" class="max-w-3xl mx-auto">
            <div class="gap-6 grid grid-cols-1 md:grid-cols-2">
              <!-- Title -->
              <div class="md:col-span-2 md:w-1/4">
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('account.title') }}</label>
                <input type="text" v-model="editForm.title"
                  class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  :placeholder="t('account.titlePlaceholder')" />
              </div>

              <!-- Last Name -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('account.lastName') }}</label>
                <input type="text" v-model="editForm.lastName" required
                  class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
              </div>

              <!-- First Name -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('account.firstName') }}</label>
                <input type="text" v-model="editForm.firstName" required
                  class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
              </div>

            

              <!-- Phone Number -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('account.phoneNumber') }}</label>
                <input type="tel" v-model="editForm.phoneNumber"
                  class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-4 mt-8">
              <button @click="saveProfile"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                {{ t('account.saveChanges') }}
              </button>
              <button @click="cancelEdit"
                class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                {{ t('account.cancel') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Password Tab -->
      <div v-if="activeTab === 'password'" class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-medium text-gray-900">{{ t('account.changePassword') }}</h2>
          <p class="text-sm text-gray-600 mt-1">{{ t('account.passwordSecurityDesc') }}</p>
        </div>

        <div class="p-6">
          <div class="max-w-md mx-auto">
            <form @submit.prevent="updatePassword" class="space-y-6">
              <!-- Current Password -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('account.currentPassword') }}</label>
                <input :type="showPassword ? 'text' : 'password'" v-model="passwordForm.currentPassword" required
                  autocomplete="current-password"
                  class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
              </div>

              <!-- New Password -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('auth.newPassword') }}</label>
                <input :type="showPassword ? 'text' : 'password'" v-model="passwordForm.newPassword" required
                  autocomplete="new-password"
                  class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
              </div>

              <!-- Confirm Password -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('account.confirmNewPassword')
                }}</label>
                <input :type="showPassword ? 'text' : 'password'" v-model="passwordForm.confirmPassword" required
                  autocomplete="new-password"
                  class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
              </div>

              <!-- Error Message -->
              <div v-if="passwordError" class="text-center mb-6 text-red-600">
                {{ passwordError }}
              </div>

              <!-- Success Message -->
              <div v-if="passwordSuccess" class="text-center mb-6 text-green-600">
                {{ t('account.passwordUpdated') }}
              </div>

              <!-- Action Buttons -->
              <div class="flex gap-4 justify-center">
                <button type="submit"
                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {{ t('common.update') }}
                </button>
                <button type="button" @click="togglePasswordVisibility"
                  class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                  <svg v-if="showPassword" class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg v-else class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                  {{ showPassword ? t('common.hide') : t('common.show') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Orders History Tab -->
      <div v-if="activeTab === 'orders'" class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text font-medium text-gray-900">{{ t('account.purchaseHistory') }}</h2>
          <p class="text-sm text-gray-600 mt-1">{{ t('account.viewPastOrders') }}</p>
        </div>

        <div class="py-4 px-2">
          <!-- Loading State -->
          <div v-if="ordersLoading" class="flex items-center justify-center py-8">
            <div class="text-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p class="mt-4 text-gray-600">{{ t('account.loadingOrders') }}</p>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else-if="orders.length === 0" class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">{{ t('account.noOrders') }}</h3>
            <p class="mt-1 text-sm text-gray-500">{{ t('account.noOrdersYet') }}</p>
          </div>

          <!-- Orders Grid -->
          <div v-else class="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div v-for="order in orders" :key="order.id"
              class="bg-gray-50 rounded-lg border border-gray-200 p-4 md:p-6 hover:shadow-md transition-shadow">
              <!-- Order Header -->
              <!-- <div class="flex justify-between items-start mb-4"> -->
              <div class="mb-6">
                <div>
                 
                  <div class="flex flex-row justify-between mb-2">
                    <p class="text-sm text-gray-500">{{ formatOrderDate(order.createdAt) }}</p>

                    <span :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      getOrderStatusClass(order.state)
                    ]">
                      {{ formatOrderState(order.state) }}
                    </span>
                  </div>
                   <h3 class="text font-medium text-gray-900">{{ t('account.orderNumber') }}{{ order.code }}</h3>

                </div>
              </div>

              <!-- </div> -->

              <!-- Order Items -->
              <div class="space-y-3 mb-4">
                <div v-for="line in order.lines.slice(0, 3)" :key="line.id" class="flex items-center space-x-3">
                  <div class="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center">
                    <img v-if="line.featuredAsset && line.featuredAsset.preview" :src="line.featuredAsset.preview"
                      :alt="line.productVariant.name" class="w-full h-full object-cover rounded-md" />
                    <div v-else class="text-gray-400 text-xs">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 break-words hyphens-auto leading-relaxed">{{
                      line.productVariant.name }}</p>
                  </div>
                </div>
                <div v-if="order.lines.length > 3" class="text-xs text-gray-500 text-center">
                  +{{ order.lines.length - 3 }} {{ t('account.moreItems') }}
                </div>
              </div>

              <!-- Order Footer -->
              <div class="flex justify-between items-center pt-4 border-t border-gray-200">
                <div class="text-sm text-gray-600">
                  {{ t('account.total') }} <span class="font-semibold text-gray-900">{{
                    formatCurrency(order.totalWithTax,
                      order.currencyCode) }}</span>
                </div>
                <button @click="viewOrderDetails(order)"
                  class="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                  {{ t('account.viewDetails') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Addresses Tab -->
      <div v-if="activeTab === 'addresses'" class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-lg font-medium text-gray-900">{{ t('account.addressBook') }}</h2>
              <p class="text-sm text-gray-600 mt-1">{{ t('account.manageAddresses') }}</p>
            </div>
            <button v-if="!isAddingAddress" @click="startAddAddress"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              {{ t('account.add') }}
            </button>
          </div>
        </div>

        <div class="p-6">
          <!-- Loading State -->
          <div v-if="addressesLoading" class="flex items-center justify-center py-8">
            <div class="text-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p class="mt-4 text-gray-600">{{ t('account.loadingAddresses') }}</p>
            </div>
          </div>

          <!-- Add/Edit Address Form -->
          <div v-else-if="isAddingAddress" class="max-w-4xl mx-auto">
            <div class="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 class="text-lg font-medium text-gray-900 mb-6">
                {{ editingAddress ? t('account.edit') : t('account.add') }}
              </h3>

              <div class="space-y-6">
                <!-- Full Name -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('account.fullName') }}</label>
                  <input type="text" v-model="addressForm.fullName" required
                    class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    :placeholder="t('account.enterFullName')" />
                </div>

                <!-- Address (Combined) -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('account.address') }}</label>
                  <textarea v-model="addressForm.address" rows="8" required
                    class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm resize-none"
                    :placeholder="t('account.enterFullAddress')" />
                </div>

                <!-- Country -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('account.country') }}</label>
                  <select v-model="addressForm.country" required
                    class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                    <option v-for="country in countries" :key="country.code" :value="country.code">
                      {{ country.name }}
                    </option>
                  </select>
                </div>

                <!-- Phone Number -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('account.phoneNumber') }}</label>
                  <input type="tel" v-model="addressForm.phoneNumber" required
                    class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    :placeholder="t('account.enterPhoneNumber')" />
                </div>

                <!-- Default Address Options -->
                <div>
                  <div class="flex space-x-6">
                    <div class="flex items-center">
                      <input type="checkbox" v-model="addressForm.defaultShippingAddress" id="defaultShippingAddress"
                        class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
                      <label for="defaultShippingAddress" class="ml-2 block text-sm text-gray-900">
                        {{ t('account.defaultShipping') }}
                      </label>
                    </div>
                    <div class="flex items-center">
                      <input type="checkbox" v-model="addressForm.defaultBillingAddress" id="defaultBillingAddress"
                        class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
                      <label for="defaultBillingAddress" class="ml-2 block text-sm text-gray-900">
                        {{ t('account.defaultBilling') }}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex gap-4 mt-8">
                <button @click="saveAddress"
                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {{ editingAddress ? t('common.update') : t('account.save') }}
                </button>
                <button @click="cancelAddressEdit"
                  class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {{ t('account.cancel') }}
                </button>
              </div>
            </div>
          </div>

          <!-- Address List -->
          <div v-else>
            <!-- Empty State -->
            <div v-if="addresses.length === 0" class="text-center py-12">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">{{ t('account.noAddresses') }}</h3>
              <p class="mt-1 text-sm text-gray-500">{{ t('account.addFirstAddress') }}</p>
              <button @click="startAddAddress"
                class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                {{ t('account.addFirstAddressBtn') }}
              </button>
            </div>

            <!-- Address Cards -->
            <div v-else class="grid gap-6 md:grid-cols-2">
              <div v-for="address in addresses" :key="address.id"
                class="bg-gray-50 rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <!-- Address Header -->
                <div class="flex justify-between items-start mb-4">
                  <h3 class="text-lg font-medium text-gray-900">
                    {{ address.fullName }}
                  </h3>
                  <div class="flex space-x-2">
                    <button @click="startEditAddress(address)"
                      class="p-2 text-gray-400 hover:text-gray-600 transition-colors" :title="t('account.editAddress')">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button @click="confirmDeleteAddress(address.id)"
                      class="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      :title="t('account.deleteAddress')">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Address Details -->
                <div class="space-y-2 text-sm text-gray-600">
                  <p>{{ address.address || address.streetLine1 }}</p>
                  <p>{{ getCountryName(address.countryCode) || address.countryCode }}</p>
                  <p v-if="address.phoneNumber">{{ t('account.phone') }} {{ address.phoneNumber }}</p>
                </div>

                <!-- Default Address Badges -->
                <div class="flex flex-wrap gap-2 mt-4">
                  <span v-if="address.defaultShippingAddress"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {{ t('account.shippingAddress') }}
                  </span>
                  <span v-if="address.defaultBillingAddress"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {{ t('account.billingAddress') }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>

  <!-- Delete Confirmation Modal -->
  <div v-if="showDeleteModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <!-- Warning Icon -->
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
          <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        <!-- Modal Content -->
        <div class="text-center mt-4">
          <h3 class="text-lg font-medium text-gray-900">{{ t('account.deleteAddressConfirm') }}</h3>
          <p class="text-sm text-gray-500 mt-2">
            {{ t('account.deleteAddressMessage') }}
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-4 mt-6">
          <button @click="deleteAddress"
            class="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {{ t('account.delete') }}
          </button>
          <button @click="closeDeleteModal"
            class="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            {{ t('account.cancel') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '../stores/app'
import { useRouter, useRoute } from 'vue-router'
import { hasToken } from '../utils/auth'
import {
  updateCustomerMutation,
  updateCustomerPasswordMutation,
  getActiveCustomerOrdersQuery,
  getCustomerAddressesQuery,
  createCustomerAddressMutation,
  updateCustomerAddressMutation,
  deleteCustomerAddressMutation
} from '../providers/shop/customer/customer'
import { COUNTRIES, getCountryName } from '../config/countries'

export default {
  name: 'Account',

  setup() {
    const { t } = useI18n()
    const appStore = useAppStore()
    const router = useRouter()

    const activeTab = ref('profile')

    // Check for tab query parameter from URL
    const route = useRoute()
    const isEditing = ref(false)
    const showPassword = ref(false)
    const passwordError = ref('')
    const passwordSuccess = ref(false)
    const isLoading = ref(true)
    const orders = ref([])
    const ordersLoading = ref(false)
    const addresses = ref([])
    const addressesLoading = ref(false)
    const isAddingAddress = ref(false)
    const editingAddress = ref(null)
    const showDeleteModal = ref(false)
    const addressToDelete = ref(null)
    const addressForm = reactive({
      fullName: '',
      address: '',
      country: 'CN',
      phoneNumber: '',
      defaultShippingAddress: true,
      defaultBillingAddress: true
    })

    const countries = COUNTRIES

    const tabs = computed(() => [
      { id: 'profile', name: t('account.profile') },
      { id: 'orders', name: t('account.purchaseHistory') },
      { id: 'addresses', name: t('account.addresses') },
      { id: 'password', name: t('auth.password') }
    ])

    const editForm = reactive({
      title: '',
      firstName: '',
      lastName: '',
      phoneNumber: ''
    })

    const passwordForm = reactive({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })

    const customer = computed(() => appStore.customer)

    const customerInitials = computed(() => {
      // if (customer.value.firstName && customer.value.lastName) {
      // ${customer.value.firstName[0]}
      if (customer.value.lastName) {
        return `${customer.value.lastName[0]}`.toUpperCase()
      }
      if (customer.value.firstName) {
        return customer.value.firstName[0].toUpperCase()
      }
      return customer.value.emailAddress ? customer.value.emailAddress[0].toUpperCase() : 'U'
    })

    const displayName = computed(() => {
      if (customer.value.firstName && customer.value.lastName) {
        return `${customer.value.lastName}${customer.value.firstName}`
      }
      if (customer.value.firstName) {
        return customer.value.firstName
      }
      return customer.value.emailAddress || 'User'
    })

    const loadCustomerData = () => {
      editForm.title = customer.value.title || ''
      editForm.firstName = customer.value.firstName || ''
      editForm.lastName = customer.value.lastName || ''
      editForm.phoneNumber = customer.value.phoneNumber || ''
    }

    const saveProfile = async () => {
      try {
        // Prepare the update input
        const updateInput = {
          title: editForm.title,
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          phoneNumber: editForm.phoneNumber
        }

        // Call API to update customer on backend
        const result = await updateCustomerMutation(updateInput)

        if (result && result.id) {
          // Update customer data in store with the response from server
          appStore.setCustomer({
            title: result.title,
            firstName: result.firstName,
            lastName: result.lastName,
            emailAddress: result.emailAddress,
            phoneNumber: result.phoneNumber
          })

          isEditing.value = false
        } else {
          console.error('Error updating profile: Invalid response', result)
          // Handle error (could show error message to user)
        }
      } catch (error) {
        console.error('Error updating profile:', error)
      }
    }


    const cancelEdit = () => {
      loadCustomerData()
      isEditing.value = false
    }

    const updatePassword = async () => {
      passwordError.value = ''
      passwordSuccess.value = false

      // Validate passwords match
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        passwordError.value = t('account.passwordsNotMatch')
        return
      }

      // Validate password strength
      if (passwordForm.newPassword.length < 8) {
        passwordError.value = t('account.passwordMinLength')
        return
      }

      try {
        // Call API to update password on backend
        const result = await updateCustomerPasswordMutation(
          passwordForm.currentPassword,
          passwordForm.newPassword
        )

        if (result.__typename === 'Success') {
          passwordSuccess.value = true
          passwordForm.currentPassword = ''
          passwordForm.newPassword = ''
          passwordForm.confirmPassword = ''

          // Clear success message after 3 seconds
          setTimeout(() => {
            passwordSuccess.value = false
          }, 3000)
        } else {
          // Handle different error types
          switch (result.__typename) {
            case 'InvalidCredentialsError':
              passwordError.value = t('account.incorrectPassword')
              break
            case 'PasswordValidationError':
              passwordError.value = t('account.passwordRequirements')
              break
            case 'NativeAuthStrategyError':
              passwordError.value = t('account.cannotChangePassword')
              break
            default:
              passwordError.value = result.message || t('account.updatePasswordFailed')
          }
        }
      } catch (error) {
        passwordError.value = error.message || t('account.updatePasswordFailed')
      }
    }

    const togglePasswordVisibility = () => {
      showPassword.value = !showPassword.value
    }

    const loadOrders = async () => {
      ordersLoading.value = true
      try {
        const result = await getActiveCustomerOrdersQuery()
        // console.log('📋 Account page - Full API response:', result)

        if (result && result.orders) {
          // console.log('📋 Account page - All orders from API:', result.orders.items?.map(o => ({
          //   code: o.code,
          //   state: o.state,
          //   id: o.id
          // })))

          // Check if our target order is in the account page data
          const targetOrderInAccount = result.orders.items?.find(o => o.code === 'MXBZ5HDSELDA6DM6')
          // if (targetOrderInAccount) {
          //   // console.log('✅ Target order found in ACCOUNT PAGE data:', targetOrderInAccount)
          // } else {
          //   // console.log('❌ Target order NOT found in account page data either')
          // }

          // Filter orders: only PaymentSettled and Cancelled for purchase history
          const filtered = (result.orders.items || []).filter(order =>
            order.state?.toLowerCase() === 'paymentsettled' ||
            order.state?.toLowerCase() === 'cancelled'
          )
          orders.value = filtered
        }
      } catch (error) {
        console.error('Error loading orders:', error)
        orders.value = []
      } finally {
        ordersLoading.value = false
      }
    }

    const formatOrderDate = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    const formatOrderState = (state) => {
      const stateMap = {
        'AddingItems': t('orderStatus.addingItems'),
        'ArrangingPayment': t('orderStatus.paymentPending'),
        'PaymentAuthorized': t('orderStatus.paymentAuthorized'),
        'PaymentSettled': t('orderStatus.paymentSettled'),
        'PartiallyShipped': t('orderStatus.partiallyShipped'),
        'Shipped': t('orderStatus.shipped'),
        'PartiallyDelivered': t('orderStatus.partiallyDelivered'),
        'Delivered': t('orderStatus.delivered'),
        'Cancelled': t('orderStatus.cancelled')
      }
      return stateMap[state] || state
    }

    const getOrderStatusClass = (state) => {
      const statusClasses = {
        'AddingItems': 'bg-yellow-100 text-yellow-800',
        'ArrangingPayment': 'bg-blue-100 text-blue-800',
        'PaymentAuthorized': 'bg-green-100 text-green-800',
        'PaymentSettled': 'bg-green-100 text-green-800',
        'PartiallyShipped': 'bg-purple-100 text-purple-800',
        'Shipped': 'bg-purple-100 text-purple-800',
        'PartiallyDelivered': 'bg-indigo-100 text-indigo-800',
        'Delivered': 'bg-indigo-100 text-indigo-800',
        'Cancelled': 'bg-red-100 text-red-800'
      }
      return statusClasses[state] || 'bg-gray-100 text-gray-800'
    }

    // const formatCurrency = (amount, currencyCode) => {
    //   if (!amount || !currencyCode) return 'N/A'
    //   return new Intl.NumberFormat('en-US', {
    //     style: 'currency',
    //     currency: currencyCode
    //   }).format(amount / 100) // Assuming amount is in cents
    // }

    const formatCurrency = (amount, currencyCode) => {
      if (!amount || !currencyCode) return 'N/A'
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode
      }).format(amount / 100)

      return formatted.replace(/^(\D+)(\d)/, '$1 $2')
    }

    const viewOrderDetails = (order) => {
      // Navigate to order details page
      router.push(`/account/orders/${order.code}`)
    }

    const loadAddresses = async () => {
      addressesLoading.value = true
      try {
        const addressesData = await getCustomerAddressesQuery()
        addresses.value = addressesData
      } catch (error) {
        console.error('Error loading addresses:', error)
        addresses.value = []
      } finally {
        addressesLoading.value = false
      }
    }

    const startAddAddress = () => {
      resetAddressForm()
      isAddingAddress.value = true
      editingAddress.value = null
    }

    const startEditAddress = (address) => {
      editingAddress.value = address
      isAddingAddress.value = true
      addressForm.fullName = address.fullName || ''
      // Combine existing address fields into single field
      const addressParts = []
      if (address.streetLine1) addressParts.push(address.streetLine1)
      if (address.city) addressParts.push(address.city)
      if (address.province) addressParts.push(address.province)
      addressForm.address = address.address || addressParts.join(', ') || ''
      addressForm.country = address.country?.code || 'CN'
      addressForm.phoneNumber = address.phoneNumber || ''
      addressForm.defaultShippingAddress = address.defaultShippingAddress || false
      addressForm.defaultBillingAddress = address.defaultBillingAddress || false
    }

    const resetAddressForm = () => {
      addressForm.fullName = ''
      addressForm.address = ''
      addressForm.country = 'TH'
      addressForm.phoneNumber = ''
      addressForm.defaultShippingAddress = true
      addressForm.defaultBillingAddress = true
    }

    const saveAddress = async () => {
      try {
        // Transform the address form data to match GraphQL input requirements
        const addressInput = {
          fullName: addressForm.fullName,
          streetLine1: addressForm.address, // Store full address in streetLine1
          city: '',
          province: '',
          countryCode: addressForm.country,
          phoneNumber: addressForm.phoneNumber,
          defaultShippingAddress: addressForm.defaultShippingAddress,
          defaultBillingAddress: addressForm.defaultBillingAddress
        }

        let updatedAddress

        if (editingAddress.value) {
          // Update existing address
          const updateInput = {
            id: editingAddress.value.id,
            ...addressInput
          }
          updatedAddress = await updateCustomerAddressMutation(updateInput)

          // Update local state with the response from server
          const index = addresses.value.findIndex(addr => addr.id === editingAddress.value.id)
          if (index !== -1) {
            addresses.value[index] = updatedAddress
          }
        } else {
          // Create new address
          updatedAddress = await createCustomerAddressMutation(addressInput)
          addresses.value.push(updatedAddress)
        }

        // If this address is set as default, update other addresses
        if (addressForm.defaultShippingAddress || addressForm.defaultBillingAddress) {
          await updateDefaultAddresses(updatedAddress)
        }

        isAddingAddress.value = false
        editingAddress.value = null
        resetAddressForm()
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } catch (error) {
        console.error('Error saving address:', error)
        alert(t('account.saveAddressFailed'))
      }
    }

    const cancelAddressEdit = () => {
      isAddingAddress.value = false
      editingAddress.value = null
      resetAddressForm()
    }

    const confirmDeleteAddress = (addressId) => {
      addressToDelete.value = addressId
      showDeleteModal.value = true
    }

    const deleteAddress = async () => {
      if (!addressToDelete.value) return

      try {
        await deleteCustomerAddressMutation(addressToDelete.value)
        addresses.value = addresses.value.filter(addr => addr.id !== addressToDelete.value)
        closeDeleteModal()
      } catch (error) {
        console.error('Error deleting address:', error)
        closeDeleteModal()
        // Show error message (could be enhanced with a toast notification)
        alert(t('account.deleteAddressFailed'))
      }
    }

    const closeDeleteModal = () => {
      showDeleteModal.value = false
      addressToDelete.value = null
    }


    const updateDefaultAddresses = async (newDefaultAddress) => {
      try {
        // Update other addresses to remove default status if needed
        const updates = []

        for (const address of addresses.value) {
          if (address.id === newDefaultAddress.id) continue // Skip the new default address

          const updateData = {}
          let needsUpdate = false

          // If new address is default shipping, remove default shipping from others
          if (newDefaultAddress.defaultShippingAddress && address.defaultShippingAddress) {
            updateData.defaultShippingAddress = false
            needsUpdate = true
          }

          // If new address is default billing, remove default billing from others
          if (newDefaultAddress.defaultBillingAddress && address.defaultBillingAddress) {
            updateData.defaultBillingAddress = false
            needsUpdate = true
          }

          if (needsUpdate) {
            // Update the address on backend
            const updateInput = {
              id: address.id,
              ...updateData
            }
            updates.push(updateCustomerAddressMutation(updateInput))

            // Update local state immediately
            const index = addresses.value.findIndex(addr => addr.id === address.id)
            if (index !== -1) {
              addresses.value[index] = {
                ...addresses.value[index],
                ...updateData
              }
            }
          }
        }

        // Wait for all updates to complete
        if (updates.length > 0) {
          await Promise.all(updates)
        }
      } catch (error) {
        console.error('Error updating default addresses:', error)
        // Don't show error to user as this is a background operation
      }
    }

    onMounted(async () => {
      // First verify token effectiveness if we have a token
      if (hasToken()) {
        await appStore.verifyTokenEffectiveness()
      }

      // Redirect to sign-in if not authenticated after verification
      if (!appStore.isLoggedIn) {
        router.push('/sign-in')
        return
      }

      // Check for tab query parameter and set active tab
      const tabQuery = route.query.tab
      if (tabQuery && tabs.value.some(tab => tab.id === tabQuery)) {
        activeTab.value = tabQuery
      }

      loadCustomerData()
      isLoading.value = false
    })

    // Watch for tab changes to load data when tabs are selected
    watch(activeTab, (newTab) => {
      if (newTab === 'orders' && orders.value.length === 0) {
        loadOrders()
      }
      if (newTab === 'addresses' && addresses.value.length === 0) {
        loadAddresses()
      }
    })

    return {
      t,
      activeTab,
      isEditing,
      showPassword,
      passwordError,
      passwordSuccess,
      isLoading,
      orders,
      ordersLoading,
      addresses,
      addressesLoading,
      isAddingAddress,
      editingAddress,
      addressForm,
      countries,
      tabs,
      editForm,
      passwordForm,
      customer,
      customerInitials,
      displayName,
      saveProfile,
      cancelEdit,
      updatePassword,
      togglePasswordVisibility,
      formatOrderDate,
      formatOrderState,
      getOrderStatusClass,
      formatCurrency,
      viewOrderDetails,
      startAddAddress,
      startEditAddress,
      saveAddress,
      cancelAddressEdit,
      deleteAddress,
      getCountryName,
      updateDefaultAddresses,
      showDeleteModal,
      addressToDelete,
      confirmDeleteAddress,
      closeDeleteModal
    }
  }
}
</script>
