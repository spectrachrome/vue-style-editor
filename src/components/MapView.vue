<!-- MapView component for the main map display -->
<template>
  <eox-map ref="mapRef" :center="[15, 48]" :zoom="7"> </eox-map>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useExamples } from '../composables/useExamples.js'

const mapRef = ref(null)
const { dataLayers } = useExamples()

const baseLayers = [
  {
    type: 'Tile',
    source: { type: 'OSM' },
    id: 'osm',
    title: 'OpenStreetMap',
    properties: {
      id: 'osm',
      title: 'OpenStreetMap',
      visible: true,
    },
  },
]

const mapLayers = computed(() => {
  const exampleLayers = dataLayers.value

  // Check if example already includes OSM base layer
  const hasOSMInExample = exampleLayers.some(
    (layer) =>
      layer.source?.type === 'OSM' || (layer.type === 'Tile' && layer.source?.type === 'OSM'),
  )

  // Only add base layers if example doesn't already include them
  const layers = hasOSMInExample ? [...exampleLayers] : [...baseLayers, ...exampleLayers]

  console.log(
    'MapView updated with',
    layers.length,
    'layers',
    hasOSMInExample ? '(example includes base layers)' : '(added base layers)',
  )

  return layers
})

// Convert custom style to eox-map compatible format
const convertStyleForEoxMap = (style) => {
  if (!style) return undefined

  // If it's already a simple style object that might work with eox-map, keep it
  // For complex custom styles, we might need to remove them and let eox-map handle defaults
  try {
    // Check if it looks like a complex custom style format
    if (style.legend || style.rules || Array.isArray(style)) {
      console.log('Complex custom style detected, letting eox-map handle styling')
      return undefined // Let eox-map use default styling
    }

    // For simple style objects, pass them through
    return style
  } catch (error) {
    console.warn('Error processing style, using defaults:', error)
    return undefined
  }
}

// Sanitize layer to ensure it has all required properties for eox-map
const sanitizeLayer = (layer) => {
  // Deep clone to remove Vue reactivity proxies and ensure plain objects
  const cloned = JSON.parse(JSON.stringify(layer))

  const sanitized = {
    ...cloned,
    // Ensure required properties exist
    id: cloned.id || cloned.properties?.id || `layer-${Date.now()}`,
    type: cloned.type || 'Vector',
    properties: {
      ...cloned.properties,
      id: cloned.id || cloned.properties?.id || `layer-${Date.now()}`,
      title: cloned.title || cloned.properties?.title || 'Unnamed Layer',
    },
  }

  // Fix FlatGeoBuf source type naming
  if (sanitized.source?.type === 'FlatGeoBuf') {
    console.log('Converting FlatGeoBuf source type name')
    sanitized.source.type = 'FlatGeoBuf'
    // or could be: 'FlatGeobuf', 'vector', etc.
  }

  // Handle style conversion
  const convertedStyle = convertStyleForEoxMap(sanitized.style)
  if (convertedStyle) {
    sanitized.style = convertedStyle
  } else {
    // Remove style if it can't be converted - let eox-map use defaults
    delete sanitized.style
    console.log('Removed incompatible style from layer:', sanitized.properties?.title)
  }

  // Remove potentially problematic properties
  if (sanitized.extent && !Array.isArray(sanitized.extent)) {
    delete sanitized.extent
  }

  // Remove undefined values that might cause issues
  Object.keys(sanitized).forEach((key) => {
    if (sanitized[key] === undefined) {
      delete sanitized[key]
    }
  })

  return sanitized
}

// Set layers property directly on the web component
const updateMapLayers = async () => {
  await nextTick()
  if (mapRef.value) {
    const layers = mapLayers.value.map(sanitizeLayer)
    console.log('About to set', layers.length, 'sanitized layers on eox-map')

    try {
      console.log('eox-map instance:', mapRef.value)
      console.log('Layers to set:', layers)

      // Check what source types are supported
      if (mapRef.value.constructor && mapRef.value.constructor.supportedSourceTypes) {
        console.log('Supported source types:', mapRef.value.constructor.supportedSourceTypes)
      }

      mapRef.value.layers = layers
      console.log('Successfully set layers on eox-map')
    } catch (error) {
      console.error('Error setting layers on eox-map:', error)
      console.error('Error details:', error.message)
      console.log('Layer structures that failed:')
      layers.forEach((layer, index) => {
        console.log(`Layer ${index}:`, layer)
        if (layer.source) {
          console.log(`  Source type: ${layer.source.type}`)
          console.log(`  Source:`, layer.source)
        }
      })
    }
  }
}

// Watch for changes and update the map
watch(mapLayers, updateMapLayers, { immediate: false })

// Initialize layers after mount
onMounted(() => {
  updateMapLayers()
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
