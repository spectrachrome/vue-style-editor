import { ref, computed } from 'vue'
import { generateMapLayer, detectDataFormat } from '../utils/layerGenerator.js'
import { processLayers } from '../formats/formatRegistry.js'
import { updateVectorLayerStyle } from '../utils/styleProcessor.js'
import { useLoading } from './useLoading.js'

const currentExample = ref(null)
const currentExampleStyle = ref(null)
const dataLayers = ref([])

const { startMapLoading, stopMapLoading } = useLoading()

export function useExamples() {
  const setCurrentExample = async (example) => {
    startMapLoading()

    currentExample.value = example
    currentExampleStyle.value =
      typeof example.style === 'string' ? JSON.parse(example.style) : example.style

    if (example) {
      if (example.layers) {
        // Use the new layer definitions with format registry, applying editor style
        const processedLayers = await processLayers(example.layers, currentExampleStyle.value)

        processedLayers.forEach((l) => {
          if (l.type === 'Vector') {
            // Process variables in style before applying
            const processedStyle = updateVectorLayerStyle(currentExampleStyle.value)
            l.style = processedStyle
            // Also set complete layerConfig for eox-map compatibility
            if (!l.properties.layerConfig) {
              l.properties.layerConfig = {}
            }
            l.properties.layerConfig = {
              ...l.properties.layerConfig,
              schema: currentExampleStyle.value.jsonform || currentExampleStyle.value.schema,
              style: processedStyle,  // Use processed style
              legend: currentExampleStyle.value.legend
            }
          }
        })

        dataLayers.value = processedLayers
      } else {
        // Fallback to legacy approach
        const format = detectDataFormat(example.dataUrl)

        const layer = generateMapLayer({
          dataUrl: example.dataUrl,
          name: example.name,
          style: currentExampleStyle.value,
          id: 'example-layer',
          format: format,
        })

        dataLayers.value = [layer]
      }
    } else {
      dataLayers.value = []
    }

    // Stop loading after a brief delay to let map update
    setTimeout(() => {
      stopMapLoading()
    }, 1000)
  }

  const addLayer = (layerConfig) => {
    const layer = generateMapLayer(layerConfig)
    dataLayers.value.push(layer)
    return layer
  }

  const removeLayer = (layerId) => {
    dataLayers.value = dataLayers.value.filter((layer) => layer.id !== layerId)
  }

  const clearAllLayers = () => {
    dataLayers.value = []
  }

  const updateCurrentStyle = async (newStyle) => {
    startMapLoading()

    currentExampleStyle.value = newStyle

    // Re-process layers with the new style
    if (currentExample.value?.layers) {
      const processedLayers = await processLayers(currentExample.value.layers, newStyle)

      processedLayers.forEach((l) => {
        if (l.type === 'Vector') {
          // Process variables in style before applying
          const processedStyle = updateVectorLayerStyle(newStyle)
          l.style = processedStyle
          // Also set complete layerConfig for eox-map compatibility
          if (!l.properties.layerConfig) {
            l.properties.layerConfig = {}
          }
          l.properties.layerConfig = {
            ...l.properties.layerConfig,
            schema: newStyle.jsonform || newStyle.schema,
            style: processedStyle,  // Use processed style
            legend: newStyle.legend
          }
        }
      })

      dataLayers.value = processedLayers
    } else if (currentExample.value) {
      // Update legacy layer style
      const updatedLayers = dataLayers.value.map((layer) => {
        // Process variables in style for legacy layers too
        const processedStyle = updateVectorLayerStyle(newStyle)
        const updatedLayer = {
          ...layer,
          style: processedStyle,
        }
        // Also set complete layerConfig for eox-map compatibility
        if (layer.type === 'Vector') {
          if (!updatedLayer.properties.layerConfig) {
            updatedLayer.properties.layerConfig = {}
          }
          updatedLayer.properties.layerConfig = {
            ...updatedLayer.properties.layerConfig,
            schema: newStyle.jsonform || newStyle.schema,
            style: processedStyle,  // Use processed style
            legend: newStyle.legend
          }
        }
        return updatedLayer
      })
      dataLayers.value = updatedLayers
    }

    // Stop loading after style update completes
    setTimeout(() => {
      stopMapLoading()
    }, 800)
  }

  const clearCurrentExample = () => {
    currentExample.value = null
    currentExampleStyle.value = null
    clearAllLayers()
  }

  return {
    currentExample: computed(() => currentExample.value),
    currentExampleStyle: computed(() => currentExampleStyle.value),
    dataLayers: computed(() => dataLayers.value),
    setCurrentExample,
    addLayer,
    removeLayer,
    clearAllLayers,
    clearCurrentExample,
    updateCurrentStyle,
  }
}
