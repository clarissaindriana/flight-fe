<template>
  <div class="airplane-list">
    <div class="header">
      <h2>✈️ Fleet Overview</h2>
      <p class="subtitle">Manage your aircraft collection</p>
      <router-link to="/airplanes/create" class="create-btn">
        <span class="plus-icon">+</span>
        Add New Airplane
      </router-link>
    </div>

    <!-- Filters Section -->
    <div class="filters-section">
      <div class="filter-row">
        <div class="filter-group">
          <label class="filter-label">🔍 Search:</label>
          <input
            v-model="filters.search"
            type="text"
            placeholder="Search by registration number..."
            class="filter-input"
          />
        </div>

        <div class="filter-group">
          <label class="filter-label">📊 Status:</label>
          <select v-model="filters.isDeleted" class="filter-select">
            <option :value="null">All Airplanes</option>
            <option :value="false">Active Only</option>
            <option :value="true">Inactive Only</option>
          </select>
        </div>
      </div>

      <div class="filter-row">
        <div class="filter-group">
          <label class="filter-label">🏢 Airline:</label>
          <select v-model="filters.airlineId" class="filter-select">
            <option value="">All Airlines</option>
            <option
              v-for="airline in airlines"
              :key="airline.id"
              :value="airline.id"
            >
              {{ airline.name }}
            </option>
          </select>
        </div>
      </div>

      <div class="filter-row">
        <div class="filter-group">
          <label class="filter-label">✈️ Model:</label>
          <input
            v-model="filters.model"
            type="text"
            placeholder="Filter by model..."
            class="filter-input"
          />
        </div>

        <div class="filter-group">
          <label class="filter-label">📅 Year:</label>
          <input
            v-model.number="filters.manufactureYear"
            type="number"
            placeholder="Filter by year..."
            class="filter-input"
          />
        </div>

      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading your fleet...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>Oops! Something went wrong</h3>
      <p>{{ error }}</p>
      <button @click="() => airplaneStore.fetchAirplanes()" class="retry-btn">Try Again</button>
    </div>

    <div v-else-if="airplanes.length === 0" class="empty-state">
      <div class="empty-icon">🛫</div>
      <h3>No airplanes yet</h3>
      <p>Start building your fleet by adding your first aircraft</p>
      <router-link to="/airplanes/create" class="create-btn">Add First Airplane</router-link>
    </div>

    <div v-else class="airplane-grid">
      <div
        v-for="airplane in airplanes"
        :key="airplane.id"
        class="airplane-card"
        :class="{ 'inactive': airplane.isDeleted }"
      >
        <div class="card-header">
          <div class="airplane-id">{{ airplane.id }}</div>
          <div class="status-badge" :class="airplane.isDeleted ? 'inactive' : 'active'">
            {{ airplane.isDeleted ? 'Inactive' : 'Active' }}
          </div>
        </div>

        <div class="card-content">
          <div class="info-row">
            <span class="label">✈️ Model:</span>
            <span class="value">{{ airplane.model }}</span>
          </div>

          <div class="info-row">
            <span class="label">🏢 Airline:</span>
            <span class="value">{{ getAirlineName(airplane.airlineId) }}</span>
          </div>

          <div class="info-row">
            <span class="label">👥 Capacity:</span>
            <span class="value">{{ airplane.seatCapacity }} seats</span>
          </div>

          <div class="info-row">
            <span class="label">📅 Year:</span>
            <span class="value">{{ airplane.manufactureYear }}</span>
          </div>

          <div class="info-row">
            <span class="label">📆 Added:</span>
            <span class="value">{{ formatDate(airplane.createdAt) }}</span>
          </div>
        </div>

        <div class="card-actions">
          <button
            v-if="!airplane.isDeleted"
            class="action-btn update-btn"
            @click="handleUpdate(airplane)"
          >
            ✏️ Update
          </button>
          <button
            v-else
            class="action-btn detail-btn"
            @click="handleViewDetail(airplane)"
          >
            👁️ Detail
          </button>
          <button
            v-if="!airplane.isDeleted"
            class="action-btn delete-btn"
            @click="handleToggleStatus(airplane)"
          >
            🗑️ Deactivate
          </button>
          <button
            v-if="airplane.isDeleted"
            class="action-btn activate-btn"
            @click="handleActivate(airplane)"
          >
            🔄 Activate
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAirplaneStore } from '@/stores/airplane/airplane'
import { useAirlineStore } from '@/stores/airline/airline'
import type { Airplane } from '@/interfaces/airplane.interface'

