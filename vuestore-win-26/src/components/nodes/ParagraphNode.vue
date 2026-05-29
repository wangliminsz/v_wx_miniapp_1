<template>
  <p>
    <TextNode v-for="child in node.children" :key="child.version || Math.random()" :node="child" />
  </p>
</template>

<script setup>
import { defineProps } from 'vue'
import TextNode from './TextNode.vue'

const props = defineProps({
  node: {
    type: Object,
    required: true,
  },
})
</script>