<template>
  <span
    v-if="count > 0"
    class="absolute -top-0.5 -right-0.5 bg-blue-500 text-white text-[10px] px-1 h-4 min-w-[16px] flex items-center justify-center rounded-full leading-none"
  >
    {{ count }}
  </span>
</template>

<script setup>
defineProps({
  count: {
    type: Number,
    required: true,
  },
})
</script>
