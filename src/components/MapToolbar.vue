<template>
  <div class="map-toolbar">
    <div class="row no-gap">
      <nav class="group connected primary-container">
        <button
          class="primary left-round small"
          style="
            background: #004170bb !important;
            backdrop-filter: blur(10px);
            color: #fff !important;
          "
        >
          <svg
            class="data-icon"
            style="transform: scale(0.8) translateX(2px)"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <title>vector-polyline</title>
            <path
              d="M2 3V9H4.95L6.95 15H6V21H12V16.41L17.41 11H22V5H16V9.57L10.59 15H9.06L7.06 9H8V3M4 5H6V7H4M18 7H20V9H18M8 17H10V19H8Z"
            />
          </svg>
          <span v-if="currentDataName" class="max data-filename">{{ currentDataName }}</span>
          <span v-else class="data-no-file">No data loaded</span>
        </button>
        <button
          ref="dropdownButtonRef"
          class="primary right-round small"
          @click="toggleDropdown"
          :class="{ active: isDropdownOpen }"
          style="
            background: #004170bb !important;
            backdrop-filter: blur(10px);
            color: #fff !important;
          "
        >
          Load new dataset
        </button>
      </nav>
    </div>

    <div class="dropdown-container">
      <nav class="group connected primary-container">
        <button
          ref="dropdownButtonRef"
          class="primary round small"
          @click="toggleDropdown"
          :class="{ active: isDropdownOpen }"
          style="
            background: #004170bb !important;
            backdrop-filter: blur(10px);
            color: #fff !important;
          "
        >
          Examples
          <i class="dropdown-arrow"
            ><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <title>chevron-down</title>
              <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z" /></svg
          ></i>
        </button>
      </nav>

      <Teleport to="body">
        <div v-if="isDropdownOpen" class="dropdown-menu" :style="dropdownPosition" @click.stop>
          <div
            v-for="example in examples"
            :key="example.id || example.name"
            class="dropdown-item"
            @click="selectExample(example)"
          >
            {{ example.name }}
            <span v-if="example.format" class="format-tag">{{ example.format.toUpperCase() }}</span>
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import examples from '../examples/examples.js'
import { useExamples } from '../composables/useExamples.js'

const isDropdownOpen = ref(false)
const dropdownButtonRef = ref(null)
const { setCurrentExample, currentExample, dataLayers } = useExamples()

// Compute the current data name/path
const currentDataName = computed(() => {
  if (currentExample.value) {
    // If an example is loaded, show its name
    return currentExample.value.name
  } else if (dataLayers.value && dataLayers.value.length > 0) {
    // If custom data is loaded, try to extract filename from URL
    const firstLayer = dataLayers.value.find((layer) => layer.source?.url)
    if (firstLayer?.source?.url) {
      const url = firstLayer.source.url
      // Extract filename from URL path
      const filename = url.split('/').pop().split('?')[0]
      return filename || 'Custom data'
    }
  }
  return null
})

// Handle import data button click
const handleImportData = () => {
  // TODO: Implement file picker dialog
  console.log('Import data clicked')
  // For now, just log - actual implementation would open a file picker
  // or modal dialog for importing data
}

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

const dropdownPosition = computed(() => {
  if (!isDropdownOpen.value || !dropdownButtonRef.value) {
    return {}
  }

  const buttonRect = dropdownButtonRef.value.getBoundingClientRect()
  return {
    position: 'fixed',
    top: `${buttonRect.bottom + 8}px`,
    right: `${window.innerWidth - buttonRect.right}px`,
    minWidth: '200px',
  }
})

const closeDropdownOnClickOutside = (event) => {
  if (!event.target.closest('.dropdown-container')) {
    isDropdownOpen.value = false
  }
}

// Auto-select example from URL query parameter
const autoSelectFromURL = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const exampleParam = urlParams.get('example')

  if (exampleParam) {
    // Find example by ID
    const example = examples.find((ex) => ex.id === exampleParam)

    if (example) {
      setCurrentExample(example)
    } else {
      console.warn(
        `Example "${exampleParam}" not found. Available examples:`,
        examples.map((ex) => ex.name),
      )
    }
  }
}

// Update URL when example is selected
const selectExample = (example) => {
  isDropdownOpen.value = false
  setCurrentExample(example)

  // Set URL parameter using example ID
  const url = new URL(window.location)
  if (example.id) {
    url.searchParams.set('example', example.id)
  } else {
    url.searchParams.delete('example')
  }
  window.history.pushState({}, '', url)
}

onMounted(() => {
  document.addEventListener('click', closeDropdownOnClickOutside)
  autoSelectFromURL()
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdownOnClickOutside)
})
</script>

<style scoped>
/* This import is a must for any components that utilize EOxUI */
@import url('@eox/ui/style.css');

.map-toolbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-direction: row;
  z-index: 5000;
}

/* Data status button styling */
.data-status-button {
  min-width: 140px;
  max-width: 280px;
  cursor: default !important;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95) !important;
}

.data-filename {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.data-no-file {
  color: var(--on-surface-variant);
  font-style: italic;
}

/* Button transparency and blur styling */
.map-toolbar button {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  background: #004170ee !important;
}

.map-toolbar button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.map-toolbar .data-status-button:hover {
  transform: none !important;
  box-shadow: none !important;
}

@media (prefers-color-scheme: dark) {
  .map-toolbar button {
    background: rgba(30, 30, 30, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .map-toolbar button:hover:not(:disabled) {
    background: rgba(45, 45, 45, 0.9);
  }

  .data-status-button {
    background: rgba(40, 40, 40, 0.95) !important;
  }
}

/* MDI Icon styling */
.mdi-icon {
  width: 20px;
  height: 20px;
  fill: currentColor;
  vertical-align: middle;
}

.dropdown-container {
  position: relative;
}

.dropdown-arrow {
  margin-left: 8px;
  font-size: 12px;
  transition: transform 0.2s ease;
}

button.active .dropdown-arrow {
  transform: rotate(180deg);
}

.dropdown-menu {
  background: #ffffff;
  border: 2px solid #007bff;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  overflow: hidden;
}

.dropdown-item {
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  color: #333;
  font-size: 14px;
  line-height: 1.4;
  white-space: nowrap;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.dropdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.format-tag {
  font-size: 10px;
  background: #007bff;
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: bold;
  margin-left: 8px;
}

@media (prefers-color-scheme: dark) {
  .dropdown-menu {
    background: rgba(45, 45, 45, 0.95);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .dropdown-item {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .dropdown-item:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}
</style>
