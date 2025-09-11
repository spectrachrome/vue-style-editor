<template>
  <div class="editor-toolbar">
    <!-- Toolbar content can be added here -->
    <button class="small">Button</button>
  </div>
</template>

<script setup>
// Toolbar logic can be added here as needed
</script>

<style scoped>
/* This import is a must for any components that utilize EOxUI */
@import url('@eox/ui/style.css');

.editor-toolbar {
  width: 100%;
  height: 40px;
  background: #999;
}

@media (prefers-color-scheme: dark) {
  .editor-toolbar {
    background: #333;
  }
}
</style>