const router = useRouter()
const airplaneStore = useAirplaneStore()
const airlineStore = useAirlineStore()

const { airplanes: allAirplanes, loading, error } = airplaneStore
const { airlines, getAirlineName } = airlineStore

// Filters
const filters = ref({
  search: '',
  isDeleted: null as boolean | null,
  airlineId: '',
  model: '',
  manufactureYear: null as number | null,
})

// Filtered airplanes
const airplanes = computed(() => {
  let filtered = [...allAirplanes]

  // Filter by search (registration number)
  if (filters.value.search.trim()) {
    filtered = filtered.filter(airplane =>
      airplane.id.toLowerCase().includes(filters.value.search.toLowerCase())
    )
  }

  // Filter by status
  if (filters.value.isDeleted !== null) {
    filtered = filtered.filter(airplane => airplane.isDeleted === filters.value.isDeleted)
  }

  // Filter by airline
  if (filters.value.airlineId) {
    filtered = filtered.filter(airplane => airplane.airlineId === filters.value.airlineId)
  }

  // Filter by model
  if (filters.value.model.trim()) {
    filtered = filtered.filter(airplane =>
      airplane.model.toLowerCase().includes(filters.value.model.toLowerCase())
    )
  }

  // Filter by manufacture year
  if (filters.value.manufactureYear) {
    filtered = filtered.filter(airplane => airplane.manufactureYear === filters.value.manufactureYear)
  }

  // Sort by registration number ascending
  return filtered.sort((a, b) => a.id.localeCompare(b.id))
})

const clearFilters = () => {
  filters.value = {
    search: '',
    isDeleted: null,
    airlineId: '',
    model: '',
    manufactureYear: null,
  }
}

onMounted(async () => {
  await airplaneStore.fetchAirplanes()
  await airlineStore.fetchAirlines()
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

const handleUpdate = (airplane: Airplane) => {
  router.push(`/airplanes/update/${airplane.id}`)
}

const handleViewDetail = (airplane: Airplane) => {
  // For now, just show an alert with airplane details
  // In a real app, this would navigate to a detail view
  alert(`Airplane Details:\n\nRegistration: ${airplane.id}\nModel: ${airplane.model}\nAirline: ${getAirlineName(airplane.airlineId)}\nCapacity: ${airplane.seatCapacity} seats\nYear: ${airplane.manufactureYear}\nStatus: ${airplane.isDeleted ? 'Inactive' : 'Active'}`)
}

const handleToggleStatus = async (airplane: Airplane) => {
  if (confirm('Are you sure you want to deactivate this airplane?')) {
    try {
      await airplaneStore.deleteAirplane(airplane.id)
      // Refresh the list after successful operation
      await airplaneStore.fetchAirplanes()
    } catch (error: any) {
      console.error('Failed to deactivate airplane:', error)

      // Extract error message from backend response
      let errorMessage = 'Failed to deactivate airplane. Please try again.'
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error?.message) {
        errorMessage = error.message
      }

      alert(errorMessage)
    }
  }
}

const handleActivate = async (airplane: Airplane) => {
  if (confirm('Are you sure you want to activate this airplane?')) {
    try {
      await airplaneStore.activateAirplane(airplane.id)
      // Refresh the list after successful operation
      await airplaneStore.fetchAirplanes()
    } catch (error: any) {
      console.error('Failed to activate airplane:', error)

      // Extract error message from backend response
      let errorMessage = 'Failed to activate airplane. Please try again.'
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error?.message) {
        errorMessage = error.message
      }

      alert(errorMessage)
    }
  }
}
</script>

