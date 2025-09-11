import { ref, computed } from 'vue'
import { generateMapLayer, detectDataFormat } from '../utils/layerGenerator.js'

const currentExample = ref(null)
const currentExampleStyle = ref(null)

export function useExamples() {
  const setCurrentExample = (example) => {
    currentExample.value = example
    currentExampleStyle.value = typeof example.style === 'string' 
      ? JSON.parse(example.style) 
      : example.style
  }

  const clearCurrentExample = () => {
    currentExample.value = null
    currentExampleStyle.value = null
  }

  const currentExampleLayer = computed(() => {
    if (!currentExample.value) return null
    
    const format = detectDataFormat(currentExample.value.dataUrl)
    console.log('Detected format for', currentExample.value.dataUrl, ':', format)
    
    return generateMapLayer({
      dataUrl: currentExample.value.dataUrl,
      name: currentExample.value.name,
      style: currentExampleStyle.value,
      id: 'example-layer',
      format: format
    })
  })

  return {
    currentExample: computed(() => currentExample.value),
    currentExampleStyle: computed(() => currentExampleStyle.value),
    currentExampleLayer,
    setCurrentExample,
    clearCurrentExample
  }
}