<!-- MapView component for the main map display -->
<template>
  <div class="map-container">
    <eox-map ref="mapRef">
      <eox-map-tooltip
        :propertyTransform="tooltipPropertyTransform"
      ></eox-map-tooltip>
    </eox-map>

    <!-- Loading overlay - ONLY an overlay, never removes the map DOM -->
    <div v-if="isMapLoading" class="map-loading-overlay">
      <div class="loading-content">
        <progress class="circle large"></progress>
        <p class="loading-hint">{{ loadingHint }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useExamples } from '../composables/useExamples.js'
import { useLoading } from '../composables/useLoading.js'
import proj4 from 'proj4'

const mapRef = ref(null)
const { dataLayers, currentExampleStyle } = useExamples()
const { isMapLoading, loadingHint } = useLoading()
const shouldPreserveView = ref(false)
const hasInitializedView = ref(false)

// Tooltip configuration
const tooltipEnabled = computed(() => {
  return currentExampleStyle.value?.tooltip !== undefined
})

// Tooltip property transform function
const tooltipPropertyTransform = (param) => {
  // If no tooltip config in style, return param as-is for default behavior
  if (!currentExampleStyle.value?.tooltip) {
    return param
  }

  const tooltipConfig = currentExampleStyle.value.tooltip

  // If tooltip is an array of configurations (like in old code)
  if (Array.isArray(tooltipConfig)) {
    const tooltipProp = tooltipConfig.find((p) => p.id === param.key)
    if (!tooltipProp) return null

    // Format the value
    let value = param.value
    if (typeof value === 'object') {
      value = JSON.stringify(value)
    } else if (typeof value === 'number') {
      value = value.toFixed(4)
    }

    return {
      key: tooltipProp.title || param.key,
      value: `${value} ${tooltipProp.appendix || ''}`.trim()
    }
  }

  // If tooltip is a simple object or boolean
  if (typeof tooltipConfig === 'object') {
    // Support for simple key-value mapping
    if (tooltipConfig[param.key]) {
      return {
        key: tooltipConfig[param.key].title || param.key,
        value: param.value
      }
    }
  }

  // Default behavior - show all properties
  return param
}

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
  const layersWithExtent = exampleLayers.filter(
    (layer) => layer.extent && Array.isArray(layer.extent) && layer.extent.length === 4,
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

// Removed computed bindings - we'll set center/zoom directly on the map

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
      style: sanitized.style,
    }
    // Keep sanitized.style as is for Vector layers
  } else if (sanitized.type !== 'Vector') {
    // Remove style from non-Vector layers
    delete sanitized.style
    if (sanitized.properties?.layerConfig?.style) {
      delete sanitized.properties.layerConfig.style
    }
  }

  // Handle tooltip interactions based on style configuration
  if (sanitized.type === 'Vector') {
    // Always start with a clean interactions array for tooltips
    if (!sanitized.interactions) {
      sanitized.interactions = []
    }

    // Remove any existing tooltip interactions
    sanitized.interactions = sanitized.interactions.filter(
      interaction => !(interaction.type === 'select' && interaction.options?.condition === 'pointermove')
    )

    // Only add hover interaction if tooltip is configured in style
    if (currentExampleStyle.value?.tooltip) {
      sanitized.interactions.push({
        type: 'select',
        options: {
          condition: 'pointermove',
          tooltip: true
        }
      })
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

  if (maxDimension > 20000000) return 2 // World view
  if (maxDimension > 10000000) return 3 // Continental
  if (maxDimension > 5000000) return 4 // Large country
  if (maxDimension > 2000000) return 5 // Country
  if (maxDimension > 1000000) return 6 // Large region
  if (maxDimension > 500000) return 7 // Region
  if (maxDimension > 200000) return 8 // Large city
  if (maxDimension > 100000) return 9 // City
  if (maxDimension > 50000) return 10 // Town
  if (maxDimension > 20000) return 11 // District
  if (maxDimension > 10000) return 12 // Neighborhood
  if (maxDimension > 5000) return 13 // Small area
  if (maxDimension > 2000) return 14 // Very small area
  return 15 // Maximum detail
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
      console.error(
        'Layer details:',
        layers.map((l) => ({ id: l.id, type: l.type, hasStyle: !!l.style })),
      )
    }
  } else {
    console.warn('MapView: mapRef.value is null/undefined in updateMapLayers')
  }
}

