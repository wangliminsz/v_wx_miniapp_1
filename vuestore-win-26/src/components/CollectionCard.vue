<template>
  <router-link :to="`/collections/${collection.slug}`"
    class="group block bg-card rounded-lg overflow-hidden border border-border hover:shadow-lg transition-shadow">

    <!-- group-hover:scale-105 transition-transform duration-300 -->
    <!-- <div class="aspect-square relative bg-muted">
      <img
        v-if="collection.featuredAsset"
        :src="collection.featuredAsset.preview"
        :alt="collection.name"
        class="w-50 h-50 object-center object-cover"
      />
      <div v-else class="w-50 h-50 flex items-center justify-center text-muted-foreground">
        <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
        </svg>
      </div>
    </div>   -->

    <div class="flex flex-col sm:flex-row items-center justify-between py-4 sm:gap-4 sm:p-4">

      <div class="shrink-0">
        <img v-if="collection.featuredAsset" :src="collection.featuredAsset.preview" :alt="collection.name" class="
        w-[60px] h-[60px]      /* default size */
        md:w-[80px] md:h-[80px] /* larger on md+ */
        object-cover rounded-md
        group-hover:scale-105 transition-transform duration-20
      " />
      </div>

      <div class="mt-5 sm:mt-0">
        <h3 class="font-body font-medium line-clamp-2 group-hover:text-primary transition-colors">
          {{ collection.name }}
        </h3>
        <p v-if="collection.productCount" class="text-sm text-muted-foreground">
          {{ collection.productCount }} products
        </p>
      </div>
    </div>


  </router-link>
</template>

<script>
export default {
  name: 'CollectionCard',
  props: {
    collection: {
      type: Object,
      required: true
    }
  }
}
</script>