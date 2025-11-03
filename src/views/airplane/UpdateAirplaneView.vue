<template>
  <div class="update-airplane-view">
    <div class="container">
      <div class="header">
        <h1>✏️ Update Airplane</h1>
        <p>Modify airplane information</p>
        <router-link to="/airplanes" class="back-btn">
          ← Back to Fleet
        </router-link>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading airplane details...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <div class="error-icon">⚠️</div>
        <h3>Airplane Not Found</h3>
        <p>{{ error }}</p>
        <router-link to="/airplanes" class="back-btn">← Back to Fleet</router-link>
      </div>

      <div v-else-if="airplane" class="update-form">
        <form @submit.prevent="handleSubmit">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">
                <span class="icon">🏢</span>
                Airline (Read-only)
              </label>
              <div class="readonly-field">
                {{ getAirlineName(airplane.airlineId) }}
              </div>
              <div class="readonly-note">
                Airline cannot be changed during update
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">
                <span class="icon">🆔</span>
                Registration Number (Read-only)
              </label>
              <div class="readonly-field">
                {{ airplane.id }}
              </div>
              <div class="readonly-note">
                Registration number cannot be changed
              </div>
            </div>

            <div class="form-group">
              <label for="model" class="form-label">
                <span class="icon">🛩️</span>
                Aircraft Model
              </label>
              <input
                id="model"
                v-model="form.model"
                type="text"
                placeholder="e.g., Boeing 737-800"
                required
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="seatCapacity" class="form-label">
                <span class="icon">👥</span>
                Seat Capacity
              </label>
              <input
                id="seatCapacity"
                v-model.number="form.seatCapacity"
                type="number"
                min="1"
                placeholder="e.g., 180"
                required
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="manufactureYear" class="form-label">
                <span class="icon">📅</span>
                Manufacture Year
              </label>
              <input
                id="manufactureYear"
                v-model.number="form.manufactureYear"
                type="number"
                min="1900"
                :max="new Date().getFullYear()"
                placeholder="e.g., 2020"
                required
                class="form-input"
              />
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" :disabled="updating" class="submit-btn">
              <span v-if="updating" class="spinner"></span>
              {{ updating ? 'Updating Airplane...' : '✏️ Update Airplane' }}
            </button>
          </div>

          <div v-if="updateError" class="error-message">
            <span class="error-icon">⚠️</span>
            {{ updateError }}
          </div>
          <div v-if="successMessage" class="success-message">
            <span class="success-icon">✅</span>
            {{ successMessage }}
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAirplaneStore } from '@/stores/airplane/airplane'
import { useAirlineStore } from '@/stores/airline/airline'
import type { Airplane, UpdateAirplaneRequest } from '@/interfaces/airplane.interface'
import type { Airline } from '@/interfaces/airline.interface'

const route = useRoute()
const router = useRouter()

const { airplanes, loading, error, fetchAirplanes, updateAirplane } = useAirplaneStore()
const { airlines, fetchAirlines: fetchAirlinesList } = useAirlineStore()

const airplane = ref<Airplane | null>(null)
const updating = ref(false)
const updateError = ref('')
const successMessage = ref('')

const form = ref<UpdateAirplaneRequest>({
  id: '',
  model: '',
  seatCapacity: 0,
  manufactureYear: new Date().getFullYear(),
})

const airplaneId = route.params.id as string

onMounted(async () => {
  await fetchAirplanes()
  await fetchAirlinesList()

  const foundAirplane = airplanes.find((a: Airplane) => a.id === airplaneId)
  if (foundAirplane) {
    airplane.value = foundAirplane
    form.value = {
      id: foundAirplane.id,
      model: foundAirplane.model,
      seatCapacity: foundAirplane.seatCapacity,
      manufactureYear: foundAirplane.manufactureYear,
    }
  }
})

const getAirlineName = (airlineId: string) => {
  const airline = airlines.find((a: Airline) => a.id === airlineId)
  return airline ? `${airline.name} (${airline.country})` : 'Unknown Airline'
}

const handleSubmit = async () => {
  if (!airplane.value) return

  updating.value = true
  updateError.value = ''
  successMessage.value = ''

  try {
    await updateAirplane(form.value)
    successMessage.value = '✏️ Airplane updated successfully!'

    // Redirect after successful update
    setTimeout(() => {
      router.push('/airplanes')
    }, 2000)
  } catch (err) {
    updateError.value = err instanceof Error ? err.message : 'Failed to update airplane'
  } finally {
    updating.value = false
  }
}
</script>

<style scoped>
.update-airplane-view {
  min-height: 100vh;
  background: var(--color-off-white);
  padding: 2rem 0;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 2rem;
  animation: fadeIn 0.8s ease-out;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
  position: relative;
}

.header::before {
  content: '';
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 5px;
  background: linear-gradient(135deg, var(--color-pink) 0%, var(--color-orange) 50%, var(--color-red) 100%);
  border-radius: var(--radius-full);
  box-shadow: 0 2px 8px rgba(236, 72, 153, 0.3);
}

.header h1 {
  font-size: 3rem;
  font-weight: 900;
  margin: 0 0 0.75rem 0;
  background: linear-gradient(135deg, var(--color-pink) 0%, var(--color-orange) 50%, var(--color-red) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  letter-spacing: -0.02em;
}

.header p {
  color: var(--color-gray-600);
  font-size: 1.3rem;
  margin: 0 0 2rem 0;
  font-weight: 500;
  opacity: 0.9;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-white);
  color: var(--color-gray-700);
  text-decoration: none;
  border-radius: var(--radius-lg);
  font-weight: 600;
  transition: all 0.3s ease;
  border: 2px solid var(--color-gray-200);
  box-shadow: var(--shadow-sm);
}

