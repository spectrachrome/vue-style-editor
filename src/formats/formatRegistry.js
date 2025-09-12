import { getFgbExtent } from './flatgeobuf.js'

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
  const processedLayer = { ...layer }

  if (layer.source?.url) {
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

// Default handler for unsupported formats
const DefaultHandler = Object.create(FormatHandler)
DefaultHandler.supports = () => true // Catches all

// Registry hashmap
const formatHandlers = new Map([
  ['FlatGeoBuf', FlatGeoBufHandler],
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
  const processedLayers = []

  for (const layer of layers) {
    const handler = getFormatHandler(layer.source?.type)
    let processedLayer = await handler.processLayer(layer)

    // Override layer style with editor style if provided
    if (editorStyle) {
      processedLayer = {
        ...processedLayer,
        style: editorStyle
      }
    }

    processedLayers.push(processedLayer)
  }
  return processedLayers
}
