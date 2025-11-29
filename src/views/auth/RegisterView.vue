<template>
  <div class="auth-page">

    <section class="auth-shell">
      <div class="auth-card">
        <header class="card-header">
          <h2>Register</h2>
        </header>

        <form @submit.prevent="handleRegister" class="auth-form">
          <div class="form-group">
            <label for="username" class="form-label">Username</label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              class="form-input"
              required
              placeholder="Choose a username"
            />
          </div>

          <div class="form-group">
            <label for="name" class="form-label">Full Name</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              class="form-input"
              required
              placeholder="Enter your full name"
            />
          </div>

          <div class="form-group">
            <label for="email" class="form-label">Email</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              class="form-input"
              required
              placeholder="you@example.com"
            />
          </div>

          <div class="form-group">
            <label for="password" class="form-label">Password</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              class="form-input"
              required
              placeholder="Create a strong password"
            />
          </div>

          <div class="form-group">
            <label for="gender" class="form-label">Gender</label>
            <select
              id="gender"
              v-model="form.gender"
              class="form-input"
              required
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div class="form-group">
            <label for="role" class="form-label">Role</label>
            <select
              id="role"
              v-model="form.role"
              class="form-input"
              required
            >
              <option value="">Select role</option>
              <option value="Customer">Customer</option>
              <option value="Flight Airline">Flight Airline</option>
              <option value="Superadmin">Superadmin</option>
            </select>
          </div>

          <button type="submit" :disabled="isLoading" class="btn btn-primary auth-btn">
            {{ isLoading ? 'Registering...' : 'Register' }}
          </button>

          <div v-if="error" class="error-banner">
            {{ error }}
          </div>

          <div v-if="successMessage" class="success-banner">
            {{ successMessage }}
          </div>
        </form>

        <p class="auth-switch">
          Already have an account?
          <router-link to="/login">Login here</router-link>
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth/auth'

const authStore = useAuthStore()

const form = reactive({
  username: '',
  name: '',
  email: '',
  password: '',
  gender: '' as 'Male' | 'Female' | '',
  role: '' as 'Customer' | 'Flight Airline' | 'Superadmin' | '',
})

const isLoading = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const handleRegister = async () => {
  if (form.gender === '' || form.role === '') {
    error.value = 'Please fill in all fields'
    return
  }

  isLoading.value = true
  error.value = null
  successMessage.value = null

  try {
    const result = await authStore.registerUser({
      username: form.username,
      name: form.name,
      email: form.email,
      password: form.password,
      gender: form.gender,
      role: form.role,
    })

    if (result.success) {
      successMessage.value = 'Registration successful! You can now login.'
      Object.assign(form, {
        username: '',
        name: '',
        email: '',
        password: '',
        gender: '',
        role: '',
      })
    } else {
      error.value = result.message || 'Registration failed'
    }
  } catch (err: any) {
    error.value = err.message || 'An error occurred'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  background: #ffffff;
  display: flex;
  flex-direction: column;
}

.auth-hero {
  padding: 2.5rem 2rem 2rem;
  background: #F9CDD5;
  color: #ffffff;
}

.hero-content {
  max-width: 640px;
  margin: 0 auto;
}

.hero-title {
  margin: 0;
  font-size: 2.25rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.hero-subtitle {
  margin: 0.75rem 0 0;
  font-size: 1rem;
  opacity: 0.96;
}

.auth-shell {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem 3rem;
  display: flex;
  justify-content: center;
}

.auth-card {
  margin-top: -3rem;
  background: var(--color-white);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-gray-100);
  padding: 2.25rem 2.5rem;
  max-width: 480px;
  width: 100%;
}

.card-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--color-gray-900);
}

.card-header p {
  margin: 0.6rem 0 0;
  font-size: 0.95rem;
  color: var(--color-gray-600);
}

.auth-form {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-label {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-gray-700);
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-lg);
  border: 2px solid var(--color-gray-200);
  background: var(--color-white);
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-gray-800);
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(249, 205, 213, 0.2);
}

.auth-btn {
  width: 100%;
  margin-top: 0.25rem;
}

.error-banner {
  margin-top: 0.75rem;
  padding: 0.7rem 0.9rem;
  border-radius: var(--radius-lg);
  background: rgba(252, 165, 165, 0.18);
  border: 1px solid var(--color-error);
  color: var(--color-error);
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
}

.success-banner {
  margin-top: 0.75rem;
  padding: 0.7rem 0.9rem;
  border-radius: var(--radius-lg);
  background: rgba(110, 231, 183, 0.15);
  border: 1px solid #10b981;
  color: #047857;
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
}

.auth-switch {
  margin-top: 1.75rem;
  font-size: 0.9rem;
  color: var(--color-gray-600);
  text-align: center;
}

.auth-switch a {
  font-weight: 600;
}

@media (max-width: 768px) {
  .auth-hero {
    padding: 2rem 1.25rem 1.5rem;
  }

  .hero-title {
    font-size: 1.9rem;
  }

  .auth-shell {
    padding: 0 1.25rem 2.5rem;
  }

  .auth-card {
    margin-top: -2.5rem;
    padding: 1.75rem 1.75rem 2rem;
  }
}
</style>