.back-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-pink-light);
  color: var(--color-pink);
}

.loading-state, .error-state {
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

.loading-state::before, .error-state::before {
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

.error-icon {
  font-size: 5rem;
  margin-bottom: 1.5rem;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}

.error-state h3 {
  font-size: 2rem;
  color: var(--color-gray-900);
  margin: 0 0 0.75rem 0;
  font-weight: 700;
}

.error-state p {
  color: var(--color-gray-600);
  font-size: 1.2rem;
  margin: 0 0 2.5rem 0;
  line-height: 1.6;
}

.update-form {
  background: var(--color-white);
  padding: 4rem;
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-2xl);
  border: 1px solid var(--color-gray-100);
  position: relative;
  overflow: hidden;
  animation: slideIn 0.6s ease-out 0.2s both;
}

.update-form::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: linear-gradient(135deg, var(--color-pink) 0%, var(--color-orange) 50%, var(--color-red) 100%);
  border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
}

.update-form::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(236, 72, 153, 0.03) 0%, transparent 70%);
  pointer-events: none;
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
  50% { transform: translate(-50%, -50%) rotate(180deg); }
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2.5rem;
  margin-bottom: 3rem;
}

.form-group {
  position: relative;
  animation: fadeIn 0.6s ease-out both;
}

.form-group:nth-child(1) { animation-delay: 0.1s; }
.form-group:nth-child(2) { animation-delay: 0.2s; }
.form-group:nth-child(3) { animation-delay: 0.3s; }
.form-group:nth-child(4) { animation-delay: 0.4s; }
.form-group:nth-child(5) { animation-delay: 0.5s; }

.form-label {
  display: block;
  margin-bottom: 1rem;
  font-weight: 700;
  color: var(--color-gray-800);
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  letter-spacing: 0.01em;
}

.icon {
  font-size: 1.3rem;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.form-input, .form-select {
  width: 100%;
  padding: 1.25rem 1.5rem;
  border: 3px solid var(--color-gray-200);
  border-radius: var(--radius-xl);
  font-size: 1.1rem;
  font-weight: 500;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--color-white);
  color: var(--color-gray-800);
  position: relative;
  overflow: hidden;
}

.form-input::before, .form-select::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(236, 72, 153, 0.05), transparent);
  transition: left 0.6s;
}

.form-input:focus::before, .form-select:focus::before {
  left: 100%;
}

.form-input:focus, .form-select:focus {
  outline: none;
  border-color: var(--color-pink);
  box-shadow: 0 0 0 4px rgba(236, 72, 153, 0.1);
  transform: translateY(-3px);
}

.form-input::placeholder {
  color: var(--color-gray-400);
  font-weight: 400;
}

.form-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3e%3c/svg%3e");
  background-position: right 1rem center;
  background-repeat: no-repeat;
  background-size: 1.5rem;
  padding-right: 3.5rem;
  font-weight: 600;
}

.form-select:disabled {
  background: var(--color-gray-50);
  cursor: not-allowed;
  opacity: 0.7;
  border-color: var(--color-gray-300);
}

.loading-text {
  margin-top: 0.75rem;
  font-size: 0.95rem;
  color: var(--color-gray-500);
  font-style: italic;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.loading-text::before {
  content: '';
  width: 1rem;
  height: 1rem;
  border: 2px solid var(--color-pink-light);
  border-radius: 50%;
  border-top-color: var(--color-pink);
  animation: spin 1s linear infinite;
}

.form-actions {
  text-align: center;
  margin-top: 3rem;
  position: relative;
}

.submit-btn {
  background: linear-gradient(135deg, var(--color-amber) 0%, #d97706 100%);
  color: white;
  padding: 1.25rem 3rem;
  border: none;
  border-radius: var(--radius-xl);
  font-size: 1.2rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  box-shadow: 0 8px 30px rgba(245, 158, 11, 0.4);
  border: 3px solid transparent;
  position: relative;
  overflow: hidden;
}

.submit-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.7s;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 15px 40px rgba(245, 158, 11, 0.5);
  border-color: rgba(245, 158, 11, 0.3);
}

.submit-btn:hover:not(:disabled)::before {
  left: 100%;
}

.submit-btn:disabled {
  background: var(--color-gray-400);
  cursor: not-allowed;
  transform: none;
  box-shadow: var(--shadow-sm);
  border-color: transparent;
}

.spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 3px solid rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.error-message, .success-message {
  margin-top: 2rem;
  padding: 1.5rem 2rem;
  border-radius: var(--radius-xl);
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-align: center;
  justify-content: center;
  animation: slideIn 0.5s ease-out;
  box-shadow: var(--shadow-md);
  border: 2px solid transparent;
}

.error-message {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  color: var(--color-red);
  border-color: rgba(239, 68, 68, 0.2);
}

.success-message {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  color: var(--color-emerald);
  border-color: rgba(16, 185, 129, 0.2);
}

.error-icon, .success-icon {
  font-size: 1.5rem;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

@media (max-width: 768px) {
  .container {
    padding: 0 1rem;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .update-form {
    padding: 2.5rem;
  }

  .header h1 {
    font-size: 2.5rem;
  }

  .submit-btn {
    padding: 1rem 2rem;
    font-size: 1.1rem;
  }
}

@media (max-width: 480px) {
  .update-form {
    padding: 2rem;
  }

  .header h1 {
    font-size: 2rem;
  }

  .form-input, .form-select {
    padding: 1rem 1.25rem;
    font-size: 1rem;
  }

  .submit-btn {
    width: 100%;
    padding: 1.25rem;
    font-size: 1rem;
  }
}
</style>