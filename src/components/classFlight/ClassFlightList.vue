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
.classflight-section { margin-top: 1rem; }
.section-title { margin: 0 0 0.5rem; font-weight: 900; color: var(--color-gray-800); }
.class-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}
.class-card {
  background: #fff;
  border: 1px solid var(--color-gray-100);
  border-radius: 14px;
  padding: 0.75rem;
  box-shadow: var(--shadow-sm);
}
.class-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.5rem;
}
.type { font-weight: 900; font-size: 1.05rem; }
.price { font-weight: 900; color: var(--color-emerald); }

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.stat {
  background: var(--color-gray-50);
  border: 1px solid var(--color-gray-100);
  border-radius: 10px;
  padding: 0.5rem 0.6rem;
}
.label { font-weight: 700; color: var(--color-gray-700); font-size: 0.9rem; }
.value { font-weight: 900; color: var(--color-gray-900); }
.value.available { color: var(--color-emerald); }
.value.booked { color: var(--color-red); }

.toggle {
  background: var(--color-blue);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 0.45rem 0.75rem;
  font-weight: 800;
  cursor: pointer;
}

@media (min-width: 1024px) {
  .class-list { grid-template-columns: repeat(2, 1fr); }
}
</style>