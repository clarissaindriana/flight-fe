<template>
  <div class="add-airplane-view">
    <AirplaneCreate />
  </div>
</template>

<script setup lang="ts">
import AirplaneCreate from '@/components/airplane/AirplaneCreate.vue'
</script>

<style scoped>
.add-airplane-view {
  min-height: 100vh;
  background: var(--color-off-white);
}
</style>