<template>
  <div class="map-buttons">
    <button
      class="small square map-button"
      @click="toggleLayerControl"
      :title="isLayerControlVisible ? 'Hide Layers' : 'Show Layers'"
    >
      <svg viewBox="0 0 24 24" class="mdi-icon">
        <path :d="isLayerControlVisible ? mdiLayers : mdiLayersOff" />
      </svg>
    </button>

    <!-- Future map buttons can be added here -->
  </div>
</template>

<script setup>
import { useLayerControl } from '../composables/useLayerControl.js'
import { mdiLayers, mdiLayersOff } from '@mdi/js'

// Layer control functionality
const { isLayerControlVisible, toggleLayerControl } = useLayerControl()
</script>

<style scoped>
/* This import is necessary for any components that utilize EOxUI */
@import url('@eox/ui/style.css');

.map-buttons {
  position: fixed;
  top: 70px;
  right: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 1800;
}

/* Button transparency and blur styling */
/*.map-button {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  width: 40px;
  min-width: 40px;
  max-width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.map-button:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}*/

@media (prefers-color-scheme: dark) {
  .map-button {
    background: rgba(30, 30, 30, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .map-button:hover {
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
</style>
