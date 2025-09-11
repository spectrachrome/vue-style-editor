<template>
  <eox-jsonform
    :schema="editorSchema"
    :value="{
      code: '// Some code here\nfunction sayHello() {\n  console.log(&quot;Hello World!&quot;);  \n}\n\nsayHello();',
    }"
  ></eox-jsonform>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const isDarkMode = ref(false)
let mediaQuery = null

const updateDarkMode = (e) => {
  isDarkMode.value = e.matches
}

onMounted(() => {
  if (window.matchMedia) {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    isDarkMode.value = mediaQuery.matches
    mediaQuery.addEventListener('change', updateDarkMode)
  }
})

onUnmounted(() => {
  if (mediaQuery) {
    mediaQuery.removeEventListener('change', updateDarkMode)
  }
})

const editorSchema = computed(() => ({
  type: 'object',
  properties: {
    code: {
      type: 'string',
      title: '',
      description: '',
      format: 'javascript',
      options: { 
        ace: { 
          tabSize: 2,
          theme: isDarkMode.value ? 'ace/theme/monokai' : 'ace/theme/textmate'
        } 
      },
    },
  },
}))
</script>

<style scoped>
/* No component-specific styles needed - sizing handled by parent */
</style>