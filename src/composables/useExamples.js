import { ref, computed } from 'vue'
import { generateMapLayer, detectDataFormat } from '../utils/layerGenerator.js'
import { processLayers } from '../formats/formatRegistry.js'

const currentExample = ref(null)
const currentExampleStyle = ref(null)
const dataLayers = ref([])

export function useExamples() {
  const setCurrentExample = async (example) => {
    currentExample.value = example
    currentExampleStyle.value =
      typeof example.style === 'string' ? JSON.parse(example.style) : example.style

    if (example) {
      if (example.layers) {
        console.log('Using new layer definitions from example:', example.name)
        // Use the new layer definitions with format registry, applying editor style
        const processedLayers = await processLayers(example.layers, currentExampleStyle.value)
        dataLayers.value = processedLayers
      } else {
        // Fallback to legacy approach
        const format = detectDataFormat(example.dataUrl)
        console.log('Detected format for', example.dataUrl, ':', format)

        const layer = generateMapLayer({
          dataUrl: example.dataUrl,
          name: example.name,
          style: currentExampleStyle.value,
          id: 'example-layer',
          format: format,
        })

        dataLayers.value = [layer]
      }
    }
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
    currentExampleStyle.value = newStyle
    
    // Re-process layers with the new style
    if (currentExample.value?.layers) {
      const processedLayers = await processLayers(currentExample.value.layers, newStyle)
      dataLayers.value = processedLayers
    } else if (currentExample.value) {
      // Update legacy layer style
      const updatedLayers = dataLayers.value.map(layer => ({
        ...layer,
        style: newStyle
      }))
      dataLayers.value = updatedLayers
    }
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
