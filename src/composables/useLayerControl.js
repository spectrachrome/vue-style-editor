import { ref } from 'vue'

// Global state for layer control visibility
const isLayerControlVisible = ref(true)

export function useLayerControl() {
  const toggleLayerControl = () => {
    isLayerControlVisible.value = !isLayerControlVisible.value
  }

  return {
    isLayerControlVisible,
    toggleLayerControl
  }
}