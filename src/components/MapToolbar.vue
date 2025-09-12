<template>
  <div class="map-toolbar">
    <button class="small">Import Data</button>

    <div class="dropdown-container">
      <button
        ref="dropdownButtonRef"
        class="small"
        @click="toggleDropdown"
        :class="{ active: isDropdownOpen }"
      >
        Examples
        <i class="dropdown-arrow">▼</i>
      </button>

      <Teleport to="body">
        <div v-if="isDropdownOpen" class="dropdown-menu" :style="dropdownPosition" @click.stop>
          <div
            v-for="(example, index) in examples"
            :key="example.name"
            class="dropdown-item"
            @click="selectExample(example)"
          >
            {{ example.name }}
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
const { setCurrentExample } = useExamples()

const toggleDropdown = () => {
  console.log('Toggle dropdown clicked, current state:', isDropdownOpen.value)
  isDropdownOpen.value = !isDropdownOpen.value
  console.log('New state:', isDropdownOpen.value)
  console.log('Examples available:', examples)
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

const selectExample = (example) => {
  console.log('Selected example:', example)
  isDropdownOpen.value = false
  setCurrentExample(example)
}

const closeDropdownOnClickOutside = (event) => {
  if (!event.target.closest('.dropdown-container')) {
    isDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeDropdownOnClickOutside)
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
  top: 10px;
  left: 10px;
  right: 10px;
  height: 50px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 5000;
}

/* Button transparency and blur styling */
.map-toolbar button {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  background: #004170ee !important;
}

.map-toolbar button:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

@media (prefers-color-scheme: dark) {
  .map-toolbar button {
    background: rgba(30, 30, 30, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .map-toolbar button:hover {
    background: rgba(45, 45, 45, 0.9);
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
