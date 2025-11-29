<template>
  <section class="classflight-section">
    <h3 class="section-title">Flight Classes</h3>
    <div class="class-list">
      <article v-for="c in classes" :key="c.id" class="class-card">
        <header class="class-head">
          <div class="type">{{ c.classType }}</div>
          <div class="price">{{ formatPrice(c.price) }}</div>
        </header>

        <div class="stats">
          <div class="stat">
            <div class="label">Total Seats</div>
            <div class="value">{{ c.seatCapacity }}</div>
          </div>
          <div class="stat">
            <div class="label">Available</div>
            <div class="value available">{{ c.availableSeats }}</div>
          </div>
          <div class="stat">
            <div class="label">Booked</div>
            <div class="value booked">{{ bookedCount(c) }}</div>
          </div>
        </div>

        <div v-if="c.seats && c.seats.length" class="seats">
          <button class="toggle" type="button" @click="toggle(c.id)">
            {{ expanded.has(c.id) ? '▴ Hide Seat Map' : '▾ Show Seat Map' }}
          </button>
          <SeatList v-if="expanded.has(c.id)" :seats="c.seats" />
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SeatList from '@/components/seat/SeatList.vue'
import type { ClassFlight } from '@/interfaces/classflight.interface'

defineProps<{
  classes: ClassFlight[]
}>()

const expanded = ref<Set<number>>(new Set())

function toggle(id: number) {
  if (expanded.value.has(id)) expanded.value.delete(id)
  else expanded.value.add(id)
}

function bookedCount(c: ClassFlight): number {
  if (!c.seats) return Math.max(0, (c.seatCapacity ?? 0) - (c.availableSeats ?? 0))
  return c.seats.filter(s => s.isBooked).length
}

function formatPrice(n: number) {
  try {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
  } catch {
    return `Rp ${n.toLocaleString('id-ID')}`
  }
}
</script>

<style scoped>
.classflight-section { margin-top: 0; }
.section-title { margin: 0 0 1rem; font-weight: 700; color: var(--color-gray-900); font-size: 1.1rem; }
.class-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
.class-card {
  background: #fff;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}
.class-card:hover {
  box-shadow: var(--shadow-md);
}
.class-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-gray-200);
}
.type { font-weight: 700; font-size: 1.1rem; color: var(--color-gray-900); }
.price { font-weight: 700; color: #7A8450; font-size: 1.1rem; }

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.stat {
  background: var(--color-gray-50);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  padding: 0.75rem;
}
.label { font-weight: 600; color: var(--color-gray-600); font-size: 0.85rem; margin-bottom: 0.25rem; }
.value { font-weight: 700; color: var(--color-gray-900); font-size: 1.1rem; }
.value.available { color: var(--color-success); }
.value.booked { color: var(--color-error); }

.toggle {
  background: #7A8450;
  color: #fff;
  border: 1px solid #F9CDD5;
  border-radius: var(--radius-md);
  padding: 0.6rem 1rem;
  font-weight: 700;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}
.toggle:hover {
  box-shadow: 0 2px 8px rgba(122, 132, 80, 0.35);
  transform: translateY(-1px);
}

@media (min-width: 1024px) {
  .class-list { grid-template-columns: repeat(2, 1fr); }
}
</style>