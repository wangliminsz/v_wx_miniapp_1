<template>
  <span :style="getTextStyles()">{{ node.text }}</span>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  node: {
    type: Object,
    required: true,
  },
})

const getTextStyles = () => {
  const styles = {}
  if (props.node.bold) styles.fontWeight = 'bold'
  if (props.node.italic) styles.fontStyle = 'italic'
  if (props.node.underline) styles.textDecoration = 'underline'
  return styles
}
</script>