// Update map view when extent changes
const updateMapView = async () => {
  // Skip view update if we're preserving the view or if we haven't initialized
  if (shouldPreserveView.value) {
    shouldPreserveView.value = false
    return
  }

  // Only update view for initial load or when data actually changes
  if (!hasInitializedView.value || !shouldPreserveView.value) {
    await nextTick()
    if (mapRef.value) {
      const { center, zoom } = mapViewParams.value

      // Update map center and zoom
      mapRef.value.center = center
      mapRef.value.zoom = zoom
      hasInitializedView.value = true
    }
  }
}



// Track last layer data to detect style-only changes
let lastLayerData = null

// Watch for layer changes and preserve view during style updates
watch(mapLayers, async (newLayers) => {
  // Capture current view before any updates
  let capturedView = null
  if (mapRef.value && lastLayerData) {
    // Check if this is a style-only update by comparing non-style properties
    const stripStyle = (layers) => layers.map(l => ({
      id: l.id,
      type: l.type,
      source: l.source,
      extent: l.extent
    }))

    const newStripped = JSON.stringify(stripStyle(newLayers))
    const lastStripped = JSON.stringify(stripStyle(lastLayerData))

    if (newStripped === lastStripped) {
      // Style-only update - capture current view and prevent auto-recentering
      // Get the actual current view from the OpenLayers map instance
      const olMap = mapRef.value?.map
      if (olMap) {
        const view = olMap.getView()
        const currentCenter = view.getCenter()
        const currentZoom = view.getZoom()

        // Convert from EPSG:3857 to EPSG:4326 for center
        const [lon, lat] = proj4('EPSG:3857', 'EPSG:4326', currentCenter)

        shouldPreserveView.value = true
        capturedView = {
          center: [lon, lat],
          zoom: currentZoom
        }
      }
    }
  }

  // Update layers
  await updateMapLayers()

  // Restore view if this was a style-only update
  if (capturedView && mapRef.value) {
    // Use nextTick instead of setTimeout for more reliable timing
    await nextTick()
    if (mapRef.value) {
      mapRef.value.center = capturedView.center
      mapRef.value.zoom = capturedView.zoom
    }
  }

  // Update tracking data
  lastLayerData = JSON.parse(JSON.stringify(newLayers))
}, { immediate: false })

watch(mapViewParams, updateMapView, { immediate: false })

// Initialize layers after mount
onMounted(async () => {
  await updateMapLayers()
  // Set initial view
  if (mapRef.value) {
    const { center, zoom } = mapViewParams.value
    mapRef.value.center = center
    mapRef.value.zoom = zoom
    hasInitializedView.value = true
  }
})

defineExpose({ mapRef })
</script>

<style scoped>
@import url('@eox/ui/style.css');

.map-container {
  position: relative;
  width: 100%;
  height: 100%;
}

eox-map {
  width: 100%;
  height: 100%;
  z-index: 1000;
}

.map-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

@media (prefers-color-scheme: dark) {
  .map-loading-overlay {
    background-color: rgba(30, 30, 30, 0.9);
  }
}

.loading-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading-hint {
  font-family: 'IBM Plex Mono', 'Consolas', 'Monaco', monospace;
  font-size: 0.9rem;
  color: #666;
  margin: 0;
  max-width: 300px;
  line-height: 1.4;
}

@media (prefers-color-scheme: dark) {
  .loading-hint {
    color: #aaa;
  }
}
</style>
