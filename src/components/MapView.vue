<!-- MapView component for the main map display -->
<template>
  <eox-map
    ref="mapRef"
    :center="[15, 48]"
    :layers="[
      {
        type: 'Tile',
        source: { type: 'OSM' },
        id: 'osm',
        title: 'OpenStreetMap',
        properties: { visible: true },
      },
    ]"
    :zoom="7"
  >
  </eox-map>
</template>

<script setup>
import { ref } from 'vue'

const mapRef = ref(null)

defineExpose({ mapRef })
</script>

<style scoped>
eox-map {
  width: 100%;
  height: 100%;
  z-index: 1000;
}
</style>