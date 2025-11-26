<template>
  <div class="register-container">
    <div class="register-card">
      <h2>Register</h2>
      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-group">
          <label for="username">Username</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            required
            placeholder="Enter your username"
          />
        </div>

        <div class="form-group">
          <label for="name">Full Name</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            required
            placeholder="Enter your full name"
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            placeholder="Enter your email"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            placeholder="Enter your password"
          />
        </div>

        <div class="form-group">
          <label for="gender">Gender</label>
          <select id="gender" v-model="form.gender" required>
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        <div class="form-group">
          <label for="role">Role</label>
          <select id="role" v-model="form.role" required>
            <option value="">Select role</option>
            <option value="Customer">Customer</option>
            <option value="Flight Airline">Flight Airline</option>
            <option value="Superadmin">Superadmin</option>
          </select>
        </div>

        <button type="submit" :disabled="isLoading" class="register-btn">
          {{ isLoading ? 'Registering...' : 'Register' }}
        </button>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div v-if="successMessage" class="success-message">
          {{ successMessage }}
        </div>
      </form>

      <p class="login-link">
        Already have an account?
        <router-link to="/login">Login here</router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  username: '',
  name: '',
  email: '',
  password: '',
  gender: '' as 'Male' | 'Female' | '',
  role: '' as 'Customer' | 'Flight Airline' | 'Superadmin' | ''
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
      role: form.role
    })

    if (result.success) {
      successMessage.value = 'Registration successful! You can now login.'
      // Reset form
      Object.assign(form, {
        username: '',
        name: '',
        email: '',
        password: '',
        gender: '',
        role: ''
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
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f5f5f5;
  padding: 1rem;
}

.register-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.register-card h2 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #555;
}

.form-group input,
.form-group select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.register-btn {
  padding: 0.75rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.register-btn:hover:not(:disabled) {
  background: #218838;
}

.register-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.error-message {
  color: #dc3545;
  text-align: center;
  margin-top: 1rem;
  padding: 0.5rem;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}

.success-message {
  color: #155724;
  text-align: center;
  margin-top: 1rem;
  padding: 0.5rem;
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
}

.login-link {
  text-align: center;
  margin-top: 1.5rem;
  color: #666;
}

.login-link a {
  color: #007bff;
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
}
</style>