<template>
  <div class="min-h-screen bg-gray-50">

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>

    <!-- Collection Content -->
    <div v-else-if="collection" class="max-w-7xl mx-auto px-4 py-8">
      <!-- Collection Header -->
      <div class="mb-8">
        <div class="flex justify-between items-start mb-4">
          <div class="flex-1">
            <h1 class="text-3xl font-light tracking-tight text-gray-900">{{ collection.name }}</h1>
            <p v-if="collection.description" class="text-gray-600 max-w-3xl mt-2">{{ collection.description }}</p>
          </div>
          <!-- Mobile Filter Button             Filters-->
          <button @click="openMobileFilters"
            class="lg:hidden inline-flex items-center px-4 py-2 ml-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>

            <span v-if="selectedFacets.length > 0" class="ml-1 text-primary-600 font-semibold">
              ({{ selectedFacets.length }})
            </span>
          </button>
        </div>
      </div>

      <div class="lg:grid lg:grid-cols-4 lg:gap-x-8">
        <!-- Left Navigation Panel -->
        <aside class="hidden lg:block border-r pr-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Categories</h2>
          <nav class="space-y-2">
            <!-- Parent Category -->
            <div v-if="collection.parent && collection.parent.name !== '__root_collection__'">
              <router-link :to="`/collections/${collection.parent.slug}`"
                class="block px-3 py-2 text-sm font-medium text-gray-900 bg-gray-100 rounded-md hover:bg-gray-200">
                ← Back to {{ collection.parent.name }}
              </router-link>
            </div>

            <!-- All Categories Hierarchy -->
            <div v-if="organizedCollections.length > 0" class="space-y-2">
              <div v-for="rootCollection in organizedCollections" :key="rootCollection.id">
                <!-- Check if this root collection is the current collection OR contains the current subcategory -->
                <div
                  v-if="rootCollection.slug === route.params.slug || (rootCollection.children && rootCollection.children.some(child => child.slug === route.params.slug))">
                  <div class="flex items-center gap-2">
                    <!-- Highlight parent collection when viewing subcategory - make it clickable -->
                    <router-link :to="`/collections/${rootCollection.slug}`"
                      class="flex-1 text-primary-600 bg-primary-50 font-medium px-3 py-2 text-sm rounded-md hover:bg-primary-100">
                      {{ rootCollection.name }}
                    </router-link>
                    <!-- +/- button for categories with children -->
                    <button v-if="rootCollection.children && rootCollection.children.length > 0"
                      @click="toggleCategory(rootCollection.id)"
                      class="flex-shrink-0 w-6 h-6 flex items-center justify-center text-xs font-medium rounded border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-700 transition-colors">
                      {{ getCategoryState(rootCollection.id) ? '−' : '+' }}
                    </button>
                  </div>

                  <!-- Sub-categories (indented under current collection) -->
                  <div
                    v-if="rootCollection.children && rootCollection.children.length > 0 && getCategoryState(rootCollection.id)"
                    class="ml-4 mt-1 space-y-1">
                    <div v-for="child in rootCollection.children" :key="child.id">
                      <!-- Highlight current subcategory -->
                      <div v-if="child.slug === route.params.slug"
                        class="text-primary-600 bg-primary-50 font-medium px-3 py-2 text-sm rounded-md">
                        {{ child.name }}
                      </div>
                      <!-- Regular subcategory link -->
                      <router-link v-else :to="`/collections/${child.slug}`"
                        class="block px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900">
                        {{ child.name }}
                      </router-link>
                    </div>
                  </div>
                </div>

                <!-- Other root collections -->
                <div v-else>
                  <div class="flex items-center gap-2">
                    <router-link :to="`/collections/${rootCollection.slug}`"
                      class="flex-1 px-3 py-2 text-sm font-medium text-gray-900 rounded-md hover:bg-gray-100 hover:text-gray-900">
                      {{ rootCollection.name }}
                    </router-link>
                    <!-- +/- button for categories with children -->
                    <button v-if="rootCollection.children && rootCollection.children.length > 0"
                      @click="toggleCategory(rootCollection.id)"
                      class="flex-shrink-0 w-6 h-6 flex items-center justify-center text-xs font-medium rounded border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-700 transition-colors">
                      {{ getCategoryState(rootCollection.id) ? '−' : '+' }}
                    </button>
                  </div>

                  <!-- Subcategories (indented) -->
                  <div
                    v-if="rootCollection.children && rootCollection.children.length > 0 && getCategoryState(rootCollection.id)"
                    class="ml-4 mt-1 space-y-1">
                    <div v-for="child in rootCollection.children" :key="child.id">
                      <router-link :to="`/collections/${child.slug}`"
                        class="block px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900">
                        {{ child.name }}
                      </router-link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </nav>


          <!-- Facet Filters -->
          <div v-if="extractedFacets.length > 0" class="mt-8">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-medium text-gray-900">Filter by</h2>
              <div class="text-sm text-gray-500">
                {{ selectedFacets.length }} selected
              </div>
            </div>
            <div v-for="facet in extractedFacets" :key="facet.id || facet.name" class="mb-6">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <h3 class="font-medium text-gray-900">{{ facet.name }}</h3>
                  <button v-if="facet.id" @click="toggleFacetGroup(facet.id)"
                    class="text-xs font-medium px-2 py-1 rounded border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-700 transition-colors">
                    {{ getFacetGroupState(facet.id) ? '−' : '+' }}
                  </button>
                </div>
                <button @click="selectAllFacetValues(facet)"
                  class="text-xs font-medium px-2 py-1 rounded border border-primary-200 hover:border-primary-300 bg-white hover:bg-primary-50 text-primary-600 hover:text-primary-700 transition-colors">
                  {{ isAllFacetValuesSelected(facet) ? 'Unselect All' : 'Select All' }}
                </button>
              </div>
              <div v-if="facet.id && getFacetGroupState(facet.id) && facet.values && facet.values.length > 0"
                class="space-y-1">
                <div v-for="facetValue in facet.values" :key="facetValue.id"
                  class="flex items-center justify-between text-sm px-2 py-1 rounded cursor-pointer hover:bg-gray-50"
                  @click="toggleFacet(facetValue.id)">
                  <div class="flex items-center gap-2">
                    <input type="checkbox" :checked="selectedFacets.includes(facetValue.id)"
                      class="cursor-pointer pointer-events-none" @click.stop />
                    <span class="text-gray-700">{{ facetValue.name }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- || serverFacetsLoading -->
          <div v-else-if="filtersLoading" class="mt-8">
            <h2 class="text-lg font-medium text-gray-900 mb-4">Filter by</h2>
            <div class="flex items-center gap-2">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
              <p class="text-sm text-gray-500">Loading filters...</p>
            </div>
          </div>

        </aside>

        <!-- Main Content Area -->
        <div class="lg:col-span-3">
          <!-- Sub-collections Grid -->
          <!-- <div v-if="collection.children && collection.children.length > 0" class="mb-12">
            <h2 class="text-xl font-medium text-gray-900 mb-6">Sub-categories</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div
                v-for="child in collection.children"
                :key="child.id"
                class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <router-link :to="`/collections/${child.slug}`" class="block group">
                  <div class="aspect-w-1 aspect-h-1 bg-gray-100">
                    <img
                      v-if="child.featuredAsset"
                      :src="child.featuredAsset.preview + '?w=200&h=200&format=webp'"
                      :alt="child.name"
                      class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div v-else class="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div class="p-4">
                    <h3 class="text-sm font-medium text-gray-900">{{ child.name }}</h3>
                  </div>
                </router-link>
              </div>
            </div>
          </div> -->

          <!-- Products Grid -->
          <div v-if="filteredProducts && filteredProducts.length > 0">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div v-for="(product, index) in filteredProducts" :key="product.id"
                class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <router-link :to="productLinks[index]" class="block group">
                  <!-- Product Image -->
                  <!-- group-hover:scale-105 transition-transform duration-300 -->
                  <div class="aspect-w-1 aspect-h-1 bg-gray-100">
                    <img v-if="product.featuredAsset" :src="product.featuredAsset.preview + '?w=200&h=200&format=webp'"
                      :alt="product.name"
                      class="w-full h-48 object-cover" />
                    <div v-else class="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>

                   <!-- Product Details -->
                   <div class="p-4">
                     <h3 class="text-sm font-medium text-gray-900 mb-2 line-clamp-2">{{ product.name }}</h3>

                     <!-- Product Facet Tags -->
                     <div v-if="product.facetValues && product.facetValues.length > 0" class="mb-3">
                       <div class="flex flex-wrap gap-1">
                         <span v-for="facetValue in product.facetValues" :key="facetValue.id"
                           class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                           {{ facetValue.name }}
                         </span>
                       </div>
                     </div>

                     <!-- {{ product.description }} -->

                     <!-- Price Range -->
                    <div class="mt-2">
                      <div class="text-sm text-gray-900">
                        <span
                          v-html="product.priceRange ? formatPriceRange(product.priceRange) : getPriceRange(product.variants)"></span>
                      </div>
                    </div>
                  </div>
                </router-link>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else-if="!isLoading" class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No products found</h3>
            <p class="mt-1 text-sm text-gray-500">This collection doesn't have any products yet.</p>
          </div>


          <!-- Pagination Section -->
          <div v-if="filteredProducts.length > 0"
            class="flex justify-center md:justify-between items-center py-8 border-t border-gray-200">

            <!-- Left side: Showing results info -->
            <!-- {{ totalFilteredProducts }} -->
            <div class="hidden md:block text-sm text-gray-600">
              Showing {{ ((page - 1) * pageSize) + 1 }} to {{ Math.min(page * pageSize, totalFilteredProducts) }} of {{
                totalFilteredProducts }} products
            </div>

            <!-- Right side: Page navigation -->
            <div class="flex items-center space-x-2">
              <!-- Previous button -->
              <button v-if="page > 1" @click="goToPage(page - 1)" :disabled="loadingMore"
                class="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                <span class="md:hidden">&lt;</span>
                <span class="hidden md:inline">Previous</span>
              </button>

              <!-- Page numbers -->
              <div class="flex space-x-1">
                <button v-for="pageNum in visiblePages" :key="pageNum" @click="goToPage(pageNum)" :class="[
                  'px-3 py-1 text-sm font-medium rounded-md',
                  pageNum === page
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                ]" :disabled="loadingMore">
                  {{ pageNum }}
                </button>
              </div>

              <!-- Next button -->
              <button v-if="page < totalPages" @click="goToPage(page + 1)" :disabled="loadingMore"
                class="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                <span class="md:hidden">&gt;</span>
                <span class="hidden md:inline">Next</span>
              </button>
            </div>

          </div>

          <!-- Loading More Indicator (for infinite scroll) -->
          <div v-if="loadingMore" class="text-left py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p class="mt-2 text-sm text-gray-600">Loading more products...</p>
          </div>

          <!-- End of Results -->
          <!-- <div v-if="filteredProducts.length > 0 && filteredProducts.length >= totalFilteredProducts" class="text-left py-8">
            <p class="text-sm text-gray-500">All {{ totalFilteredProducts }} products loaded</p>
          </div> -->

          <!-- Bottom Sentinel for Infinite Scroll -->
          <div ref="sentinel" class="h-10"></div>
        </div>
      </div>
    </div>

    <!-- Collection Not Found -->
    <div v-else class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.88-6.09-2.32" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">Collection not found</h3>
        <p class="mt-1 text-sm text-gray-500">The collection you're looking for doesn't exist.</p>
        <div class="mt-6">
          <router-link to="/"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700">
            Go back home
          </router-link>
        </div>
        </div>
      </div>

      <!-- Mobile Scroll to Top Button -->
      <button v-if="showScrollToTop"
        @click="scrollToTop"
        class="lg:hidden fixed bottom-20 right-4 z-40 w-8 h-8 bg-transparent border border-gray-500 text-gray-600 rounded-full shadow-sm hover:border-gray-600 hover:text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all duration-200 flex items-center justify-center touch-manipulation opacity-80 hover:opacity-100">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>

      <!-- Mobile Filter Bottom Sheet -->
    <div v-if="showMobileFilters" class="fixed inset-0 z-50 lg:hidden" style="z-index: 9999;">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black bg-opacity-50" @click="showMobileFilters = false"></div>

       <!-- Filter Panel -->
       <div class="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl h-full overflow-hidden flex flex-col">
         <!-- Header -->
         <div class="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
           <div class="flex items-center gap-3">
             <h3 class="text-lg font-medium text-gray-900">Filters</h3>
             <span v-if="selectedFacets.length > 0"
               class="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
               {{ selectedFacets.length }} selected
             </span>
           </div>
           <button @click="showMobileFilters = false" class="p-2 text-gray-400 hover:text-gray-600 transition-colors">
             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
             </svg>
           </button>
         </div>

         <!-- Filter Content -->
         <div class="flex-1 overflow-y-auto">
          <div class="p-4">
            <!-- Categories Section -->
            <div class="mb-6">
              <h4 class="text-sm font-medium text-gray-900 mb-3">Categories</h4>
              <nav class="space-y-2">
                <!-- Parent Category -->
                <div v-if="collection.parent && collection.parent.name !== '__root_collection__'">
                  <router-link :to="`/collections/${collection.parent.slug}`" @click="showMobileFilters = false"
                    class="block px-3 py-2 text-sm font-medium text-gray-900 bg-gray-100 rounded-md hover:bg-gray-200">
                    ← Back to {{ collection.parent.name }}
                  </router-link>
                </div>

                 <!-- All Categories Hierarchy -->
                 <div v-if="organizedCollections.length > 0" class="space-y-2">
                   <div v-for="rootCollection in organizedCollections" :key="rootCollection.id">
                     <!-- Check if this root collection is the current collection OR contains the current subcategory -->
                     <div v-if="rootCollection.slug === route.params.slug || (rootCollection.children && rootCollection.children.some(child => child.slug === route.params.slug))">
                       <!-- Root Category in current hierarchy -->
                       <div class="flex items-center gap-3">
                         <router-link :to="`/collections/${rootCollection.slug}`" @click="showMobileFilters = false"
                           class="flex-1 text-primary-600 bg-primary-50 font-medium px-3 py-3 text-sm rounded-md hover:bg-primary-100 transition-colors">
                           {{ rootCollection.name }}
                         </router-link>
                         <!-- Expand/collapse button for categories with children -->
                         <button v-if="rootCollection.children && rootCollection.children.length > 0"
                           @click="toggleCategory(rootCollection.id)"
                           class="flex-shrink-0 w-8 h-8 flex items-center justify-center text-sm font-medium rounded-md border border-primary-300 hover:border-primary-400 bg-white hover:bg-primary-50 text-primary-600 hover:text-primary-700 transition-colors touch-manipulation">
                           {{ getCategoryState(rootCollection.id) ? '−' : '+' }}
                         </button>
                       </div>

                       <!-- Sub-categories (indented under current collection) -->
                       <div v-if="rootCollection.children && rootCollection.children.length > 0 && getCategoryState(rootCollection.id)"
                         class="ml-6 mt-2 space-y-1">
                         <div v-for="child in rootCollection.children" :key="child.id">
                           <!-- Highlight current subcategory -->
                           <div v-if="child.slug === route.params.slug"
                             class="text-primary-600 bg-primary-50 font-medium px-3 py-2.5 text-sm rounded-md">
                             {{ child.name }}
                           </div>
                           <!-- Regular subcategory link -->
                           <router-link v-else :to="`/collections/${child.slug}`" @click="showMobileFilters = false"
                             class="block px-3 py-2.5 text-sm text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors touch-manipulation">
                             {{ child.name }}
                           </router-link>
                         </div>
                       </div>
                     </div>

                     <!-- Other root collections (not in current hierarchy) -->
                     <div v-else>
                       <div class="flex items-center gap-3">
                         <router-link :to="`/collections/${rootCollection.slug}`" @click="showMobileFilters = false"
                           :class="[
                             'flex-1 block px-3 py-3 text-sm rounded-md transition-colors touch-manipulation',
                             'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                           ]">
                           {{ rootCollection.name }}
                         </router-link>
                         <!-- Expand/collapse button for other categories with children -->
                         <button v-if="rootCollection.children && rootCollection.children.length > 0"
                           @click="toggleCategory(rootCollection.id)"
                           class="flex-shrink-0 w-8 h-8 flex items-center justify-center text-sm font-medium rounded-md border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-700 transition-colors touch-manipulation">
                           {{ getCategoryState(rootCollection.id) ? '−' : '+' }}
                         </button>
                       </div>

                       <!-- Sub-categories for other collections -->
                       <div v-if="rootCollection.children && rootCollection.children.length > 0 && getCategoryState(rootCollection.id)"
                         class="ml-6 mt-2 space-y-1">
                         <router-link v-for="child in rootCollection.children" :key="child.id"
                           :to="`/collections/${child.slug}`" @click="showMobileFilters = false"
                           class="block px-3 py-2.5 text-sm text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-800 transition-colors touch-manipulation">
                           {{ child.name }}
                         </router-link>
                       </div>
                     </div>
                   </div>
                 </div>
              </nav>
            </div>

            <!-- Facet Filters -->
            <div v-if="extractedFacets.length > 0">
              <div v-for="facet in extractedFacets" :key="facet.id || facet.name" class="mb-6">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <h4 class="text-sm font-medium text-gray-900">{{ facet.name }}</h4>
                    <button v-if="facet.id" @click="toggleFacetGroup(facet.id)"
                      class="text-xs font-medium px-2 py-1 rounded border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-700 transition-colors">
                      {{ getFacetGroupState(facet.id) ? '−' : '+' }}
                    </button>
                  </div>
                  <button @click="selectAllFacetValues(facet)"
                    class="text-xs font-medium px-2 py-1 rounded border border-primary-200 hover:border-primary-300 bg-white hover:bg-primary-50 text-primary-600 hover:text-primary-700 transition-colors">
                    {{ isAllFacetValuesSelected(facet) ? 'Unselect All' : 'Select All' }}
                  </button>
                </div>
                <div v-if="facet.id && getFacetGroupState(facet.id) && facet.values && facet.values.length > 0"
                  class="space-y-2">
                  <div v-for="facetValue in facet.values" :key="facetValue.id"
                    class="flex items-center justify-between text-sm px-3 py-2 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
                    @click="toggleFacet(facetValue.id)">
                    <div class="flex items-center gap-3">
                      <input type="checkbox" :checked="selectedFacets.includes(facetValue.id)"
                        class="cursor-pointer pointer-events-none w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        @click.stop />
                      <span class="text-gray-700">{{ facetValue.name }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Loading State -->
            <!-- || serverFacetsLoading  -->
            <div v-else-if="filtersLoading" class="text-center py-8">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto mb-2"></div>
              <p class="text-sm text-gray-500">Loading filters...</p>
            </div>


          </div>
         </div>

         <!-- Action Buttons -->
         <div class="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
           <div class="flex gap-3">
             <button @click="clearAllFilters"
               class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
               Clear
             </button>
             <button @click="applyMobileFilters"
               class="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
               Apply
             </button>
           </div>
         </div>
       </div>
    </div>



  </div>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '../stores/app'
import { getCollectionBySlug, getCollectionProductSummary, getProductsByFacets, getActiveChannelQuery } from '../providers/shop/collections/collections'
import { throttle } from '../utils/throttle'

export default {
  name: 'Collection',

  setup() {
    const route = useRoute()
    const appStore = useAppStore()

    const collection = ref(null)
    const products = ref([]) // Will store all loaded products
    const totalItems = ref(0)
    const isLoading = ref(true)
    const loadingMore = ref(false)
    const selectedFacets = ref([])
    const page = ref(1)
    const pageSize = parseInt(import.meta.env.VITE_PRODUCTS_NUMBER_IN_A_PAGE) || 12 // Products per page for client-side pagination
    const allProducts = ref([]) // Store all loaded products for client-side pagination
    const allAvailableProducts = ref([]) // Store all available products for facet extraction (without filters)
    const observer = ref(null)
    const sentinel = ref(null)
    const allLoadedProductIds = ref(new Set()) // Track all unique product IDs we've loaded
    const hasMoreProducts = ref(true) // Track if there are more products to load
    const loadedVariantsCount = ref(0) // Track total variants loaded across all pages
    const filtersLoading = ref(false)
    const showSubcategories = ref(false) // Control subcategories visibility
    const allCollections = ref([]) // All collections for complete navigation
    const expandedFacetGroups = ref({}) // Track which facet groups are expanded (expanded by default)
    const expandedCategories = ref({}) // Track which categories are expanded
    const showMobileFilters = ref(false) // Mobile filter bottom sheet visibility
    const showScrollToTop = ref(false) // Mobile scroll to top button visibility
    const channelCurrency = ref('USD') // Default currency

    // Scroll to top functionality
    const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // Handle scroll events for mobile scroll-to-top button
    const handleScroll = () => {
      showScrollToTop.value = window.scrollY > 300 // Show after scrolling 300px
    }

    // Fetch active channel currency on component mount
    onMounted(async () => {
      try {
        const channel = await getActiveChannelQuery()
        if (channel?.currencyCode) {
          channelCurrency.value = channel.currencyCode
          // console.log('💱 Collection page channel currency loaded:', channelCurrency.value)
        }
      } catch (error) {
        console.error('Error fetching channel currency:', error)
      }

      // Load collection data
      await loadCollection()

      // Load all collections for navigation
      loadAllCollections()

      // Add scroll listener for mobile scroll-to-top button
      window.addEventListener('scroll', handleScroll)
    })

    // Clean up scroll listener
    onUnmounted(() => {
      window.removeEventListener('scroll', handleScroll)
    })


    const loadAllCollections = async () => {
      try {
        // Use collections data from Pinia store instead of making separate API call
        allCollections.value = appStore.collections
        // console.log('🔧 Initial collections from Pinia store:', allCollections.value)

        // If collections are not available in store yet, load them directly
        if (!allCollections.value || allCollections.value.length === 0) {
          // console.log('🔧 Collections not in store, loading directly...')
          const { getCollections } = await import('../providers/shop/collections/collections')
          const collectionsData = await getCollections()
          if (collectionsData) {
            allCollections.value = collectionsData
            appStore.setCollections(collectionsData)
            // console.log('🔧 Collections loaded directly:', allCollections.value)
          }
        } else {
          // console.log('🔧 Collections already available in store')
        }

        // Log collection structure for debugging
        // console.log('🔧 Final collections structure:')
        // allCollections.value.forEach(collection => {
        //   console.log(`🔧   ${collection.name} (ID: ${collection.id}, Slug: ${collection.slug})`)
        //   console.log(`🔧     Children: ${collection.children?.length || 0}`)
        //   if (collection.children && collection.children.length > 0) {
        //     collection.children.forEach(child => {
        //       console.log(`🔧       - ${child.name} (Slug: ${child.slug})`)
        //     })
        //   }
        // })
      } catch (error) {
        console.error('Error loading all collections from store:', error)
      }
    }


    const loadAllProducts = async () => {
      try {
        isLoading.value = true
        const slug = route.params.slug
        const filterMode = import.meta.env.VITE_FILTER_MODE || 'server'

        // console.log(`Loading products for collection: ${slug}, selectedFacets=${selectedFacets.value.join(',')}, filterMode=${filterMode}, page=${page.value}`)

        // Check if we're viewing a parent category (has children)
        let isParentCategory = false
        let parentCollectionInfo = null
        let childCollections = []

        // Load all collections if not already loaded
        if (allCollections.value.length === 0) {
          await loadAllCollections()
        }

        // Find the current collection and check if it has children
        parentCollectionInfo = allCollections.value.find(c => c.slug === slug)
        if (parentCollectionInfo && parentCollectionInfo.children && parentCollectionInfo.children.length > 0) {
          isParentCategory = true
          childCollections = parentCollectionInfo.children
        }

        let collectionData

        // Clean separation: Server-side mode always loads specific page, Client-side accumulates all products
        if (filterMode === 'server') {
          // SERVER-SIDE MODE: Always use server-side pagination
          if (selectedFacets.value.length > 0) {
            // console.log('🔧 SERVER MODE: Using productsByFacets API for server-side filtering')
            // console.log('🔧 Selected facets count:', selectedFacets.value.length)
            // console.log('🔧 Selected facet IDs:', selectedFacets.value)

            // Get collection ID and name from collections data in Pinia store (OP1120 optimization)
            let collectionInfo = appStore.collections.find(c => c.slug === slug)

            // Fallback: if collections not in store yet, load them
            if (!collectionInfo && appStore.collections.length === 0) {
              await loadAllCollections()
              collectionInfo = appStore.collections.find(c => c.slug === slug)
            }

            if (!collectionInfo) {
              console.error(`Collection not found for slug: ${slug}`)
              return null
            }
            const collectionId = collectionInfo.id

            const filteredProductsResponse = await getProductsByFacets(collectionId, selectedFacets.value, (page.value - 1) * pageSize, pageSize)
            // console.log('🔧 Server-side filtered products response:', filteredProductsResponse)
            // console.log('🔧 Filtered products count:', filteredProductsResponse.items?.length || 0)
            // console.log('🔧 Total filtered products count:', filteredProductsResponse.totalCount || 0)

            // Convert the filtered products to the expected format
            const currentPageProducts = filteredProductsResponse.items.map(product => ({
              id: product.id,
              name: product.name,
              slug: product.slug,
              description: product.description || '',
              featuredAsset: product.featuredAsset || null,
              facetValues: product.facetValues || [],
              // Store price range for display (calculate from all variants)
              priceRange: {
                min: product.variants ? Math.min(...product.variants.map(v => v.priceWithTax || 0)) : 0,
                max: product.variants ? Math.max(...product.variants.map(v => v.priceWithTax || 0)) : 0
              },
              variants: product.variants || []
            }))

            // Use the total count from the API response
            const totalFilteredCount = filteredProductsResponse.totalCount

            // console.log(`🔧🔧🔧`, filteredProductsResponse.totalCount)
            // console.log(`🔧🔧🔧🔧🔧🔧🔧🔧 SERVER MODE: Showing ${currentPageProducts.length} filtered products for page ${page.value}, total: ${totalFilteredCount}`)

            // Convert to collection-like format
            collectionData = {
              id: collectionId, // Include collection ID for server-side facets
              name: collectionInfo.name,
              productVariants: {
                items: currentPageProducts,
                totalItems: totalFilteredCount
              },
              productCount: totalFilteredCount
            }
          } else {
            // No facets selected, use collectionProductSummary plugin for consistent product-level pagination
            // console.log('🔧 SERVER MODE: Using collectionProductSummary plugin for consistent product-level pagination')

            // Get collection ID and name from collections data in Pinia store (OP1120 optimization)
            let collectionInfo = appStore.collections.find(c => c.slug === slug)

            // Fallback: if collections not in store yet, load them
            if (!collectionInfo && appStore.collections.length === 0) {
              await loadAllCollections()
              collectionInfo = appStore.collections.find(c => c.slug === slug)
            }

            if (!collectionInfo) {
              console.error(`Collection not found for slug: ${slug}`)
              return null
            }

            // Handle parent category: load products from all subcategories for facet extraction
            let productSummary = []
            let allSubcategoryProducts = []

            if (isParentCategory && page.value === 1) {
               // For parent categories on first page, load only current page products for display
               productSummary = await getCollectionProductSummary(collectionInfo.id, page.value, pageSize)
             } else {
              // Normal case: load products only from current collection
              productSummary = await getCollectionProductSummary(collectionInfo.id, page.value, pageSize)
            }

            // Use product summary data directly without individual API calls
            const currentPageProducts = productSummary.map((summary) => ({
              id: summary.productId,
              name: summary.productName,
              slug: summary.slug || summary.productId, // Use actual slug from API
              description: summary.description || '', // Use description from API
              featuredAsset: summary.featuredAsset || null, // Use featured asset from API
              facetValues: summary.facetValues || [], // Use facet values from summary
              // Store price range for display (using tax-inclusive prices)
              priceRange: {
                min: summary.minPriceWithTax * 100, // Convert to cents
                max: summary.maxPriceWithTax * 100  // Convert to cents
              },
              variants: [{
                id: summary.productId + '-variant',
                name: summary.productName,
                priceWithTax: summary.minPriceWithTax * 100, // Convert to cents
                stockLevel: 'IN_STOCK',
                facetValues: summary.facetValues || []
              }]
            }))

            // Store full set of available products for facet extraction (only on first page load)
            if (page.value === 1) {
              if (isParentCategory && productSummary.length > 0) {
                // For parent categories, use expanded products from parent collection for facet extraction
                const allParentProductsFormatted = productSummary.map((summary) => ({
                  id: summary.productId,
                  name: summary.productName,
                  slug: summary.slug || summary.productId,
                  description: summary.description || '',
                  featuredAsset: summary.featuredAsset || null,
                  facetValues: summary.facetValues || [],
                  priceRange: {
                    min: summary.minPriceWithTax * 100,
                    max: summary.maxPriceWithTax * 100
                  },
                  variants: [{
                    id: summary.productId + '-variant',
                    name: summary.productName,
                    priceWithTax: summary.minPriceWithTax * 100,
                    stockLevel: 'IN_STOCK',
                    facetValues: summary.facetValues || []
                  }]
                }))
                allAvailableProducts.value = allParentProductsFormatted
                // console.log(`🔧 Parent category: Using ${allParentProductsFormatted.length} products from parent collection for facet extraction`)
              } else {
                // Normal case: use current page products for facet extraction
                allAvailableProducts.value = currentPageProducts
              }
            }

            // Convert product summary to collection-like format
            collectionData = {
              id: collectionInfo.id, // Include collection ID for server-side facets
              name: collectionInfo.name,
              productVariants: {
                items: currentPageProducts,
                totalItems: collectionInfo.productCount || productSummary.length
              },
              productCount: collectionInfo.productCount || productSummary.length
            }
          }
        } else {
          // CLIENT-SIDE MODE: Always accumulate all products for local filtering
          // console.log('🔧 CLIENT MODE: Using Collections API and accumulating all products')

           // Handle parent category: load more products from parent collection for facet extraction
           if (isParentCategory && page.value === 1) {
             // For parent categories on first page, load more products from parent collection for facet extraction
             // Vendure parent collections already include products from child collections
             // console.log(`🔧 CLIENT MODE: Loading more products from parent collection for facet extraction (includes all ${childCollections.length} subcategories)`)

             // Load current page products for display
             collectionData = await getCollectionBySlug(slug, page.value, pageSize, selectedFacets.value)

             // Load additional products from parent collection for facet extraction
             const expandedCollectionData = await getCollectionBySlug(slug, 1, pageSize * 2, [])

             // Store expanded products for facet extraction
             if (collectionData && expandedCollectionData?.productVariants?.items) {
               // Convert expanded products to the same format as current page products
               const productMap = new Map()
               expandedCollectionData.productVariants.items.forEach(variant => {
                 const product = variant.product || variant
                 const productId = product.id || variant.id
                 const productName = product.name || variant.name
                 const productSlug = product.slug || variant.slug
                 const productDescription = product.description || variant.description
                 const productFeaturedAsset = product.featuredAsset || variant.featuredAsset
                 const productFacetValues = product.facetValues || variant.facetValues || []

                 if (!productMap.has(productId)) {
                   productMap.set(productId, {
                     id: productId,
                     name: productName,
                     slug: productSlug,
                     description: productDescription,
                     featuredAsset: productFeaturedAsset,
                     facetValues: productFacetValues,
                     variants: []
                   })
                 }

                 productMap.get(productId).variants.push({
                   id: variant.id,
                   name: variant.name,
                   priceWithTax: variant.priceWithTax,
                   currencyCode: variant.currencyCode,
                   stockLevel: variant.stockLevel,
                   facetValues: variant.facetValues || []
                 })
               })

               const allParentProductsFormatted = Array.from(productMap.values())
               allAvailableProducts.value = allParentProductsFormatted
               // console.log(`🔧 CLIENT MODE Parent category: Using ${allParentProductsFormatted.length} products from parent collection for facet extraction`)
             }
          } else {
            // Normal case: load products only from current collection
            collectionData = await getCollectionBySlug(slug, page.value, pageSize, selectedFacets.value)
          }
        }

        if (collectionData) {
          collection.value = collectionData
          // console.log(`Loaded collection: ${collectionData.name} with ${collectionData.children?.length || 0} subcategories`)
          // console.log('🔧 Collection ID from collectionData:', collectionData.id)

          // Server-side facets will be loaded by the collection watcher
          const filterMode = import.meta.env.VITE_FILTER_MODE || 'server'
          if (filterMode === 'server') {
            // console.log('🔧 SERVER MODE: Collection loaded, server-side facets will be loaded by watcher')
          }

          let currentPageProducts = []

          if (filterMode === 'server' && selectedFacets.value.length === 0) {
            // SERVER MODE WITHOUT FACETS: collectionProductSummary already returns product-level data
            // Use the products directly from collectionProductSummary
            currentPageProducts = collectionData.productVariants?.items || []
            // console.log(`🔧 SERVER MODE: Direct product data from collectionProductSummary: ${currentPageProducts.length} products`)
          } else if (filterMode === 'server' && selectedFacets.value.length > 0) {
            // SERVER MODE WITH FACETS: SearchWithOptions returns product-level data
            currentPageProducts = collectionData.productVariants?.items || []
            // console.log(`🔧 SERVER MODE: Direct product data from SearchWithOptions: ${currentPageProducts.length} products`)
          } else {
            // CLIENT MODE OR SERVER MODE WITH FACETS: Group variants by product
            const productMap = new Map()

            if (collectionData.productVariants?.items) {
              collectionData.productVariants.items.forEach(variant => {
                const product = variant.product || variant
                const productId = product.id || variant.id
                const productName = product.name || variant.name
                const productSlug = product.slug || variant.slug
                const productDescription = product.description || variant.description
                const productFeaturedAsset = product.featuredAsset || variant.featuredAsset
                const productFacetValues = product.facetValues || variant.facetValues || []

                if (!productMap.has(productId)) {
                  productMap.set(productId, {
                    id: productId,
                    name: productName,
                    slug: productSlug,
                    description: productDescription,
                    featuredAsset: productFeaturedAsset,
                    facetValues: productFacetValues,
                    variants: []
                  })
                }

                productMap.get(productId).variants.push({
                  id: variant.id,
                  name: variant.name,
                  priceWithTax: variant.priceWithTax,
                  currencyCode: variant.currencyCode,
                  stockLevel: variant.stockLevel,
                  facetValues: variant.facetValues || []
                })
              })
            }

            currentPageProducts = Array.from(productMap.values())
            // console.log(`🔧 Grouped ${currentPageProducts.length} products from ${collectionData.productVariants?.items?.length || 0} variants`)
          }

          if (filterMode === 'server') {
            // SERVER MODE: Handle different cases
            if (selectedFacets.value.length > 0) {
              // When using productsByFacets (with pagination), we get paginated results
              allProducts.value = currentPageProducts
              totalItems.value = collectionData.productCount || collectionData.productVariants?.totalItems || 0
              // console.log(`🔧🔧🔧 SERVER MODE WITH FACETS: Showing ${currentPageProducts.length} products for page ${page.value}, total products: ${totalItems.value}`)
            } else {
              // When using collectionProductSummary (with pagination), we get paginated results
              allProducts.value = currentPageProducts
              totalItems.value = collectionData.productCount || collectionData.productVariants?.totalItems || 0
              // console.log(`🔧 SERVER MODE NO FACETS: Showing ${currentPageProducts.length} products for page ${page.value}, total products: ${totalItems.value}`)
            }
          } else {
            // CLIENT MODE: Accumulate all products for local pagination
            if (page.value === 1) {
              // First page - replace all products
              allProducts.value = currentPageProducts
              // Store full set of available products for facet extraction (only on first page load)
              allAvailableProducts.value = currentPageProducts
            } else {
              // Subsequent pages - append new products (deduplicate)
              const existingIds = new Set(allProducts.value.map(p => p.id))
              const newProducts = currentPageProducts.filter(p => !existingIds.has(p.id))
              allProducts.value = [...allProducts.value, ...newProducts]
              // Note: allAvailableProducts is only populated from first page for facet extraction
            }
            totalItems.value = collectionData.productCount || allProducts.value.length
            console.log(`🔧 CLIENT MODE: Accumulated ${allProducts.value.length} products, total: ${totalItems.value}`)
          }
        }

        if (collectionData) {
          // Apply pagination
          applyPagination()
        }
      } catch (error) {
        console.error('Error loading collection:', error)
        collection.value = null
        allProducts.value = []
        products.value = []
      } finally {
        isLoading.value = false
      }
    }

    const applyPagination = () => {
      const filterMode = import.meta.env.VITE_FILTER_MODE || 'server'

      if (filterMode === 'server') {
        if (selectedFacets.value.length > 0) {
          // When using productsByFacets (with pagination), products are already paginated
          products.value = allProducts.value
          hasMoreProducts.value = page.value * pageSize < totalItems.value
          // console.log(`🔧 SERVER PAGINATION WITH FACETS: Showing ${products.value.length} products for page ${page.value}, total: ${totalItems.value}, hasMoreProducts=${hasMoreProducts.value}`)
        } else {
          // When using collectionProductSummary (with pagination), products are already paginated
          products.value = allProducts.value
          hasMoreProducts.value = page.value * pageSize < totalItems.value
          // console.log(`🔧 SERVER PAGINATION NO FACETS: Showing ${products.value.length} products for page ${page.value}, total: ${totalItems.value}, hasMoreProducts=${hasMoreProducts.value}`)
        }
      } else {
        // CLIENT MODE: Paginate locally from all accumulated products
        const startIndex = (page.value - 1) * pageSize
        const endIndex = page.value * pageSize
        products.value = allProducts.value.slice(startIndex, endIndex)
        hasMoreProducts.value = endIndex < allProducts.value.length
        // console.log(`🔧 CLIENT PAGINATION: Showing ${products.value.length} of ${allProducts.value.length} products, hasMoreProducts=${hasMoreProducts.value}, page=${page.value}`)
      }
    }

    const loadCollection = async (reset = true) => {
      const filterMode = import.meta.env.VITE_FILTER_MODE || 'server'

      if (reset) {
        // Reset for filter changes or initial load
        page.value = 1
        allProducts.value = []
        products.value = []
        // Do NOT clear allAvailableProducts - we want to keep the full product set for facet extraction
        await loadAllProducts()
      } else {
        // For page navigation or "load more"
        loadingMore.value = true

        if (filterMode === 'server') {
          // SERVER MODE: Load specific page from server
          await loadAllProducts()
        } else {
          // CLIENT MODE: Just apply pagination to already loaded products
          applyPagination()
        }

        loadingMore.value = false
      }
    }

    const formatCurrency = (amount) => {
      if (!amount) return 'N/A'
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: channelCurrency.value
      }).format(amount / 100)

      // Insert a space after the currency symbol if missing 
      return formatted.replace(/^(\D+)(\d)/, '$1 $2')

    }

    const getPriceRange = (variants) => {
      if (!variants || variants.length === 0) return 'N/A'

      const prices = variants.map(v => v.priceWithTax).filter(price => price != null)
      if (prices.length === 0) return 'N/A'

      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)

      const showCny = import.meta.env.VITE_SHOW_CNY_AMOUNT === 'true' && (channelCurrency.value === 'THB' || channelCurrency.value === 'USD')
      const cnyRate = channelCurrency.value === 'THB' ? (appStore.thbRates?.CNY || 0) : (appStore.usdRates?.CNY || 0)

      if (minPrice === maxPrice) {
        const thbPrice = formatCurrency(minPrice)
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
        const thbMin = formatCurrency(minPrice)
        const thbMax = formatCurrency(maxPrice)
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

    const formatPriceRange = (priceRange) => {
      if (!priceRange || !priceRange.min || !priceRange.max) return 'N/A'

      const showCny = import.meta.env.VITE_SHOW_CNY_AMOUNT === 'true' && (channelCurrency.value === 'THB' || channelCurrency.value === 'USD')
      const cnyRate = channelCurrency.value === 'THB' ? (appStore.thbRates?.CNY || 0) : (appStore.usdRates?.CNY || 0)

      if (priceRange.min === priceRange.max) {
        const thbPrice = formatCurrency(priceRange.min)
        if (showCny && cnyRate) {
          const cnyPriceRaw = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'CNY'
          }).format((priceRange.min / 100) * cnyRate)
          // Format CNY with space between symbol and number
          const cnySymbolMatch = cnyPriceRaw.match(/^([^\d]+)(.+)$/)
          const cnyCurrencySymbol = cnySymbolMatch ? cnySymbolMatch[1] : 'CN¥'
          const cnyNumeric = cnySymbolMatch ? cnySymbolMatch[2] : cnyPriceRaw
          const cnyPrice = `${cnyCurrencySymbol} ${cnyNumeric}`
          return `<span class="whitespace-nowrap">${thbPrice}</span><br><span class="text-sm text-gray-500">≈ ${cnyPrice}</span>`
        }
        return thbPrice
      } else {
        const thbMin = formatCurrency(priceRange.min)
        const thbMax = formatCurrency(priceRange.max)
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
          }).format((priceRange.min / 100) * cnyRate)
          const cnyMax = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'CNY'
          }).format((priceRange.max / 100) * cnyRate)
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

    const getStockStatus = (variants) => {
      if (!variants || variants.length === 0) return null

      // Check if any variant is in stock
      const hasInStock = variants.some(variant => {
        const stockLevel = variant.stockLevel
        if (typeof stockLevel === 'number') {
          return stockLevel > 0
        } else if (typeof stockLevel === 'string') {
          return stockLevel === 'IN_STOCK' || stockLevel === 'LOW_STOCK'
        }
        return false
      })

      // Check if all variants are out of stock
      const allOutOfStock = variants.every(variant => {
        const stockLevel = variant.stockLevel
        if (typeof stockLevel === 'number') {
          return stockLevel === 0
        } else if (typeof stockLevel === 'string') {
          return stockLevel === 'OUT_OF_STOCK'
        }
        return true
      })

      if (hasInStock) return 'In stock'
      if (allOutOfStock) return 'Out of stock'
      return 'Limited stock'
    }

    // Filter products based on selected facets with AND logic between groups and OR logic within groups
    const filteredProducts = computed(() => {
      if (!allProducts.value || allProducts.value.length === 0) return []

      const filterMode = import.meta.env.VITE_FILTER_MODE || 'server'

      // Server-side filtering: products are already filtered at API level
      if (filterMode === 'server') {
        return products.value
      }

      // Client-side filtering: apply filters locally
      // If no facets are selected, apply pagination to all products
      if (selectedFacets.value.length === 0) {
        const startIndex = 0
        const endIndex = page.value * pageSize
        return allProducts.value.slice(startIndex, endIndex)
      }

      // Group selected facets by facet group using product facet data
      const selectedFacetsByGroup = {}

      // Get facet group information for each selected facet value from product data
      selectedFacets.value.forEach(facetValueId => {
        // Find which facet group this facet value belongs to by checking all products
        for (const product of allProducts.value) {
          // Check product facet values
          if (product.facetValues) {
            for (const facetValue of product.facetValues) {
              if (facetValue.id === facetValueId && facetValue.facet) {
                const facetName = facetValue.facet.name
                if (!selectedFacetsByGroup[facetName]) {
                  selectedFacetsByGroup[facetName] = []
                }
                if (!selectedFacetsByGroup[facetName].includes(facetValueId)) {
                  selectedFacetsByGroup[facetName].push(facetValueId)
                }
                break
              }
            }
          }

          // Check variant facet values
          for (const variant of product.variants) {
            if (variant.facetValues) {
              for (const facetValue of variant.facetValues) {
                if (facetValue.id === facetValueId && facetValue.facet) {
                  const facetName = facetValue.facet.name
                  if (!selectedFacetsByGroup[facetName]) {
                    selectedFacetsByGroup[facetName] = []
                  }
                  if (!selectedFacetsByGroup[facetName].includes(facetValueId)) {
                    selectedFacetsByGroup[facetName].push(facetValueId)
                  }
                  break
                }
              }
            }
          }
        }
      })

      const filtered = allProducts.value.filter(product => {
        // Check if any variant in this product matches ALL facet groups
        const hasMatchingVariant = product.variants.some(variant => {
          // Check variant facet values
          const variantFacetValueIds = variant.facetValues?.map(fv => fv.id) || []
          // Check product facet values
          const productFacetValueIds = product.facetValues?.map(fv => fv.id) || []
          const allFacetValueIds = [...variantFacetValueIds, ...productFacetValueIds]

          // For each facet group, check if variant has ANY of the selected values (OR logic within group)
          const matchesAllGroups = Object.entries(selectedFacetsByGroup).every(([facetGroupName, selectedValues]) => {
            const hasMatchingValue = selectedValues.some(selectedId =>
              allFacetValueIds.includes(selectedId)
            )
            return hasMatchingValue
          })

          return matchesAllGroups
        })

        return hasMatchingVariant
      })

      // Apply pagination to filtered results
      const startIndex = 0
      const endIndex = page.value * pageSize
      return filtered.slice(startIndex, endIndex)
    })

    // Total number of filtered products (before pagination)
    const totalFilteredProducts = computed(() => {
      const filterMode = import.meta.env.VITE_FILTER_MODE || 'server'

      // Server-side filtering: use totalItems from API (which is now productCount)
      if (filterMode === 'server') {
        return totalItems.value
      }

      // Client-side filtering: calculate locally
      if (!allProducts.value || allProducts.value.length === 0) return 0

      // If no facets are selected, return total products
      if (selectedFacets.value.length === 0) return allProducts.value.length

      // Group selected facets by facet group using product facet data
      const selectedFacetsByGroup = {}

      // Get facet group information for each selected facet value from product data
      selectedFacets.value.forEach(facetValueId => {
        // Find which facet group this facet value belongs to by checking all products
        for (const product of allProducts.value) {
          // Check product facet values
          if (product.facetValues) {
            for (const facetValue of product.facetValues) {
              if (facetValue.id === facetValueId && facetValue.facet) {
                const facetName = facetValue.facet.name
                if (!selectedFacetsByGroup[facetName]) {
                  selectedFacetsByGroup[facetName] = []
                }
                if (!selectedFacetsByGroup[facetName].includes(facetValueId)) {
                  selectedFacetsByGroup[facetName].push(facetValueId)
                }
                break
              }
            }
          }

          // Check variant facet values
          for (const variant of product.variants) {
            if (variant.facetValues) {
              for (const facetValue of variant.facetValues) {
                if (facetValue.id === facetValueId && facetValue.facet) {
                  const facetName = facetValue.facet.name
                  if (!selectedFacetsByGroup[facetName]) {
                    selectedFacetsByGroup[facetName] = []
                  }
                  if (!selectedFacetsByGroup[facetName].includes(facetValueId)) {
                    selectedFacetsByGroup[facetName].push(facetValueId)
                  }
                  break
                }
              }
            }
          }
        }
      })

      const filtered = allProducts.value.filter(product => {
        const hasMatchingVariant = product.variants.some(variant => {
          const variantFacetValueIds = variant.facetValues?.map(fv => fv.id) || []
          const productFacetValueIds = product.facetValues?.map(fv => fv.id) || []
          const allFacetValueIds = [...variantFacetValueIds, ...productFacetValueIds]

          const matchesAllGroups = Object.entries(selectedFacetsByGroup).every(([facetGroupName, selectedValues]) => {
            const hasMatchingValue = selectedValues.some(selectedId =>
              allFacetValueIds.includes(selectedId)
            )
            return hasMatchingValue
          })

          return matchesAllGroups
        })

        return hasMatchingVariant
      })

      return filtered.length
    })

    // Helper function to find the facet group for a facet value using centralized filter data
    const findFacetGroupForValue = (facetValue) => {
      // Use centralized filter data from Pinia store
      const { allFacets } = appStore

      // Search through all facets to find which facet group this value belongs to
      for (const facet of allFacets) {
        if (facet.values && facet.values.some(value => value.id === facetValue.id || value.code === facetValue.code)) {
          return {
            id: facet.code || facet.id,
            name: facet.name
          }
        }
      }

      // If no facet group found, try to infer from facet value data
      // Check if facet value has a facet property (for client-side mode)
      if (facetValue.facet) {
        return {
          id: facetValue.facet.code || facetValue.facet.id,
          name: facetValue.facet.name
        }
      }

      // Fallback: infer from code or use generic grouping
      const facetId = facetValue.code ? facetValue.code.split('-')[0] : 'other'
      const facetName = facetValue.name ? facetValue.name.split(' ')[0] : 'Other'

      return {
        id: facetId,
        name: facetName
      }
    }

    // Helper function to check if a facet value should be filtered out
    const shouldFilterOutFacetValue = (facetValue, facetGroup) => {
      // Always filter out 'category' facet from filter panel
      // Users are already viewing a specific collection, so category filtering doesn't make sense
      // Only filter out if the facet GROUP is named 'category', not individual facet values
      const facetGroupName = facetGroup?.name?.toLowerCase() || ''
      return facetGroupName === 'category'
    }

    // Extract unique facets from all loaded products (like search page)
    const extractedFacets = computed(() => {
      const filterMode = import.meta.env.VITE_FILTER_MODE || 'server'

      // Server-side mode: use facets from collectionProductSummary API
      if (filterMode === 'server') {
        // console.log('🔧 SERVER MODE: Processing facets from collectionProductSummary')

        const facetGroups = {}

        // Use allAvailableProducts for facet extraction to show ALL facet values, not just filtered ones
        const productsForFacetExtraction = allAvailableProducts.value.length > 0 ? allAvailableProducts.value : allProducts.value

        // Collect all facet values from all products in collectionProductSummary
        productsForFacetExtraction.forEach(product => {
          // Collect facet values from the PRODUCT
          if (product.facetValues) {
            product.facetValues.forEach(facetValue => {
              // Find the facet group for this facet value using centralized filter data
              const facetGroup = findFacetGroupForValue(facetValue)

              // Skip the 'category' facet since we're already viewing a specific collection
              if (shouldFilterOutFacetValue(facetValue, facetGroup)) {
                return
              }

              if (!facetGroups[facetGroup.id]) {
                facetGroups[facetGroup.id] = {
                  id: facetGroup.id,
                  name: facetGroup.name,
                  values: []
                }
              }

              // Add facet value if not already in the group
              if (!facetGroups[facetGroup.id].values.some(fv => fv.id === facetValue.id)) {
                facetGroups[facetGroup.id].values.push({
                  id: facetValue.id,
                  name: facetValue.name
                })
              }
            })
          }
        })

        // Maintain consistent ordering for facet groups
        const facetGroupOrder = [
          'brand', 'color', 'type', 'plant-type', 'material', 'style'
        ]

        const sortedFacetGroups = Object.values(facetGroups).sort((a, b) => {
          const indexA = facetGroupOrder.indexOf(a.id)
          const indexB = facetGroupOrder.indexOf(b.id)

          // If both groups are in the predefined order, sort by that order
          if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB
          }

          // If only one is in the predefined order, put it first
          if (indexA !== -1) return -1
          if (indexB !== -1) return 1

          // If neither is in the predefined order, sort alphabetically by name
          return a.name.localeCompare(b.name)
        })

        // console.log('🔧 Server-side facet groups from collectionProductSummary:', sortedFacetGroups)
        return sortedFacetGroups
      }

      // Client-side mode: use centralized filter data for grouping
      const facetGroups = {}

      // Use allAvailableProducts for facet extraction to show ALL facet values, not just filtered ones
      const productsForFacetExtraction = allAvailableProducts.value.length > 0 ? allAvailableProducts.value : allProducts.value

      // Collect all facet values from all products and their variants
      const allFacetValues = []

      productsForFacetExtraction.forEach(product => {
        // Collect facet values from the PRODUCT
        if (product.facetValues) {
          product.facetValues.forEach(facetValue => {
            allFacetValues.push(facetValue)
          })
        }

        // Also collect facet values from the VARIANTS
        product.variants.forEach(variant => {
          if (variant.facetValues) {
            variant.facetValues.forEach(facetValue => {
              allFacetValues.push(facetValue)
            })
          }
        })
      })

      // console.log('All collected facet values for collection:', allFacetValues)

      // Group facet values using centralized filter data
      allFacetValues.forEach(facetValue => {
        // Find the facet group for this facet value using centralized filter data
        const facetGroup = findFacetGroupForValue(facetValue)

        // Skip the 'category' facet since we're already viewing a specific collection
        if (shouldFilterOutFacetValue(facetValue, facetGroup)) {
          return
        }

        if (!facetGroups[facetGroup.id]) {
          facetGroups[facetGroup.id] = {
            id: facetGroup.id,
            name: facetGroup.name,
            values: []
          }
        }

        // Add facet value if not already in the group
        if (!facetGroups[facetGroup.id].values.some(fv => fv.id === facetValue.id)) {
          facetGroups[facetGroup.id].values.push({
            id: facetValue.id,
            name: facetValue.name
          })
        }
      })

      // Maintain consistent ordering for facet groups
      const facetGroupOrder = [
        'brand', 'color', 'type', 'plant-type', 'material', 'style'
      ]

      const sortedFacetGroups = Object.values(facetGroups).sort((a, b) => {
        const indexA = facetGroupOrder.indexOf(a.id)
        const indexB = facetGroupOrder.indexOf(b.id)

        // If both groups are in the predefined order, sort by that order
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB
        }

        // If only one is in the predefined order, put it first
        if (indexA !== -1) return -1
        if (indexB !== -1) return 1

        // If neither is in the predefined order, sort alphabetically by name
        return a.name.localeCompare(b.name)
      })

      // console.log('Client-side facet groups for collection:', sortedFacetGroups)
      return sortedFacetGroups
    })

    // Computed property to organize all collections into hierarchy
    const organizedCollections = computed(() => {
      if (!allCollections.value.length) return []

      // Find root collections (collections without parent or with __root_collection__ parent)
      const rootCollections = allCollections.value.filter(collection =>
        !collection.parent || collection.parent.name === '__root_collection__'
      )

      // Use the existing children structure from the API response
      const hierarchy = rootCollections.map(rootCollection => ({
        ...rootCollection,
        children: rootCollection.children || []
      }))

      return hierarchy
    })

    // Find parent collection when viewing a subcategory
    const currentParentCollection = computed(() => {
      if (!collection.value) {
        // console.log('🔍 No collection.value')
        return null
      }

      // console.log('🔍 Current collection data:', collection.value)

      // Check if current collection has a parent
      if (!collection.value.parent) {
        // console.log('🔍 No parent for current collection:', collection.value.name)
        return null
      }

      // console.log('🔍 Collection parent data:', collection.value.parent)
      // console.log('🔍 All collections:', allCollections.value)

      // Find the parent collection in allCollections by ID or slug
      const parent = allCollections.value.find(coll => {
        // Try matching by ID first
        if (coll.id === collection.value.parent.id) {
          // console.log('🔍 Parent found by ID match:', coll.id, '===', collection.value.parent.id)
          return true
        }
        // If that fails, try matching by slug
        if (coll.slug === collection.value.parent.slug) {
          // console.log('🔍 Parent found by slug match:', coll.slug, '===', collection.value.parent.slug)
          return true
        }
        // If that fails, try matching by name
        if (coll.name === collection.value.parent.name) {
          // console.log('🔍 Parent found by name match:', coll.name, '===', collection.value.parent.name)
          return true
        }
        return false
      })

      // console.log('🔍 Found parent collection:', parent)
      return parent
    })

    // Alternative approach: check if current collection is a child of any root collection
    const isCurrentCollectionChild = computed(() => {
      if (!collection.value) return false

      // Check if current collection is a child of any root collection
      for (const rootCollection of organizedCollections.value) {
        if (rootCollection.children && rootCollection.children.some(child => child.slug === collection.value.slug)) {
          // console.log('🔍 Current collection is child of:', rootCollection.name)
          return true
        }
      }

      // console.log('🔍 Current collection is NOT a child (it is a root collection)')
      return false
    })

    // Direct approach: find which root collection contains the current subcategory
    const parentOfCurrentCollection = computed(() => {
      if (!collection.value) return null

      // If current collection has a direct parent, use that
      if (collection.value.parent) {
        // console.log('🔍 Using direct parent from collection data:', collection.value.parent)
        return collection.value.parent
      }

      // Otherwise, find which root collection contains this subcategory
      for (const rootCollection of organizedCollections.value) {
        if (rootCollection.children && rootCollection.children.some(child => child.slug === collection.value.slug)) {
          // console.log('🔍 Found parent by children search:', rootCollection.name)
          return rootCollection
        }
      }

      // console.log('🔍 No parent found for current collection')
      return null
    })

    // Computed property for product router links (clean URLs without facets)
    const productLinks = computed(() => {
      // console.log('Computing product links:', filteredProducts.value)
      return filteredProducts.value.map(product => ({
        id: product.id,
        path: `/products/${product.slug}`
      }))
    })

    // Pagination computed properties
    const totalPages = computed(() => {
      return Math.ceil(totalFilteredProducts.value / pageSize)
    })

    const visiblePages = computed(() => {
      const current = page.value
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

    // Pagination methods
    const goToPage = (pageNum) => {
      if (pageNum === page.value || loadingMore.value) return

      // console.log('Going to page:', pageNum)
      page.value = pageNum
      loadCollection(false) // Don't reset, just load the specific page

      // Scroll to top of the page
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }


    const toggleFacet = (facetValueId) => {
      if (selectedFacets.value.includes(facetValueId)) {
        selectedFacets.value = selectedFacets.value.filter(id => id !== facetValueId)
      } else {
        selectedFacets.value.push(facetValueId)
      }
      // console.log('Selected facets after toggle:', selectedFacets.value)
      loadCollection(true) // Reset and reload with new filters

      // Scroll to top when applying filters
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const selectAllFacetValues = (facet) => {
      // console.log('Selecting all facet values for:', facet.name)

      // Get all facet value IDs for this facet
      const allFacetValueIds = facet.values.map(value => value.id)

      // Check if all values are already selected
      const allSelected = allFacetValueIds.every(id => selectedFacets.value.includes(id))

      if (allSelected) {
        // If all are selected, deselect all values for this facet
        selectedFacets.value = selectedFacets.value.filter(id => !allFacetValueIds.includes(id))
        // console.log('Deselected all facet values for:', facet.name)
      } else {
        // If not all are selected, select all values for this facet
        // First remove any existing values for this facet to avoid duplicates
        selectedFacets.value = selectedFacets.value.filter(id => !allFacetValueIds.includes(id))
        // Then add all values for this facet
        selectedFacets.value.push(...allFacetValueIds)
        // console.log(`Selected all ${allFacetValueIds.length} facet values for:`, facet.name)
      }

      // console.log('Selected facets after select all:', selectedFacets.value)
      loadCollection(true) // Reset and reload with new filters

      // Scroll to top when applying filters
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // Check if all facet values in a group are selected
    const isAllFacetValuesSelected = (facet) => {
      if (!facet.values || !Array.isArray(facet.values) || facet.values.length === 0) {
        return false
      }
      const allFacetValueIds = facet.values.map(value => value.id)
      return allFacetValueIds.every(id => selectedFacets.value.includes(id))
    }

    const toggleFacetGroup = (facetId) => {
      if (!facetId) {
        console.warn('Cannot toggle facet group: facetId is undefined')
        return
      }
      expandedFacetGroups.value[facetId] = !expandedFacetGroups.value[facetId]
      // console.log(`Toggled facet group ${facetId}:`, expandedFacetGroups.value[facetId])
    }

    const getFacetGroupState = (facetId) => {
      if (!facetId) return true
      // Return true by default (expanded), unless explicitly set to false
      return expandedFacetGroups.value[facetId] !== false
    }

    const toggleCategory = (categoryId) => {
      if (!categoryId) {
        console.warn('Cannot toggle category: categoryId is undefined')
        return
      }
      expandedCategories.value[categoryId] = !expandedCategories.value[categoryId]
      // console.log(`Toggled category ${categoryId}:`, expandedCategories.value[categoryId])
    }

    const getCategoryState = (categoryId) => {
      if (!categoryId) return false
      return expandedCategories.value[categoryId] === true
    }

    // Mobile filter methods
    const openMobileFilters = () => {
      // console.log('🔍 FILTER BUTTON CLICKED!')
      // console.log('🔍 showMobileFilters before:', showMobileFilters.value)
      showMobileFilters.value = true
      // console.log('🔍 showMobileFilters after:', showMobileFilters.value)
      // window.alert('🚨 FILTER BUTTON CLICKED - showMobileFilters set to TRUE!')
    }

    const clearAllFilters = () => {
      selectedFacets.value = []
      loadCollection(true) // Reset and reload with new filters
      showMobileFilters.value = false
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const applyMobileFilters = () => {
      // Filters are already applied when toggled, just close modal
      // console.log('🔍 applyMobileFilters called - closing modal')
      showMobileFilters.value = false
    }

    // Watch showMobileFilters changes
    watch(showMobileFilters, (newValue) => {
      // console.log('🔍 showMobileFilters changed to:', newValue)
      if (newValue) {
        // console.log('🔍 Mobile filter modal should now be visible!')
        // Check if the modal element exists in DOM after a short delay
        setTimeout(() => {
          const modalElement = document.querySelector('.fixed.inset-0.z-50')
          // console.log('🔍 Modal element found:', modalElement)
          // if (modalElement) {
          //   console.log('✅ Modal is in DOM!')
          // } else {
          //   console.log('❌ Modal not found in DOM')
          // }
        }, 100)
      }
    })

    const handleLoadMore = () => {

      page.value++ // Increment page for "load more" functionality
      loadCollection(false)
    }

    onMounted(() => {
      loadAllCollections()
      loadCollection()

      // Auto-expand parent category when viewing a subcategory
      watch([allCollections, collection], () => {
        if (collection.value && allCollections.value.length > 0) {
          // console.log('🔧 Auto-expanding categories for collection:', collection.value.name)
          // console.log('🔧 All collections:', allCollections.value)
          // console.log('🔧 Organized collections:', organizedCollections.value)

          // Find which root collection contains the current collection
          for (const rootCollection of organizedCollections.value) {
            // If current collection is a direct child of this root collection
            if (rootCollection.children && rootCollection.children.some(child => child.slug === collection.value.slug)) {
              // Auto-expand the parent category
              expandedCategories.value[rootCollection.id] = true
              // console.log(`🔧 Auto-expanded parent category: ${rootCollection.name} (ID: ${rootCollection.id})`)
              break
            }
            // If current collection IS the root collection and has children, auto-expand it
            else if (rootCollection.slug === collection.value.slug && rootCollection.children && rootCollection.children.length > 0) {
              expandedCategories.value[rootCollection.id] = true
              // console.log(`🔧 Auto-expanded root category: ${rootCollection.name} (ID: ${rootCollection.id})`)
              break
            }
          }

          // console.log('🔧 Final expanded categories state:', expandedCategories.value)
        }
      }, { immediate: true })

      // Server-side facets will be loaded by the collection watcher
      const filterMode = import.meta.env.VITE_FILTER_MODE || 'server'
      if (filterMode === 'server') {
        // console.log('🔧 SERVER MODE: Initial mount, server-side facets will be loaded when collection loads')
      }

      // Initialize infinite scroll observer
      nextTick(() => {
        const throttledLoad = throttle(() => {
          if (hasMoreProducts.value && !loadingMore.value) {
            handleLoadMore()
          }
        }, 800)

        observer.value = new IntersectionObserver(entries => {
          if (entries[0].isIntersecting) {
            throttledLoad()
          }
        }, {
          rootMargin: '100px', // Trigger 100px before reaching the sentinel
          threshold: 0.1 // Trigger when 10% of the sentinel is visible
        })

        if (sentinel.value) {
          observer.value.observe(sentinel.value)
        }
      })
    })

    // Watch for route changes to load new collection and clear selected facets
    watch(() => route.params.slug, () => {
      // Clear selected facets when changing collections
      selectedFacets.value = []
      // console.log('Cleared selected facets for new collection:', route.params.slug)
      loadCollection()

      // Scroll to top when changing collections
      window.scrollTo({ top: 0, behavior: 'smooth' })

      // Note: Server-side facets are now loaded from collectionProductSummary API
      // No need for separate server-side facet loading
    })

    // Cleanup observer on unmount
    onUnmounted(() => {
      if (observer.value) {
        observer.value.disconnect()
      }
    })

    return {
      collection,
      products,
      filteredProducts,
      totalFilteredProducts,
      productLinks,
      isLoading,
      loadingMore,
      selectedFacets,
      sentinel,
      totalItems,
      hasMoreProducts,
      page,
      filtersLoading,
      extractedFacets,
      organizedCollections,
      currentParentCollection,
      isCurrentCollectionChild,
      parentOfCurrentCollection,
      route,
      formatCurrency,
      getPriceRange,
      formatPriceRange,
      getStockStatus,
      toggleFacet,
      selectAllFacetValues,
      isAllFacetValuesSelected,
      toggleFacetGroup,
      getFacetGroupState,
      toggleCategory,
      getCategoryState,
      openMobileFilters,
       clearAllFilters,
       applyMobileFilters,
       showMobileFilters,
       showScrollToTop,
       scrollToTop,
      handleLoadMore,
      // Pagination
      totalPages,
      visiblePages,
      goToPage,
      pageSize
    }
  }
}
</script>

<style scoped>
/* Mobile filter bottom sheet slide animation */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease-in-out;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(100%);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(100%);
}

.slide-up-enter-to,
.slide-up-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>