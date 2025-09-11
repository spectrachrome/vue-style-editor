<script setup>
import { ref, onMounted, nextTick } from 'vue'

import HelloWorld from './components/HelloWorld.vue'
import TheWelcome from './components/TheWelcome.vue'

import '@eox/map'
import '@eox/layercontrol'
import '@eox/jsonform'

const mapRef = ref(null)
const layerControlRef = ref(null)
const asideWidth = ref(300)
const isDragging = ref(false)
let animationId = null

const startResize = (e) => {
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

  if (layerControlRef.value && mapRef.value) {
    console.log('Connecting layer control to map:', mapRef.value)
    layerControlRef.value.for = mapRef.value
  }
})
</script>

<template>
  <header></header>

  <div id="layercontrol">
    <eox-layercontrol
      ref="layerControlRef"
      idProperty="id"
      titleProperty="title"
    ></eox-layercontrol>
  </div>

  <aside :style="{ width: asideWidth + 'px' }">
    <div id="side-toolbar"></div>
    <eox-jsonform
      :schema="{
        type: 'object',
        properties: {
          code: {
            type: 'string',
            title: '',
            description: '',
            format: 'javascript',
            options: { ace: { tabSize: 2 } },
          },
        },
      }"
      :value="{
        code: '// Some code here\nfunction sayHello() {\n  console.log(&quot;Hello World!&quot;);  \n}\n\nsayHello();',
      }"
    ></eox-jsonform>
    <div class="resize-handle" @mousedown="startResize"></div>
  </aside>

  <main :style="{ left: asideWidth + 'px', width: `calc(100vw - ${asideWidth}px)` }">
    <eox-map
      ref="mapRef"
      :center="[15, 48]"
      :layers="[
        {
          type: 'Tile',
          source: { type: 'OSM' },
          id: 'osm',
          title: 'OpenStreetMap',
          properties: { visible: true },
        },
      ]"
      :zoom="7"
    >
    </eox-map>
  </main>
</template>

<style scoped>
eox-map {
  width: 100%;
  height: 100%;
  z-index: 1000;
}

main {
  position: fixed;
  top: 0;
  bottom: 0;
  transition: none;
}

#layercontrol {
  position: fixed;
  right: 10px;
  top: 60px;
  background: #fff;
  width: 240px;
  height: 400px;
  z-index: 2000;
}

aside {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  background: #fff;
  transition: none;
}

aside #side-toolbar {
  position: fixed;
  width: 100%;
  height: 40px;
  background: #999;
  z-index: 2000;
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
</style>
