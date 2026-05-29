<template>
  <div class="rich-text">
    <component
      :is="renderNode(node)"
      v-for="node in content.root.children"
      :key="node.version || Math.random()"
      :node="node"
    />
  </div>
</template>

<script setup>
import { defineProps } from 'vue'
import ParagraphNode from './nodes/ParagraphNode.vue'

const props = defineProps({
  content: {
    type: Object,
    required: true,
  },
})

const renderNode = (node) => {
  switch (node.type) {
    case 'paragraph':
      return ParagraphNode
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      return node.type
    case 'ul':
      return 'ul'
    case 'ol':
      return 'ol'
    case 'li':
      return 'li'
    case 'blockquote':
      return 'blockquote'
    default:
      return 'div'
  }
}
</script>

<style scoped>
.rich-text {
  line-height: 1.7;
  color: #374151;
}

.rich-text h1,
.rich-text h2,
.rich-text h3,
.rich-text h4,
.rich-text h5,
.rich-text h6 {
  margin-top: 2rem;
  margin-bottom: 1rem;
  font-weight: 600;
  color: #111827;
}

.rich-text h1 { font-size: 2rem; }
.rich-text h2 { font-size: 1.75rem; }
.rich-text h3 { font-size: 1.5rem; }
.rich-text h4 { font-size: 1.25rem; }
.rich-text h5 { font-size: 1.125rem; }
.rich-text h6 { font-size: 1rem; }

.rich-text ul,
.rich-text ol {
  margin: 1rem 0;
  padding-left: 1.5rem;
}

.rich-text li {
  margin: 0.5rem 0;
}

.rich-text blockquote {
  border-left: 4px solid #d1d5db;
  padding-left: 1rem;
  margin: 1rem 0;
  font-style: italic;
  color: #6b7280;
}
</style>