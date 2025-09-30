import { getFgbExtent } from './flatgeobuf.js'
import { getGeoJSONExtent } from './geojson.js'
import { updateVectorLayerStyle } from '../utils/styleProcessor.js'

/**
 * Format handler registry using prototype pattern
 * Each handler defines how to process layers for a specific format
 */

const FormatHandler = {
  /**
   * Process a layer with format-specific logic
   * @param {Object} layer - The layer configuration
   * @returns {Promise<Object>} - Processed layer
   */
  async processLayer(layer) {
    return layer // Default: return unchanged
  },

  /**
   * Check if this handler supports the given source type
   * @param {string} sourceType - The source type to check
   * @returns {boolean}
   */
  // eslint-disable-next-line no-unused-vars
  supports(sourceType) {
    return false
  },
}

const FlatGeoBufHandler = Object.create(FormatHandler)
FlatGeoBufHandler.supports = (sourceType) => sourceType === 'FlatGeoBuf' || sourceType === 'flatgeobuf'
FlatGeoBufHandler.processLayer = async function (layer) {
  console.log('FlatGeoBuf handler called for layer:', layer.id || 'no-id', 'URL:', layer.source?.url)
  console.trace('FlatGeoBuf handler call stack')
  const processedLayer = { ...layer }

  // Skip extent calculation if layer already has an extent
  if (layer.extent && Array.isArray(layer.extent) && layer.extent.length === 4) {
    processedLayer.extent = layer.extent
    processedLayer.properties = {
      ...processedLayer.properties,
      __extentCalculated: true
    }
  } else if (layer.source?.url) {
    try {
      const extent = await getFgbExtent(layer.source.url)

      if (extent) {
        processedLayer.extent = extent
        // Add a visible marker that we can check
        processedLayer.properties = {
          ...processedLayer.properties,
          __extentCalculated: true
        }
      } else {
        console.warn('FGB extent calculation returned undefined for:', layer.source.url)
        // Continue processing without extent - the layer will still work without it
      }
    } catch (error) {
      console.error('FGB extent calculation failed:', error.message)
    }
  }

  return processedLayer
}

// GeoJSON handler for extent calculation
const GeoJSONHandler = Object.create(FormatHandler)
GeoJSONHandler.supports = (sourceType) => {
  const type = sourceType?.toLowerCase()
  return type === 'geojson' || type === 'vector'
}
GeoJSONHandler.processLayer = async function (layer) {
  console.log('GeoJSON handler called for layer:', layer.id || 'no-id', 'URL:', layer.source?.url)
  const processedLayer = { ...layer }

  // Check if this is actually a GeoJSON source (Vector type with GeoJSON format or GeoJSON source type)
  const isGeoJSON =
    layer.source?.format === 'GeoJSON' ||
    layer.source?.type === 'GeoJSON' ||
    (layer.source?.type === 'Vector' && layer.source?.url?.toLowerCase().includes('json'))

  if (!isGeoJSON) {
    // Not a GeoJSON layer, return unchanged
    return processedLayer
  }

  // Skip extent calculation if layer already has an extent
  if (layer.extent && Array.isArray(layer.extent) && layer.extent.length === 4) {
    processedLayer.extent = layer.extent
    processedLayer.properties = {
      ...processedLayer.properties,
      __extentCalculated: true
    }
  } else if (layer.source?.url) {
    try {
      const extent = await getGeoJSONExtent(layer.source.url)

      if (extent) {
        processedLayer.extent = extent
        // Add a visible marker that we can check
        processedLayer.properties = {
          ...processedLayer.properties,
          __extentCalculated: true
        }
        console.log('GeoJSON extent calculated:', extent)
      } else {
        console.warn('GeoJSON extent calculation returned null for:', layer.source.url)
        // Continue processing without extent - the layer will still work without it
      }
    } catch (error) {
      console.error('GeoJSON extent calculation failed:', error.message)
    }
  }

  return processedLayer
}

// Default handler for unsupported formats
const DefaultHandler = Object.create(FormatHandler)
DefaultHandler.supports = () => true // Catches all

// Registry hashmap
const formatHandlers = new Map([
  ['FlatGeoBuf', FlatGeoBufHandler],
  ['GeoJSON', GeoJSONHandler],
  ['default', DefaultHandler],
])

/**
 * Get the appropriate handler for a source type
 * @param {string} sourceType - The source type
 * @returns {Object} - Format handler
 */
export function getFormatHandler(sourceType) {
  return formatHandlers.get(sourceType) || formatHandlers.get('default')
}

/**
 * Register a new format handler
 * @param {string} sourceType - The source type to handle
 * @param {Object} handler - The handler instance
 */
export function registerFormatHandler(sourceType, handler) {
  formatHandlers.set(sourceType, handler)
}

/**
 * Process all layers using appropriate format handlers
 * @param {Array} layers - Array of layer configurations
 * @param {Object} [editorStyle] - Style from editor that overrides layer styles
 * @returns {Promise<Array>} - Array of processed layers
 */
export async function processLayers(layers, editorStyle = null) {
  console.log('processLayers called with', layers.length, 'layers')
  console.trace('processLayers call stack')
  const processedLayers = []

  for (const layer of layers) {
    // Determine the correct handler based on source format or type
    let handler
    if (layer.source?.format) {
      // Use format if specified (e.g., FlatGeoBuf, GeoJSON)
      handler = getFormatHandler(layer.source.format)
    } else {
      // Fall back to source type
      handler = getFormatHandler(layer.source?.type)
    }
    let processedLayer = await handler.processLayer(layer)

    // Ensure layer has proper ID structure
    if (!processedLayer.id && processedLayer.properties?.id) {
      processedLayer.id = processedLayer.properties.id
    }
    if (!processedLayer.id) {
      processedLayer.id = `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    // Override layer style with editor style if provided
    if (editorStyle) {
      // Process variables in the style first
      const processedStyle = updateVectorLayerStyle(editorStyle)

      processedLayer = {
        ...processedLayer,
        style: processedStyle
      }

      // Also set complete layerConfig for eox-map compatibility
      if (processedLayer.type === 'Vector') {
        if (!processedLayer.properties.layerConfig) {
          processedLayer.properties.layerConfig = {}
        }

        // Include variables in the style object where eox-layercontrol expects them
        const styleWithVariables = {
          ...processedStyle,
          variables: editorStyle.variables || {}
        }

        processedLayer.properties.layerConfig = {
          ...processedLayer.properties.layerConfig,
          schema: editorStyle.jsonform || editorStyle.schema,
          style: styleWithVariables,  // Style now includes variables
          legend: editorStyle.legend
        }
      }
    }

    processedLayers.push(processedLayer)
  }
  return processedLayers
}
