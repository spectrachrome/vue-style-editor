<template>
  <div ref="containerRef" class="code-editor-container">
    <div v-if="isLoading" class="loader-overlay">
      <div class="loader large"></div>
    </div>
    <eox-jsonform
      :schema="editorSchema"
      :value="formValue"
      :style="{ visibility: isLoading ? 'hidden' : 'visible' }"
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
const isLoading = ref(true)
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

        // Hide loader immediately when ACE editor is ready
        isLoading.value = false

        // Configure code folding and collapse JSON sections by default
        aceEditor.session.setFoldStyle('markbeginend')
        aceEditor.setOptions({
          foldStyle: 'markbeginend',
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true
        })

        // Fold nested JSON objects/arrays but keep root level expanded
        setTimeout(() => {
          const session = aceEditor.getSession()

          // Clear existing folds first
          session.unfold()

          // Find and fold nested JSON objects (skip root level)
          const lines = session.getLength()
          let braceDepth = 0

          for (let i = 0; i < lines; i++) {
            const line = session.getLine(i).trim()

            // Track brace depth to identify nesting level
            const openBraces = (line.match(/[{[]/g) || []).length
            const closeBraces = (line.match(/[}\]]/g) || []).length
            braceDepth += openBraces - closeBraces

            // Skip the very first opening brace (root level)
            if (i === 0 || (i === 1 && session.getLine(0).trim() === '')) {
              continue
            }

            // Fold objects/arrays that are nested (not at root level)
            if (line.match(/^"[^"]+"\s*:\s*[{[]/) && braceDepth > 1) {
              const foldRange = session.getFoldWidgetRange(i)
              if (foldRange && foldRange.end.row > i + 1) {
                session.addFold('...', foldRange)
              }
            }
          }

          // Hide loader after folding is complete
          isLoading.value = false
        }, 200)

      } else {
        console.warn('Could not access ACE editor instance')
        isLoading.value = false
      }
    } catch (error) {
      console.warn('Error setting up direct ACE editor access:', error)
      isLoading.value = false
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
    showFoldWidgets: true,
    foldStyle: 'markbeginend',
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true,
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
  position: relative;
}

.loader-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 1000;
}

@media (prefers-color-scheme: dark) {
  .loader-overlay {
    background-color: rgba(30, 30, 30, 0.9);
  }
}
</style>
