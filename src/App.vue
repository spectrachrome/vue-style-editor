<script setup>
import { ref, onMounted, nextTick } from 'vue'

import HelloWorld from './components/HelloWorld.vue'
import TheWelcome from './components/TheWelcome.vue'

import '@eox/map'
import '@eox/layercontrol'
import '@eox/jsonform'

const mapRef = ref(null)
const layerControlRef = ref(null)

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

  <aside>
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
  </aside>

  <main>
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
  position: fixed;
  left: 300px;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
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
  width: 300px;
  background: #fff;
}
</style>
