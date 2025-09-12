<template>
  <eox-layercontrol
    ref="layerControlRef"
    idProperty="id"
    titleProperty="title"
    @layerConfig:change="handleLayerConfigChange"
  ></eox-layercontrol>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useExamples } from '../composables/useExamples.js'

const layerControlRef = ref(null)
const { currentExampleStyle, updateCurrentStyle } = useExamples()

const handleLayerConfigChange = (event) => {
  console.log('LayerControl changed:', JSON.stringify(event.detail, null, 2))
  
  // TODO: Once we see the actual event structure, implement the minimal mapping needed
}

defineExpose({ layerControlRef })
</script>

<style scoped>
/* No component-specific styles needed - positioning handled by parent */
</style>