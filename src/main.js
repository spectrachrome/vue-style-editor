import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'

// Try to register FlatGeoBuf format support
try {
  // Import FlatGeoBuf if available
  import('flatgeobuf/lib/mjs/ol')
    .then(() => {
      console.log('FlatGeoBuf OpenLayers integration loaded')
    })
    .catch((error) => {
      console.warn('Could not load FlatGeoBuf OpenLayers integration:', error)
    })
} catch (error) {
  console.warn('FlatGeoBuf import failed:', error)
}

createApp(App).mount('#app')
