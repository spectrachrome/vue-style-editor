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
    console.log('setCurrentExample called for:', example.name)
    startMapLoading()

    currentExample.value = example
    currentExampleStyle.value =
      typeof example.style === 'string' ? JSON.parse(example.style) : example.style

    if (example) {
      if (example.layers) {
        console.log('Processing layers in setCurrentExample, layer count:', example.layers.length)
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
            // Include variables in the style object where eox-layercontrol expects them
            const styleWithVariables = {
              ...processedStyle,
              variables: currentExampleStyle.value.variables || {}
            }

            l.properties.layerConfig = {
              ...l.properties.layerConfig,
              schema: currentExampleStyle.value.jsonform || currentExampleStyle.value.schema,
              style: styleWithVariables,  // Style now includes variables
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
    console.log('updateCurrentStyle called')
    // Don't show loading indicator for style-only updates
    currentExampleStyle.value = newStyle

    // Re-process layers with the new style
    if (currentExample.value?.layers) {
      // Use current dataLayers which have calculated extents, not original example layers
      const layersWithExtents = dataLayers.value.length > 0 ? dataLayers.value : currentExample.value.layers
      console.log('Processing layers in updateCurrentStyle, layer count:', layersWithExtents.length)
      const processedLayers = await processLayers(layersWithExtents, newStyle)

      processedLayers.forEach((l) => {
        if (l.type === 'Vector') {
          // Process variables in style before applying
          const processedStyle = updateVectorLayerStyle(newStyle)
          l.style = processedStyle
          // Also set complete layerConfig for eox-map compatibility
          if (!l.properties.layerConfig) {
            l.properties.layerConfig = {}
          }
          // Include variables in the style object where eox-layercontrol expects them
          const styleWithVariables = {
            ...processedStyle,
            variables: newStyle.variables || {}
          }

          l.properties.layerConfig = {
            ...l.properties.layerConfig,
            schema: newStyle.jsonform || newStyle.schema,
            style: styleWithVariables,  // Style now includes variables
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
          // Include variables in the style object where eox-layercontrol expects them
          const styleWithVariables = {
            ...processedStyle,
            variables: newStyle.variables || {}
          }

          updatedLayer.properties.layerConfig = {
            ...updatedLayer.properties.layerConfig,
            schema: newStyle.jsonform || newStyle.schema,
            style: styleWithVariables,  // Style now includes variables
            legend: newStyle.legend
          }
        }
        return updatedLayer
      })
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
