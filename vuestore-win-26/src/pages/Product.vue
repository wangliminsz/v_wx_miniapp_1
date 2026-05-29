<template>
  <div class="min-h-screen bg-gray-50 w-full">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>

    <!-- Product Content -->
    <div v-else-if="product" class="max-w-6xl mx-auto px-4 py-10">
      <!-- Breadcrumbs -->
      <div class="mb-8">
        <nav class="flex space-x-2 text-sm text-gray-500">
          <router-link to="/" class="hover:text-gray-700">Home</router-link>
          <span>/&nbsp;&nbsp;</span>
          <template v-if="product.collections && product.collections.length > 0">
            <!-- Mobile: Show first collection with ellipsis if more than 1 -->
            <div v-if="isMobile" class="contents">
              <router-link :to="`/collections/${product.collections[0].slug}`" class="hover:text-gray-700">
                {{ truncateText(product.collections[0].name, 4) }}
              </router-link>
              <span v-if="product.collections.length > 1">...</span>
            </div>
            <!-- Desktop: Show collections grouped together with spaces -->
            <div v-else class="contents">
              <span v-for="(collection, index) in truncatedCollections" :key="collection.id">
                <router-link :to="`/collections/${collection.slug}`" class="hover:text-gray-700">
                  {{ collection.name }}
                </router-link>
                <span v-if="index < truncatedCollections.length - 1" class="mx-1"> </span>
              </span>
              <span v-if="shouldShowCollectionEllipsis" class="mr-1">...</span>
            </div>
            <span>/</span>
          </template>
          <span class="text-gray-900 font-medium">
            <span v-if="isMobile">{{ truncateText(product.name, 8) }}</span>
            <span v-else>{{ truncateText(product.name, 15) }}</span>
          </span>
        </nav>
      </div>



      <div class="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start mt-4 md:mt-12">


        <!-- Product Details -->
        <div class="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0 space-y-6 ">
          <!-- Product Title -->
          <!-- <div class="max-w-full md:max-w-4xl lg:max-w-5xl mx-auto pr-2">
            <h1
              class="sm:text-2xl font-light tracking-tight text-gray-900 mb-2 max-w-xl md:max-w-4xl lg:max-w-5xl mx-auto">
              {{ product.name }}
            </h1>
          </div> -->

          <div class="w-full max-w-5xl mx-auto"> <!-- single source of truth for width & centering -->

            <h1
              class="text-xl sm:text-2xl md:text-2.5xl font-medium tracking-tight text-gray-900 leading-tight mb-3 break-words hyphens-auto overflow-hidden  text-ellipsis line-clamp-4"
              :title="product.name">
              {{ product.name }}
            </h1>

          </div>

          <!-- Manufacturer Tag and Story Link -->
          <div class="flex flex-wrap items-center justify-between gap-2 mb-4 mr-4">
            <span v-for="facetValue in product.facetValues.filter(fv => fv.facet?.name === '生产厂家')" :key="facetValue.id"
              class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700">
              <svg class="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {{ facetValue.name }}
            </span>

            <router-link v-if="hasStory" :to="`/blog/${product.slug}`" target="_blank" rel="noopener noreferrer"
              class="inline-flex items-center text-sm sm:text-sm text-blue-600 hover:text-blue-700 underline underline-offset-2 transition-colors dark:text-blue-400 dark:hover:text-blue-300">
              产品资讯
            </router-link>
          </div>


          <!-- Price -->
          <div v-if="selectedVariant" class="text-2xl mt-2 mb-2 text-red-700">
            <div class="flex flex-row items-center space-x-4">
              <div>
                <PriceDisplay :price="selectedVariant.priceWithTax" :currencyCode="selectedVariant.currencyCode" />
              </div>
              <!-- SKU and Stock Status -->
              <!-- <div v-if="selectedVariant" class="mt-1 mb-6"> -->
              <div class="text-gray-600">
                <div class="flex items-center space-x-4">
                  <div v-if="selectedVariant.sku" class="text-sm text-muted-foreground">
                    SKU: {{ selectedVariant.sku }}
                  </div>
                  <div class="text-sm font-medium">
                    <span v-if="isInStock" class="text-green-600">In Stock</span>
                    <span v-else class="text-red-600">Out of Stock</span>
                  </div>
                </div>

                <!-- Variant Facet Values -->
                <div v-if="selectedVariant.facetValues && selectedVariant.facetValues.length > 0"
                  class="text-sm text-muted-foreground">
                  {{selectedVariant.facetValues.map(fv => `${fv.facet.name}: ${fv.name}`).join(' • ')}}
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="product?.variants && product.variants.length > 1" class="text-2xl mt-2 mb-2 text-red-700">

            <div class="flex flex-row items-center space-x-4">
              <div>
                <span v-html="formatPriceRange(product.variants)"></span>
              </div>

              <div class="text-gray-600 text-sm text-muted-foreground">
                请选择规格
              </div>
            </div>




          </div>
          <div v-else-if="product?.variants && product.variants.length === 1" class="text-2xl mt-2 mb-2 text-red-700">
            <PriceDisplay :price="product.variants[0].priceWithTax" :currencyCode="product.variants[0].currencyCode" />
          </div>



          <!-- Product Description -->
          <!-- <div class="prose prose-sm max-w-none">
            <div v-html="product.description" />
          </div> -->

          <!-- Option Groups -->
          <div v-if="product.optionGroups && product.optionGroups.length > 0" class="space-y-4">
            <div v-for="optionGroup in product.optionGroups" :key="optionGroup.id" class="space-y-3">
              <!-- <label class="block text-base font-normal">{{ optionGroup.name }}</label> -->
              <!-- <div class="grid grid-cols-2 sm:grid-cols-3 gap-3"> -->
              <!-- <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"> -->
              <!-- or even -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div v-for="option in optionGroup.options.slice().sort((a, b) => a.id - b.id)" :key="option.id">
                  <input :id="`${optionGroup.id}-${option.id}`" type="radio" :name="optionGroup.id" :value="option.id"
                    :checked="selectedOptions[optionGroup.id] === option.id"
                    @change="updateSelectedOption(optionGroup.id, option.id)" class="sr-only peer" />
                  <label :for="`${optionGroup.id}-${option.id}`"
                    class="text-sm flex items-center justify-center rounded-md border-2 border-gray-200 bg-white px-3 py-2 cursor-pointer peer-checked:border-primary-600 peer-checked:bg-primary-50 transition-colors">
                    {{ option.name }}
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- User Guide Memo - Medicine Purchase Guidelines -->
          <div
            class="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 space-y-4 shadow-sm">
            <!-- Warning Notices -->
            <div class="space-y-3">
              <div class="flex items-start gap-3">
                <span class="text-blue-600 dark:text-blue-400 font-semibold text-sm whitespace-nowrap">注意事项</span>
                <span
                  class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">由于药品的特殊性，除非有药品质量问题，否则签收后不可退换</span>
              </div>
              <div class="flex items-start gap-3">
                <span class="text-blue-600 dark:text-blue-400 font-semibold text-sm whitespace-nowrap">客户须知</span>
                <span
                  class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">物流时长1-2周，如遇海关查验可能会延长，同时请联系客服微信协助清关：{{
                    weixinAccountNumber }}</span>
              </div>
              <div class="flex items-start gap-3">
                <span class="text-blue-600 dark:text-blue-400 font-semibold text-sm whitespace-nowrap">消费敬告</span>
                <span class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">本网站药品说明书仅供参考，具体服用方法谨遵医嘱</span>
              </div>
            </div>

            <!-- Divider -->
            <div class="border-t border-gray-200 dark:border-gray-700"></div>

            <!-- Service Badges -->
            <!-- <div>
              <div class="flex items-center gap-2 mb-3">
                <span class="text-gray-900 dark:text-white font-semibold text-sm">商家服务</span>
              </div>
              <div class="flex flex-wrap gap-x-4 gap-y-2">
                <div class="flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="text-gray-600 dark:text-gray-300 text-sm">实体药房，正品保障</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="text-gray-600 dark:text-gray-300 text-sm">境外直邮，全球速递</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="text-gray-600 dark:text-gray-300 text-sm">中文客服，购药无忧</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="text-gray-600 dark:text-gray-300 text-sm">保护隐私，安全放心</span>
                </div>
              </div>
            </div> -->
          </div>

          <!-- The Story Link (only if product has a story) -->
          <!-- <div v-if="hasStory" class="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 class="text-lg font-semibold text-blue-900 mb-2">Discover the Full Story</h3>
            <p class="text-blue-700 mb-4">Learn more about this product in our detailed article.</p>
            <router-link :to="`/blog/${product.slug}`"
              class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Read the Story
            </router-link>
          </div> -->

          <!-- Available Variants -->
          <!-- font-semibold -->
          <!-- <div
            v-if="product.variants && (product.variants.length > 1 || (product.optionGroups && product.optionGroups.length > 0))"
            class="mt-6">
            <h3 class="text-lg text-gray-900 mb-3">Available Variants</h3>
            <div class="text-sm text-gray-600">
              {{product.variants.slice().sort((a, b) => a.id - b.id).map(variant =>
                getVariantDisplayName(variant)).join('•')}}
            </div>
          </div> -->



          <!-- Add to Cart -->
          <div class="pt-4">
            <button @click="debouncedAddToCart"
              :disabled="!selectedVariant || isAddingToCart || quantityInCart > 7 || isOutOfStock"
              class="w-full flex items-center justify-center px-8 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
              <svg v-if="isAddingToCart" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
              <svg v-else-if="quantityInCart > 0" class="w-5 h-5 mr-2" fill="none" stroke="currentColor"
                viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <svg v-else class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>
                {{ isAddingToCart
                  ? 'Adding...'
                  : quantityInCart > 0
                    ? `${quantityInCart} in cart`
                    : !selectedVariant && product?.optionGroups?.length > 0
                      ? '请选择规格'
                      : isOutOfStock
                        ? 'Out of Stock'
                        : '加入购物车' }}
              </span>
            </button>

            <!-- Wishlist Button -->
            <!-- <button
                type="button"
                class="ml-4 py-3 px-3 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-500"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span class="sr-only">Add to favorites</span>
              </button> -->
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="addToCartError" class="mt-4">
          <div class="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-md text-sm">
            {{ addToCartError }}
          </div>
        </div>


        <!-- Product Images -->
        <!-- <div class="sm: mt-12"></div> -->

        <div class="sm: mt-12 w-full max-w-2xl mx-auto sm:block lg:max-w-none">
          <div class="rounded-md overflow-hidden">
            <!-- Main Image -->
            <div class="h-[400px] w-full md:w-[400px] mx-auto relative">
              <img v-if="currentImage" :src="currentImage.preview + '?w=400&h=400&format=webp'"
                :alt="`Image of: ${currentImage.name}`"
                class="object-center object-cover rounded-lg mx-auto w-full h-full" />
              <div v-else class="bg-gray-100 rounded-lg h-full w-full flex items-center justify-center">
                <div class="text-center text-gray-400">
                  <svg class="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>No image available</p>
                </div>
              </div>

              <!-- Navigation Arrows -->
              <div v-if="variantImages.length > 1" class="absolute bottom-4 right-12 sm:right-16 flex space-x-2">
                <button @click="goToPreviousImage"
                  class="bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-colors">
                  <svg class="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button @click="goToNextImage"
                  class="bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-colors">
                  <svg class="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Thumbnail Images -->
            <div v-if="variantImages.length > 1"
              class="w-full md:w-[400px] mt-10 my-2 flex flex-wrap gap-3 justify-center mx-auto">
              <div v-for="asset in variantImages" :key="asset.id" @click="currentImage = asset" :class="[
                'cursor-pointer border-2 rounded-lg overflow-hidden',
                currentImage.id === asset.id ? 'border-primary-600' : 'border-transparent'
              ]">
                <img :src="asset.preview + '?w=80&h=80&format=webp'" :alt="`Image of: ${asset.name}`"
                  class="w-20 h-20 object-cover object-center" />
              </div>
            </div>
          </div>
        </div>

        <!-- Shipping & Returns -->
        <!-- <section class="mt-12 pt-12 border-t text-xs">
          <h3 class="text-gray-600 font-bold mb-2">Shipping & Returns</h3>
          <div class="text-gray-500 space-y-1">
            <p>Standard shipping: 3 - 5 working days. Express shipping: 1 - 3 working days.</p>
            <p>Shipping costs depend on delivery address and will be calculated during checkout.</p>
            <p>Returns are subject to terms. Please see the <span class="underline cursor-pointer">returns page</span>
              for
              further information.</p>
          </div>
        </section> -->

      </div>

      <!-- Product Tabs Section -->
      <div class="mt-12 max-w-6xl mx-auto px-4">
        <!-- Tab Navigation -->
        <div class="border-b border-gray-200 dark:border-gray-700">
          <nav class="flex space-x-8" aria-label="Tabs">
            <button @click="activeTab = 'description'" :class="[
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200',
              activeTab === 'description'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            ]">
              药品说明
            </button>
            <button @click="activeTab = 'related'" :class="[
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200',
              activeTab === 'related'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            ]">
              相关资讯
            </button>
          </nav>
        </div>

        <!-- Tab Content -->
        <div
          class="mt-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 overflow-hidden">
          <!-- Medicine Description Tab -->
          <div v-if="activeTab === 'description'" class="p-6">

            <!-- {{ product.description }} -->
            <div v-if="product.description" v-html="unescapedDescription"
              style="line-height: 180%; letter-spacing: 0.5px;"
              class="prose prose-sm max-w-none dark:prose-invert text-gray-700 dark:text-gray-300 leading-relaxed break-words overflow-x-auto">
            </div>
            <div v-else class="text-gray-500 dark:text-gray-400 text-center py-8">
              暂无药品说明
            </div>
          </div>

          <!-- Related Information Tab -->
          <div v-if="activeTab === 'related'" class="p-6">
            <div v-if="relatedArticlesLoading" class="flex items-center justify-center py-12">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span class="ml-3 text-gray-500 dark:text-gray-400">加载中...</span>
            </div>
            <div v-else-if="relatedArticles.length > 0" class="space-y-4">
              <router-link v-for="article in relatedArticles" :key="article.id" :to="`/blog/${article.slug}`"
                target="_blank"
                class="block bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-5 transition-colors border border-gray-200 dark:border-gray-600">
                <div class="flex items-start gap-4">
                  <div v-if="article.thumbnail" class="flex-shrink-0">
                    <img :src="article.thumbnail.url" :alt="article.title" class="w-20 h-20 object-cover rounded-md" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {{ article.title }}
                    </h3>
                    <p v-if="article.excerpt" class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                      {{ article.excerpt }}
                    </p>
                    <div class="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
                      <span v-if="article.createdAt">
                        {{ new Date(article.createdAt).toLocaleDateString('zh-CN') }}
                      </span>
                      <span v-if="article.readingTime" class="flex items-center gap-1">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {{ article.readingTime }}
                      </span>
                    </div>
                  </div>
                </div>
              </router-link>
            </div>
            <div v-else class="text-gray-500 dark:text-gray-400 text-center py-8">
              暂无相关资讯
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>

  <!-- Mobile Scroll to Top Button -->
  <button v-if="showScrollToTop" @click="scrollToTop"
    class="lg:hidden fixed bottom-20 right-4 z-40 w-8 h-8 bg-transparent border border-gray-500 text-gray-600 rounded-full shadow-sm hover:border-gray-600 hover:text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all duration-200 flex items-center justify-center touch-manipulation opacity-80 hover:opacity-100">
    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
  </button>

  <!-- Product Not Found -->
  <!-- <div v-else class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.88-6.09-2.32" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">Product not found</h3>
      <p class="mt-1 text-sm text-gray-500">The product you're looking for doesn't exist.</p>
      <div class="mt-6">
        <router-link to="/"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700">
          Go back home
        </router-link>
      </div>
    </div>
  </div> -->
  <!-- </div> -->
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '../stores/app'
import { getProductBySlug, getProductById } from '../providers/shop/products/products'
import { addItemToOrderMutation, getActiveOrderQuery } from '../providers/shop/orders/order'

