<template>
  <div class="auth-page">

    <section class="auth-shell">
      <div class="auth-card">
        <header class="card-header">
          <h2>Login</h2>
        </header>

        <form @submit.prevent="handleLogin" class="auth-form">
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
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" :disabled="isLoading" class="btn btn-primary auth-btn">
            {{ isLoading ? 'Logging in...' : 'Login' }}
          </button>

          <div v-if="error" class="error-banner">
            {{ error }}
          </div>
        </form>

        <p class="auth-switch">
          Don't have an account?
          <router-link to="/register">Register here</router-link>
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  email: '',
  password: '',
})

const isLoading = ref(false)
const error = ref<string | null>(null)

const handleLogin = async () => {
  isLoading.value = true
  error.value = null

  try {
    const result = await authStore.loginUser(form.email, form.password)

    if (result.success) {
      router.push('/')
    } else {
      error.value = result.message || 'Login failed'
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
  max-width: 420px;
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