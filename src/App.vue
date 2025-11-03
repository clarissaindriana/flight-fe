<script setup lang="ts">
import { RouterView } from 'vue-router'
import VNavbar from './components/layout/VNavbar.vue'
</script>

<template>
  <div class="app">
    <VNavbar />

    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 3rem 0;
  position: relative;
}

.main-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 20% 20%, rgba(236, 72, 153, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(249, 115, 22, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 60% 60%, rgba(239, 68, 68, 0.02) 0%, transparent 50%);
  pointer-events: none;
  z-index: -1;
}

@media (min-width: 1024px) {
  .main-content {
    padding: 4rem 0;
  }
}
</style>
