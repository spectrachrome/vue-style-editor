<template>
  <eox-layercontrol
    ref="layerControlRef"
    idProperty="id"
    titleProperty="title"
  ></eox-layercontrol>
</template>

<script setup>
import { ref } from 'vue'

const layerControlRef = ref(null)

defineExpose({ layerControlRef })
</script>

<style scoped>
/* No component-specific styles needed - positioning handled by parent */
</style>