<script setup>
import { ref, onMounted, nextTick } from 'vue'
import HelloWorld from './components/HelloWorld.vue'
import TheWelcome from './components/TheWelcome.vue'
import '@eox/map'
import '@eox/layercontrol'

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

  <div class="layercontrol" style="width: 240px; height: 400px; z-index: 2000">
    <eox-layercontrol
      ref="layerControlRef"
      idProperty="id"
      titleProperty="title"
    ></eox-layercontrol>
  </div>

  <main>
    <eox-map
      ref="mapRef"
      :center="[15, 48]"
      :layers="[{ type: 'Tile', source: { type: 'OSM' }, id: 'osm', title: 'OpenStreetMap', properties: { visible: true } }]"
      :zoom="7"
    >
    </eox-map>
  </main>
</template>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}

eox-map {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
}

.layercontrol {
  background: #fff;
}
</style>
