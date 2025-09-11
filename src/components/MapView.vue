<!-- MapView component for the main map display -->
<template>
  <eox-map
    ref="mapRef"
    :center="[15, 48]"
    :layers="mapLayers"
    :zoom="7"
  >
  </eox-map>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useExamples } from '../composables/useExamples.js'

const mapRef = ref(null)
const { currentExampleLayer } = useExamples()

const baseLayers = [
  {
    type: 'Tile',
    source: { type: 'OSM' },
    id: 'osm',
    title: 'OpenStreetMap',
    properties: { visible: true },
  }
]

const mapLayers = computed(() => {
  const layers = [...baseLayers]
  if (currentExampleLayer.value) {
    layers.push(currentExampleLayer.value)
  }
  return layers
})

defineExpose({ mapRef })
</script>

<style scoped>
eox-map {
  width: 100%;
  height: 100%;
  z-index: 1000;
}
</style>