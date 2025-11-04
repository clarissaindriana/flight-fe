<template>
  <div class="seatlist">
    <div class="legend">
      <div class="legend-item">
        <span class="chip available"></span>
        <span>Available</span>
      </div>
      <div class="legend-item">
        <span class="chip booked"></span>
        <span>Booked</span>
      </div>
    </div>

    <div class="seat-grid">
      <div
        v-for="s in seats"
        :key="s.id"
        class="seat"
        :class="{ booked: s.isBooked }"
        :title="tooltip(s)"
      >
        <span class="code">{{ s.seatCode }}</span>
      </div>
    </div>

    <div class="summary">
      <div class="sum-item">
        <div class="label">Total</div>
        <div class="value">{{ seats.length }}</div>
      </div>
      <div class="sum-item">
        <div class="label">Available</div>
        <div class="value available">{{ availableCount }}</div>
      </div>
      <div class="sum-item">
        <div class="label">Booked</div>
        <div class="value booked">{{ bookedCount }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Seat } from '@/interfaces/seat.interface'

const props = defineProps<{
  seats: Seat[]
}>()

const availableCount = computed(() => props.seats.filter(s => !s.isBooked).length)
const bookedCount = computed(() => props.seats.filter(s => s.isBooked).length)

function tooltip(s: Seat) {
  return s.isBooked ? `${s.seatCode} — Booked` : `${s.seatCode} — Available`
}
</script>

<style scoped>
.seatlist {
  border: 1px solid var(--color-gray-100);
  border-radius: 12px;
  padding: 0.75rem;
  background: #fff;
  box-shadow: var(--shadow-sm);
}

/* Legend */
.legend {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
  align-items: center;
}
.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 700;
  color: var(--color-gray-700);
}
.chip {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  display: inline-block;
  border: 1px solid var(--color-gray-200);
}
.chip.available {
  background: #d1fae5; /* emerald-100 */
  border-color: #a7f3d0;
}
.chip.booked {
  background: #fecaca; /* red-200 */
  border-color: #fca5a5;
}

/* Seat grid */
.seat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(58px, 1fr));
  gap: 0.4rem;
  max-height: 320px;
  overflow: auto;
  padding: 0.25rem;
  background: var(--color-gray-50);
  border: 1px solid var(--color-gray-100);
  border-radius: 10px;
}
.seat {
  display: grid;
  place-items: center;
  padding: 0.5rem 0.25rem;
  border-radius: 8px;
  background: #ecfeff; /* cyan-50 */
  color: #0f766e;
  border: 2px solid #a5f3fc; /* cyan-200 */
  font-weight: 800;
  box-shadow: 0 1px 0 rgba(0,0,0,0.04);
}
.seat.booked {
  background: #fee2e2;
  color: #b91c1c;
  border-color: #fecaca;
}
.seat .code {
  font-size: 0.85rem;
  letter-spacing: .2px;
}

/* Summary */
.summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 0.5rem;
  margin-top: 0.6rem;
}
.sum-item {
  background: var(--color-gray-50);
  border: 1px solid var(--color-gray-100);
  border-radius: 10px;
  padding: 0.5rem 0.6rem;
}
.label { font-weight: 700; color: var(--color-gray-700); }
.value { font-weight: 900; color: var(--color-gray-900); }
.value.available { color: var(--color-emerald); }
.value.booked { color: var(--color-red); }
</style>