import PriceDisplay from '../components/PriceDisplay.vue'

export default {
  name: 'Product',
  components: {
    PriceDisplay
  },

  setup() {
    const route = useRoute()
    const appStore = useAppStore()

    const product = ref(null)
    const isLoading = ref(true)
    const currentImage = ref(null)
    const selectedOptions = ref({})
    const isAddingToCart = ref(false)
    const addToCartError = ref('')
    const hasStory = ref(false)
    const activeTab = ref('description') // 'description' or 'related'
    const showScrollToTop = ref(false) // Mobile scroll to top button visibility

    // Simple debounce function to prevent multiple rapid clicks
    function debounce(func, wait) {
      let timeout
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout)
          func(...args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
      }
    }



    const selectedVariant = computed(() => {
      if (!product.value || !product.value.variants) return null

      // If no option groups or only one variant, return the first variant
      if (!product.value.optionGroups || product.value.optionGroups.length === 0) {
        return product.value.variants.length > 0 ? product.value.variants[0] : null
      }

      // If not all option groups have a selection, return null
      if (Object.keys(selectedOptions.value).length !== product.value.optionGroups.length) {
        return null
      }

      // Find variant that matches all selected options
      return product.value.variants.find((variant) => {
        const variantOptionIds = variant.options?.map((opt) => opt.id) || []
        const selectedOptionIds = Object.values(selectedOptions.value)
        return selectedOptionIds.every((optId) => variantOptionIds.includes(optId))
      })
    })

    const variantImages = computed(() => {
      if (selectedVariant.value) {
        // Priority: variant.featuredAsset + variant.assets → variant.assets → product.assets
        const variantFeaturedAsset = selectedVariant.value.featuredAsset
        const variantAssets = selectedVariant.value.assets || []
        const productAssets = product.value?.assets || []

        if (variantFeaturedAsset && variantAssets.length > 0) {
          // Combine featured asset with variant assets (remove duplicates)
          const allVariantImages = [variantFeaturedAsset, ...variantAssets]
          // Remove duplicates by id
          return allVariantImages.filter((asset, index, self) =>
            index === self.findIndex(a => a.id === asset.id)
          )
        } else if (variantFeaturedAsset) {
          return [variantFeaturedAsset]
        } else if (variantAssets.length > 0) {
          return variantAssets
        } else if (productAssets.length > 0) {
          return productAssets
        }
      }
      // Fallback to product assets
      return product.value?.assets || []
    })

    const quantityInCart = computed(() => {
      if (!selectedVariant.value || !appStore.activeOrder?.lines) return 0
      const orderLine = appStore.activeOrder.lines.find(
        line => line.productVariant.id === selectedVariant.value.id
      )
      return orderLine?.quantity || 0
    })

    const isOutOfStock = computed(() => {
      if (!selectedVariant.value) return false

      const stockLevel = selectedVariant.value.stockLevel
      // console.log('Stock level for variant:', selectedVariant.value.name, 'is:', stockLevel, 'type:', typeof stockLevel)

      // Handle both numeric and string stock levels
      if (typeof stockLevel === 'number') {
        return stockLevel <= 0
      } else if (typeof stockLevel === 'string') {
        // Consider it out of stock only if explicitly OUT_OF_STOCK
        return stockLevel === 'OUT_OF_STOCK'
      }
      return false
    })

    const isInStock = computed(() => {
      return selectedVariant.value && !isOutOfStock.value
    })

    const loadProduct = async () => {
      try {
        isLoading.value = true
        const { slug } = route.params

        // Use slug parameter for product fetching
        if (!slug) {
          throw new Error('No product identifier provided')
        }

        const productData = await getProductBySlug(slug)

        if (productData) {
          product.value = productData

          // // Debug logging for Available Variants issue
          // console.log('🔍 Product loaded:', productData.name)
          // console.log('🔍 Product variants:', productData.variants)
          // console.log('🔍 Product variants length:', productData.variants?.length)
          // console.log('🔍 Product optionGroups:', productData.optionGroups)
          // console.log('🔍 Product optionGroups length:', productData.optionGroups?.length)
          // console.log('🔍 Available Variants condition met:', productData.variants && (productData.variants.length > 1 || (productData.optionGroups && productData.optionGroups.length > 0)))

          // Set initial image
          if (productData.assets && productData.assets.length > 0) {
            currentImage.value = productData.assets[0]
          } else if (productData.featuredAsset) {
            currentImage.value = productData.featuredAsset
          }

          // Initialize selected options (no initial selection, user must choose)
          selectedOptions.value = {}

          // Auto-select options if there's only one variant with option groups
          if (productData.optionGroups && productData.optionGroups.length > 0 &&
            productData.variants && productData.variants.length === 1) {
            const singleVariant = productData.variants[0]
            if (singleVariant.options && singleVariant.options.length > 0) {
              // Map variant options to selectedOptions format
              singleVariant.options.forEach(option => {
                // Find which option group this option belongs to
                const optionGroup = productData.optionGroups.find(group =>
                  group.options.some(opt => opt.id === option.id)
                )
                if (optionGroup) {
                  selectedOptions.value[optionGroup.id] = option.id
                }
              })
            }
          }

          // Check if product has a story
          if (productData.slug) {
            checkStoryExists(productData.slug)
          }

          // Fetch related articles
          if (productData.id) {
            fetchRelatedArticles(productData.id)
          }
        }
      } catch (error) {
        console.error('Error loading product:', error)
        product.value = null
      } finally {
        isLoading.value = false
      }
    }

    const addToCart = async () => {
      if (!selectedVariant.value || quantityInCart.value > 7 || isOutOfStock.value) return

      isAddingToCart.value = true
      addToCartError.value = ''

      try {
        // Check active order state before adding item
        const activeOrder = await getActiveOrderQuery()

        if (activeOrder) {
          // Check order state
          if (activeOrder.state !== 'AddingItems') {
            if (activeOrder.state === 'ArrangingPayment') {
              addToCartError.value = 'You already have an order awaiting payment. Please finish or cancel it.'
              isAddingToCart.value = false
              return
            }
            if (activeOrder.state === 'PaymentAuthorized') {
              addToCartError.value = 'This order is already authorized. Please create a new cart.'
              isAddingToCart.value = false
              return
            }
            // fallback
            addToCartError.value = `Order cannot be modified in state: ${activeOrder.state}`
            isAddingToCart.value = false
            return
          }
        }

        const result = await addItemToOrderMutation(selectedVariant.value.id, 1)

        if (result.__typename === 'Order') {
          appStore.setActiveOrder(result)
        } else {
          addToCartError.value = result.errorCode || 'Failed to add item to cart'
        }
      } catch (error) {
        console.error('Error adding to cart:', error)
        addToCartError.value = error.message || 'Failed to add item to cart'
      } finally {
        isAddingToCart.value = false
      }
    }

    // Create a debounced version of addToCart to prevent multiple concurrent requests
    const debouncedAddToCart = debounce(addToCart, 500)

    const updateSelectedOption = (groupId, optionId) => {
      selectedOptions.value = {
        ...selectedOptions.value,
        [groupId]: optionId
      }
    }

    const goToPreviousImage = () => {
      if (variantImages.value.length <= 1) return
      const currentIndex = variantImages.value.findIndex(img => img.id === currentImage.value.id)
      const previousIndex = currentIndex > 0 ? currentIndex - 1 : variantImages.value.length - 1
      currentImage.value = variantImages.value[previousIndex]
    }

    const goToNextImage = () => {
      if (variantImages.value.length <= 1) return
      const currentIndex = variantImages.value.findIndex(img => img.id === currentImage.value.id)
      const nextIndex = currentIndex < variantImages.value.length - 1 ? currentIndex + 1 : 0
      currentImage.value = variantImages.value[nextIndex]
    }

    const formatCurrency = (amount, currencyCode) => {
      if (!amount || !currencyCode) return 'N/A'
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode
      }).format(amount / 100)

      return formatted.replace(/^(\D+)(\d)/, '$1 $2')
    }

    // const formatCurrency = (amount) => {
    //   if (!amount) return 'N/A'
    //   const formatted = new Intl.NumberFormat('en-US', {
    //     style: 'currency',
    //     currency: channelCurrency.value
    //   }).format(amount / 100)

    //   // Insert a space after the currency symbol if missing 
    //   return formatted.replace(/^(\D+)(\d)/, '$1 $2')

    // }

    const formatPriceRange = (variants) => {
      if (!variants || variants.length === 0) return 'N/A'

      const prices = variants.map(v => v.priceWithTax).filter(price => price != null)
      if (prices.length === 0) return 'N/A'

      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)
      const currencyCode = variants[0].currencyCode

      const showCny = import.meta.env.VITE_SHOW_CNY_AMOUNT === 'true' && (currencyCode === 'THB' || currencyCode === 'USD')
      const cnyRate = currencyCode === 'THB' ? (appStore.thbRates?.CNY || 0) : (appStore.usdRates?.CNY || 0)

      if (minPrice === maxPrice) {
        const thbPrice = formatCurrency(minPrice, currencyCode)
        if (showCny && cnyRate) {
          const cnyPriceRaw = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'CNY'
          }).format((minPrice / 100) * cnyRate)
          // Format CNY with space between symbol and number
          const cnySymbolMatch = cnyPriceRaw.match(/^([^\d]+)(.+)$/)
          const cnyCurrencySymbol = cnySymbolMatch ? cnySymbolMatch[1] : 'CN¥'
          const cnyNumeric = cnySymbolMatch ? cnySymbolMatch[2] : cnyPriceRaw
          const cnyPrice = `${cnyCurrencySymbol} ${cnyNumeric}`
          return `<span class="whitespace-nowrap">${thbPrice}</span><br><span class="text-sm text-gray-500">≈ ${cnyPrice}</span>`
        }
        return thbPrice
      } else {
        const thbMin = formatCurrency(minPrice, currencyCode)
        const thbMax = formatCurrency(maxPrice, currencyCode)
        // Extract currency symbol and numeric parts (handle different currency formats)
        const thbMinParts = thbMin.split(/\s+/)
        const currencySymbol = thbMinParts.length > 1 ? thbMinParts[0] : ''
        const thbMinNumeric = thbMinParts.length > 1 ? thbMinParts.slice(1).join(' ') : thbMin
        const thbMaxParts = thbMax.split(/\s+/)
        const thbMaxNumeric = thbMaxParts.length > 1 ? thbMaxParts.slice(1).join(' ') : thbMax
        const thbRange = `${currencySymbol} ${thbMinNumeric} - ${thbMaxNumeric}`
        if (showCny && cnyRate) {
          const cnyMin = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'CNY'
          }).format((minPrice / 100) * cnyRate)
          const cnyMax = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'CNY'
          }).format((maxPrice / 100) * cnyRate)
          // For CNY, extract symbol and number differently since it doesn't have spaces
          const cnySymbolMatch = cnyMin.match(/^([^\d]+)(.+)$/)
          const cnyCurrencySymbol = cnySymbolMatch ? cnySymbolMatch[1] : 'CN¥'
          const cnyMinNumeric = cnySymbolMatch ? cnySymbolMatch[2] : cnyMin
          const cnyMaxMatch = cnyMax.match(/^([^\d]+)(.+)$/)
          const cnyMaxNumeric = cnyMaxMatch ? cnyMaxMatch[2] : cnyMax
          const cnyRange = `≈ ${cnyCurrencySymbol} ${cnyMinNumeric} - ${cnyMaxNumeric}`
          return `<span class="whitespace-nowrap">${thbRange}</span><br><span class="text-sm text-gray-500">${cnyRange}</span>`
        }
        return thbRange
      }
    }

    const getVariantDisplayName = (variant) => {
      // If variant has a name, use it
      if (variant.name && variant.name.trim()) {
        return variant.name
      }

      // If no name, construct from options (e.g., "13英寸/8GB/512GB")
      if (variant.options && variant.options.length > 0) {
        return variant.options.map(option => option.name).join('/')
      }

      // Fallback to variant ID or generic name
      return `Variant ${variant.id}`
    }

    const getStockLevelText = (stockLevel) => {
      if (typeof stockLevel === 'number') {
        if (stockLevel > 10) return 'In stock'
        if (stockLevel > 0) return `${stockLevel} left in stock`
        return 'Out of stock'
      } else if (typeof stockLevel === 'string') {
        if (stockLevel === 'IN_STOCK' || stockLevel === 'LOW_STOCK') return 'In stock'
        if (stockLevel === 'OUT_OF_STOCK') return 'Out of stock'
        return stockLevel // fallback
      }
      return 'Unknown'
    }

    const checkStoryExists = async (productSlug) => {
      try {
        const response = await fetch(`${import.meta.env.VITE_PAYLOAD_CMS_URL}/api/vendure-product?where[slug][equals]=${encodeURIComponent(productSlug)}&draft=false&limit=1`)
        if (response.ok) {
          const result = await response.json()
          const productStory = result.docs && result.docs.length > 0 ? result.docs[0] : null
          hasStory.value = productStory && productStory.richDescription && Object.keys(productStory.richDescription).length > 0
        }
      } catch (error) {
        console.error('Error checking story exists:', error)
        hasStory.value = false
      }
    }

    // Scroll to top functionality
    const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // Handle scroll events for mobile scroll-to-top button
    const handleScroll = () => {
      showScrollToTop.value = window.scrollY > 300 // Show after scrolling 300px
    }


    // Watch for route changes to load new product
    watch(() => route.params.slug, () => {
      loadProduct()
    })

    // Watch for variant changes to update images
    watch(selectedVariant, (newVariant) => {
      if (newVariant && variantImages.value.length > 0) {
        currentImage.value = variantImages.value[0]
      }
    })

    // Check if device is mobile (reactive)
    const isMobile = ref(window.innerWidth < 768)

    // Update mobile state on window resize
    const updateMobileState = () => {
      isMobile.value = window.innerWidth < 768
    }

    // Add resize listener
    onMounted(() => {
      loadProduct()
      window.addEventListener('resize', updateMobileState)
      window.addEventListener('scroll', handleScroll)
    })

    // Clean up resize listener
    onUnmounted(() => {
      window.removeEventListener('resize', updateMobileState)
      window.removeEventListener('scroll', handleScroll)
    })

    // Helper function to truncate text
    function truncateText(text, maxLength) {
      if (!text || text.length <= maxLength) return text
      return text.substring(0, maxLength) + '...'
    }

    // Truncated collections for desktop (show max 3 collections)
    const truncatedCollections = computed(() => {
      if (!product.value?.collections) return []
      const collections = product.value.collections
      return collections.slice(0, 3) // Show only first 3 collections on desktop
    })

    // Check if we should show ellipsis for collections
    const shouldShowCollectionEllipsis = computed(() => {
      return product.value?.collections?.length > 3
    })

    const weixinAccountNumber = computed(() => {
      return import.meta.env.VITE_CUSTOMER_SERVICE_WEIXIN || ''
    })

    const payloadCmsUrl = computed(() => {
      return import.meta.env.VITE_PAYLOAD_CMS_URL || ''
    })

    const relatedArticles = ref([])
    const relatedArticlesLoading = ref(false)

    const fetchRelatedArticles = async (productId) => {
      if (!productId || !payloadCmsUrl.value) return

      try {
        relatedArticlesLoading.value = true
        const response = await fetch(
          `${payloadCmsUrl.value}/api/posts?where[products][equals]=${productId}&limit=10&depth=1&sort=-createdAt`
        )

        if (response.ok) {
          const data = await response.json()
          relatedArticles.value = data.docs || []
        } else {
          console.error('Error fetching related articles:', response.statusText)
          relatedArticles.value = []
        }
      } catch (error) {
        console.error('Error fetching related articles:', error)
        relatedArticles.value = []
      } finally {
        relatedArticlesLoading.value = false
      }
    }

    const unescapedDescription = computed(() => {
      if (!product.value?.description) return ''

      // Replace common HTML entities
      return product.value.description
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
      // Add more replacements if you have other entities like &nbsp;
    })

    return {
      product,
      isLoading,
      currentImage,
      selectedOptions,
      selectedVariant,
      variantImages,
      isAddingToCart,
      addToCartError,
      quantityInCart,
      isOutOfStock,
      isInStock,
      addToCart,
      debouncedAddToCart,
      updateSelectedOption,
      goToPreviousImage,
      goToNextImage,
      formatCurrency,
      formatPriceRange,
      getStockLevelText,
      getVariantDisplayName,
      hasStory,
      isMobile,
      truncateText,
      truncatedCollections,
      shouldShowCollectionEllipsis,
      weixinAccountNumber,
      payloadCmsUrl,
      activeTab,
      unescapedDescription,
      relatedArticles,
      relatedArticlesLoading,
      showScrollToTop,
      scrollToTop,
    }
  }
}
</script>