<style scoped>
.airplane-list {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  animation: fadeIn 0.8s ease-out;
  width: 100%;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
  position: relative;
}

.header::before {
  content: '';
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 4px;
  background: linear-gradient(135deg, var(--color-pink) 0%, var(--color-orange) 50%, var(--color-red) 100%);
  border-radius: var(--radius-full);
}

.header h2 {
  font-size: 3rem;
  font-weight: 800;
  margin: 0 0 0.5rem 0;
  background: linear-gradient(135deg, var(--color-pink) 0%, var(--color-orange) 50%, var(--color-red) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.subtitle {
  color: var(--color-gray-600);
  font-size: 1.25rem;
  margin: 0 0 2rem 0;
  font-weight: 400;
}

.create-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  background: linear-gradient(135deg, var(--color-pink) 0%, var(--color-orange) 100%);
  color: white;
  padding: 1rem 2rem;
  border-radius: var(--radius-xl);
  text-decoration: none;
  font-weight: 700;
  font-size: 1.1rem;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 25px rgba(236, 72, 153, 0.3);
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}

.create-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s;
}

.create-btn:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 12px 35px rgba(236, 72, 153, 0.4);
}

.create-btn:hover::before {
  left: 100%;
}

.plus-icon {
  font-size: 1.5rem;
  font-weight: bold;
  animation: pulse 2s infinite;
}

.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: 5rem 3rem;
  background: var(--color-white);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--color-gray-100);
  margin: 3rem 0;
  position: relative;
  overflow: hidden;
}

.loading-state::before, .error-state::before, .empty-state::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.02) 0%, rgba(249, 115, 22, 0.02) 100%);
  pointer-events: none;
}

.spinner {
  width: 4rem;
  height: 4rem;
  border: 4px solid var(--color-gray-200);
  border-radius: 50%;
  border-top-color: var(--color-pink);
  animation: spin 1s linear infinite;
  margin: 0 auto 1.5rem;
  filter: drop-shadow(0 2px 4px rgba(236, 72, 153, 0.2));
}

.error-icon, .empty-icon {
  font-size: 5rem;
  margin-bottom: 1.5rem;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}

.error-state h3, .empty-state h3 {
  font-size: 2rem;
  color: var(--color-gray-900);
  margin: 0 0 0.75rem 0;
  font-weight: 700;
}

.error-state p, .empty-state p {
  color: var(--color-gray-600);
  font-size: 1.2rem;
  margin: 0 0 2.5rem 0;
  line-height: 1.6;
}

.retry-btn {
  background: linear-gradient(135deg, var(--color-red) 0%, var(--color-red-dark) 100%);
  color: white;
  padding: 1rem 2rem;
  border: none;
  border-radius: var(--radius-lg);
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-md);
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  background: linear-gradient(135deg, var(--color-red-dark) 0%, #b91c1c 100%);
}

.airplane-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
  gap: 2.5rem;
  margin-top: 3rem;
  width: 100%;
}

.airplane-card {
  background: var(--color-white);
  border-radius: var(--radius-2xl);
  padding: 2.5rem;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-gray-100);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  animation: slideIn 0.6s ease-out;
  animation-fill-mode: both;
}

.airplane-card:nth-child(odd) {
  animation-delay: 0.1s;
}

.airplane-card:nth-child(even) {
  animation-delay: 0.2s;
}

.airplane-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(135deg, var(--color-pink) 0%, var(--color-orange) 50%, var(--color-red) 100%);
  border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
}

.airplane-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: var(--shadow-2xl);
  border-color: var(--color-pink-light);
}

.airplane-card.inactive {
  opacity: 0.8;
  background: var(--color-gray-50);
  border-color: var(--color-gray-200);
}

.airplane-card.inactive::before {
  background: linear-gradient(135deg, var(--color-gray-400) 0%, var(--color-gray-500) 100%);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  position: relative;
}

.airplane-id {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--color-gray-900);
  margin: 0;
  background: linear-gradient(135deg, var(--color-pink) 0%, var(--color-orange) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  box-shadow: var(--shadow-sm);
  border: 2px solid transparent;
}

