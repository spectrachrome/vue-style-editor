<template>
  <div ref="containerRef" class="code-editor-container">
    <eox-jsonform :schema="editorSchema" :value="formValue"></eox-jsonform>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useExamples } from '../composables/useExamples.js'

const isDarkMode = ref(false)
const containerRef = ref(null)
const containerHeight = ref(0)
let mediaQuery = null
let resizeObserver = null
const { currentExampleStyle } = useExamples()

const updateDarkMode = (e) => {
  isDarkMode.value = e.matches
}

const updateContainerHeight = () => {
  if (containerRef.value) {
    containerHeight.value = containerRef.value.clientHeight
  }
}

const editorConfig = computed(() => {
  const fontSize = 15
  const lineHeight = Math.ceil(fontSize * 1.4)
  const padding = 20

  const availableHeight = containerHeight.value - padding
  const maxLines = Math.floor(availableHeight / lineHeight)

  return {
    tabSize: 2,
    fontSize,
    fontFamily: "'IBM Plex Mono', 'Consolas', 'Monaco', monospace",
    maxPixelHeight: Math.max(200, availableHeight),
    minLines: Math.max(10, maxLines),
    maxLines: Infinity,
    theme: isDarkMode.value ? 'ace/theme/monokai' : 'ace/theme/textmate',
  }
})

onMounted(() => {
  if (window.matchMedia) {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    isDarkMode.value = mediaQuery.matches
    mediaQuery.addEventListener('change', updateDarkMode)
  }

  updateContainerHeight()

  if (containerRef.value && window.ResizeObserver) {
    resizeObserver = new ResizeObserver(() => {
      updateContainerHeight()
    })
    resizeObserver.observe(containerRef.value)
  }
})

onUnmounted(() => {
  if (mediaQuery) {
    mediaQuery.removeEventListener('change', updateDarkMode)
  }
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})

const formValue = computed(() => ({
  code: currentExampleStyle.value
    ? JSON.stringify(currentExampleStyle.value, null, 2)
    : '// Select an example from the dropdown to view its style configuration\n// or write your own style here',
}))

const editorSchema = computed(() => ({
  type: 'object',
  properties: {
    code: {
      type: 'string',
      title: '',
      description: '',
      format: 'json',
      options: {
        ace: editorConfig.value,
      },
    },
  },
}))
</script>

<style scoped>
.code-editor-container {
  height: 100%;
  width: 100%;
}
</style>
