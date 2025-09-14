<template>
  <eox-layercontrol
    ref="layerControlRef"
    idProperty="id"
    titleProperty="title"
    :tools="['config', 'legend']"
    @layerConfig:change="handleLayerConfigChange"
  ></eox-layercontrol>
</template>

<script setup>
import { ref } from 'vue'

const layerControlRef = ref(null)

const handleLayerConfigChange = (event) => {
  console.log('LayerControl changed:', JSON.stringify(event.detail, null, 2))

  // TODO: Once we see the actual event structure, implement the minimal mapping needed
}

defineExpose({ layerControlRef })
</script>

<style scoped>
/* No component-specific styles needed - positioning handled by parent */
</style>
