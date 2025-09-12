<!-- MapView component for the main map display -->
<template>
  <eox-map ref="mapRef" :center="mapCenter" :zoom="mapZoom"> </eox-map>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useExamples } from '../composables/useExamples.js'
import proj4 from 'proj4'

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

// Calculate map center and zoom from layer extents
const mapViewParams = computed(() => {
  const exampleLayers = dataLayers.value

  // Look for layers with calculated extents
  const layersWithExtent = exampleLayers.filter(layer =>
    layer.extent && Array.isArray(layer.extent) && layer.extent.length === 4
  )

  if (layersWithExtent.length > 0) {
    // Use the first layer with an extent to set the map view
    const extent = layersWithExtent[0].extent
    const center = calculateCenterFromExtent(extent)
    const zoom = calculateZoomFromExtent(extent)

    return { center, zoom }
  }

  // Default view for when no extent is available
  return { center: [15, 48], zoom: 7 }
})

const mapCenter = computed(() => mapViewParams.value.center)
const mapZoom = computed(() => mapViewParams.value.zoom)

const mapLayers = computed(() => {
  const exampleLayers = dataLayers.value || []

  // Ensure we have an array of layers
  if (!Array.isArray(exampleLayers)) {
    console.warn('mapLayers computed - exampleLayers is not an array:', exampleLayers)
    return [...baseLayers]
  }

  // Check if example already includes OSM base layer
  const hasOSMInExample = exampleLayers.some(
    (layer) =>
      layer?.source?.type === 'OSM' || (layer?.type === 'Tile' && layer?.source?.type === 'OSM'),
  )

  // Only add base layers if example doesn't already include them
  const layers = hasOSMInExample ? [...exampleLayers] : [...baseLayers, ...exampleLayers]

  return layers
})

// Convert custom style to eox-map compatible format
const convertStyleForEoxMap = (style) => {
  if (!style) return undefined

  // Keep it simple - just pass the style through
  // Let eox-map handle any parsing errors gracefully
  return style
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
    sanitized.source.type = 'FlatGeoBuf'
    // or could be: 'FlatGeobuf', 'vector', etc.
  }

  // Handle style - ONLY for Vector layers
  if (sanitized.type === 'Vector' && sanitized.style) {
    // For Vector layers, put style in both places
    sanitized.properties.layerConfig = {
      ...sanitized.properties.layerConfig,
      style: sanitized.style
    }
    // Keep sanitized.style as is for Vector layers
  } else if (sanitized.type !== 'Vector') {
    // Remove style from non-Vector layers
    delete sanitized.style
    if (sanitized.properties?.layerConfig?.style) {
      delete sanitized.properties.layerConfig.style
    }
  }

  // Remove potentially problematic properties
  if (sanitized.extent && !Array.isArray(sanitized.extent)) {
    delete sanitized.extent
  }

  // Remove undefined values that might cause issues, but preserve essential properties
  Object.keys(sanitized).forEach((key) => {
    if (sanitized[key] === undefined) {
      // Don't delete essential properties that eox-map requires
      if (!['id', 'type', 'source', 'properties'].includes(key)) {
        delete sanitized[key]
      } else {
        console.warn(`Essential property '${key}' is undefined in layer:`, sanitized)
      }
    }
  })

  return sanitized
}

// Helper function to calculate center from extent (in EPSG:3857)
function calculateCenterFromExtent(extent) {
  const [minX, minY, maxX, maxY] = extent
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2

  // Convert from EPSG:3857 back to EPSG:4326 for the map
  const [lon, lat] = proj4('EPSG:3857', 'EPSG:4326', [centerX, centerY])
  return [lon, lat]
}

// Helper function to calculate appropriate zoom level from extent
function calculateZoomFromExtent(extent) {
  const [minX, minY, maxX, maxY] = extent
  const width = maxX - minX
  const height = maxY - minY

  // Simple heuristic for zoom level based on extent size
  // These values are rough approximations for EPSG:3857
  const maxDimension = Math.max(width, height)

  if (maxDimension > 20000000) return 2  // World view
  if (maxDimension > 10000000) return 3  // Continental
  if (maxDimension > 5000000) return 4   // Large country
  if (maxDimension > 2000000) return 5   // Country
  if (maxDimension > 1000000) return 6   // Large region
  if (maxDimension > 500000) return 7    // Region
  if (maxDimension > 200000) return 8    // Large city
  if (maxDimension > 100000) return 9    // City
  if (maxDimension > 50000) return 10    // Town
  if (maxDimension > 20000) return 11    // District
  if (maxDimension > 10000) return 12    // Neighborhood
  if (maxDimension > 5000) return 13     // Small area
  if (maxDimension > 2000) return 14     // Very small area
  return 15  // Maximum detail
}

// Set layers property directly on the web component
const updateMapLayers = async () => {
  await nextTick()
  if (mapRef.value) {
    const layers = mapLayers.value.map(sanitizeLayer)


    try {
      
      mapRef.value.layers = layers
      
    } catch (error) {
      console.error('Error setting layers on eox-map:', error)
      console.error('Layer details:', layers.map(l => ({ id: l.id, type: l.type, hasStyle: !!l.style })))
    }
  } else {
    console.warn('MapView: mapRef.value is null/undefined in updateMapLayers')
  }
}

// Update map view when extent changes
const updateMapView = async () => {
  await nextTick()
  if (mapRef.value) {
    const { center, zoom } = mapViewParams.value

    // Update map center and zoom
    mapRef.value.center = center
    mapRef.value.zoom = zoom
  }
}

// Watch for changes and update the map
watch(mapLayers, updateMapLayers, { immediate: false })
watch(mapViewParams, updateMapView, { immediate: false })

// Initialize layers after mount
onMounted(() => {
  updateMapLayers()
  updateMapView()
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