.status-badge.active {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  color: var(--color-emerald);
  border-color: rgba(16, 185, 129, 0.2);
}

.status-badge.inactive {
  background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
  color: var(--color-red);
  border-color: rgba(239, 68, 68, 0.2);
}

.card-content {
  margin-bottom: 2.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid var(--color-gray-100);
  transition: all 0.2s ease;
}

.info-row:hover {
  background: rgba(236, 72, 153, 0.02);
  border-radius: var(--radius-md);
  margin: 0 -0.5rem;
  padding: 1rem 0.5rem;
}

.info-row:last-child {
  border-bottom: none;
}

.label {
  font-weight: 700;
  color: var(--color-gray-700);
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.label::before {
  content: '✨';
  font-size: 0.9rem;
  opacity: 0.7;
}

.value {
  color: var(--color-gray-600);
  font-size: 1rem;
  font-weight: 500;
  text-align: right;
  background: var(--color-gray-50);
  padding: 0.375rem 0.75rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-gray-200);
}

.card-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.action-btn {
  flex: 1;
  padding: 1rem 1.5rem;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.action-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

.action-btn:hover::before {
  left: 100%;
}

.update-btn {
  background: linear-gradient(135deg, var(--color-amber) 0%, #d97706 100%);
  color: white;
  border: 2px solid transparent;
}

.update-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(245, 158, 11, 0.4);
  border-color: rgba(245, 158, 11, 0.3);
}

.delete-btn {
  background: linear-gradient(135deg, var(--color-red) 0%, var(--color-red-dark) 100%);
  color: white;
  border: 2px solid transparent;
}

.delete-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
  border-color: rgba(239, 68, 68, 0.3);
}

.activate-btn {
  background: linear-gradient(135deg, var(--color-emerald) 0%, #047857 100%);
  color: white;
  border: 2px solid transparent;
}

.activate-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
  border-color: rgba(16, 185, 129, 0.3);
}

.detail-btn {
  background: linear-gradient(135deg, var(--color-blue) 0%, #3b82f6 100%);
  color: white;
  border: 2px solid transparent;
}

.detail-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
  border-color: rgba(59, 130, 246, 0.3);
}

@media (max-width: 768px) {
  .airplane-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .card-actions {
    flex-direction: column;
  }

  .header h2 {
    font-size: 2.5rem;
  }

  .airplane-card {
    padding: 2rem;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .airplane-id {
    font-size: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .airplane-grid {
    grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
    gap: 3rem;
  }

  .airplane-card {
    padding: 3rem;
  }

  .header h2 {
    font-size: 4rem;
  }

  .subtitle {
    font-size: 1.4rem;
  }

  .create-btn {
    padding: 1.5rem 3rem;
    font-size: 1.2rem;
  }

  .airplane-id {
    font-size: 2rem;
  }

  .info-row {
    padding: 1.5rem 0;
  }

  .action-btn {
    padding: 1.25rem 2rem;
    font-size: 1.1rem;
  }
}

@media (max-width: 480px) {
  .airplane-list {
    padding: 1rem;
  }

  .header h2 {
    font-size: 2rem;
  }

  .create-btn {
    padding: 0.875rem 1.5rem;
    font-size: 1rem;
  }

  .airplane-card {
    padding: 1.5rem;
  }

  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .value {
    text-align: left;
    align-self: flex-start;
  }
}

/* Filters Section Styling */
.filters-section {
  background: var(--color-white);
  border-radius: var(--radius-2xl);
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-gray-100);
}

.filter-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.filter-row:last-child {
  margin-bottom: 0;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  font-weight: 600;
  color: var(--color-gray-700);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-input,
.filter-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s ease;
  background: var(--color-white);
  color: var(--color-gray-800);
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: var(--color-pink);
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1);
  transform: translateY(-1px);
}

.filter-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  padding-right: 2.5rem;
}

.filter-select:hover {
  border-color: var(--color-pink-light);
}
</style>
