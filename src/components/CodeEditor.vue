<template>
  <div ref="containerRef" class="code-editor-container">
    <eox-jsonform
      :schema="editorSchema"
      :value="formValue"
    ></eox-jsonform>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { debounce } from 'lodash'
import { useExamples } from '../composables/useExamples.js'

const isDarkMode = ref(false)
const containerRef = ref(null)
const containerHeight = ref(0)
let mediaQuery = null
let resizeObserver = null
let aceEditorInstance = null
const { currentExampleStyle, updateCurrentStyle } = useExamples()

const updateDarkMode = (e) => {
  isDarkMode.value = e.matches
}

const updateContainerHeight = () => {
  if (containerRef.value) {
    containerHeight.value = containerRef.value.clientHeight
  }
}

// Debounced style update function (650ms delay)
const debouncedStyleUpdate = debounce((newStyle) => {
  updateCurrentStyle(newStyle)
}, 650)

const setupAceEditor = async () => {
  // Wait for eox-jsonform to be fully initialized
  await nextTick()

  // Small delay to ensure the ACE editor is ready
  setTimeout(() => {
    try {
      const aceEditor = containerRef.value
        ?.querySelector("eox-jsonform")
        ?.editor?.editors?.["root.code"]?.["ace_editor_instance"]

      if (aceEditor) {
        aceEditorInstance = aceEditor

        // Add direct change listener with debouncing
        aceEditor.on('change', handleDirectAceChange)
      } else {
        console.warn('Could not access ACE editor instance')
      }
    } catch (error) {
      console.warn('Error setting up direct ACE editor access:', error)
    }
  }, 100)
}

const handleDirectAceChange = () => {
  if (!aceEditorInstance) return

  try {
    const content = aceEditorInstance.getValue()
    const newStyle = JSON.parse(content)
    
    
    // Use debounced update to prevent excessive calls
    debouncedStyleUpdate(newStyle)
  } catch (error) {
    // Silently ignore JSON parse errors during editing
    // Only log if it's a different type of error
    if (!(error instanceof SyntaxError)) {
      console.warn('Error in ACE change handler:', error)
    }
  }
}

const cleanupAceEditor = () => {
  if (aceEditorInstance) {
    aceEditorInstance.off('change', handleDirectAceChange)
    aceEditorInstance = null
  }
  // Cancel any pending debounced calls
  debouncedStyleUpdate.cancel()
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

  // Setup direct ACE editor access
  setupAceEditor()
})

onUnmounted(() => {
  if (mediaQuery) {
    mediaQuery.removeEventListener('change', updateDarkMode)
  }
  if (resizeObserver) {
    resizeObserver.disconnect()
  }

  // Cleanup ACE editor
  cleanupAceEditor()
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
