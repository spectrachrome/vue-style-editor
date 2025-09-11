<script setup>
import { ref, onMounted, nextTick } from 'vue'

import MapView from './components/MapView.vue'
import LayerControl from './components/LayerControl.vue'
import CodeEditor from './components/CodeEditor.vue'
import EditorToolbar from './components/EditorToolbar.vue'
import MapToolbar from './components/MapToolbar.vue'
import MapButtons from './components/MapButtons.vue'
import { useLayerControl } from './composables/useLayerControl.js'

import '@eox/map'
import '@eox/layercontrol'
import '@eox/jsonform'

const mapComponent = ref(null)
const layerControlComponent = ref(null)
const asideWidth = ref(300)

// Layer control visibility
const { isLayerControlVisible } = useLayerControl()
const isDragging = ref(false)
let animationId = null

const startResize = () => {
  isDragging.value = true
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

const handleResize = (e) => {
  if (!isDragging.value) return

  // Cancel previous animation frame
  if (animationId) {
    cancelAnimationFrame(animationId)
  }

  // Use requestAnimationFrame for smooth updates
  animationId = requestAnimationFrame(() => {
    const newWidth = Math.max(200, Math.min(800, e.clientX))
    asideWidth.value = newWidth
    animationId = null
  })
}

const stopResize = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = 'default'
  document.body.style.userSelect = 'auto'

  // Cancel any pending animation frame
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
}

onMounted(async () => {
  await nextTick()

  if (layerControlComponent.value?.layerControlRef && mapComponent.value?.mapRef) {
    console.log('Connecting layer control to map:', mapComponent.value.mapRef)
    layerControlComponent.value.layerControlRef.for = mapComponent.value.mapRef
  }
})
</script>

<template>
  <header></header>

  <div v-if="isLayerControlVisible" id="layercontrol">
    <LayerControl ref="layerControlComponent" />
  </div>

  <MapButtons />

  <aside :style="{ width: asideWidth + 'px' }">
    <EditorToolbar />
    <CodeEditor class="flex-grow" />
    <div class="resize-handle" @mousedown="startResize"></div>
  </aside>

  <div id="map" :style="{ left: asideWidth + 'px', width: `calc(100vw - ${asideWidth}px)`, '--sidebar-width': asideWidth + 'px' }">
    <MapView ref="mapComponent" />
    <MapToolbar />
  </div>
</template>

<style scoped>
/* This import is a must for any components that utilize EOxUI */
@import url('@eox/ui/style.css');
/* Import local IBM Plex Mono font */
@import url('./fonts/fonts.css');

#map {
  position: fixed;
  top: 0;
  bottom: 0;
  transition: none;
}

#layercontrol {
  position: fixed;
  right: 60px;
  top: 70px;
  background: #fff;
  width: 240px;
  height: 400px;
  z-index: 2000;
}

@media (prefers-color-scheme: dark) {
  #layercontrol {
    background: #2d2d2d;
    color: #fff;
  }
}

aside {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  background: #fff;
  transition: none;
  display: flex;
  flex-direction: column;
}

@media (prefers-color-scheme: dark) {
  aside {
    background: #1e1e1e;
    color: #fff;
  }
}

.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 4px;
  background: #e0e0e0;
  cursor: col-resize;
  transition: background-color 0.2s ease;
  z-index: 1001;
}

.resize-handle:hover {
  background: #bdbdbd;
}

.flex-grow {
  flex: 1;
  min-height: 0;
}
</style>
