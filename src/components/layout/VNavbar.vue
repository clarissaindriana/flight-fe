<template>
  <nav class="navbar">
    <div class="nav-container">
      <div class="nav-brand">
        <span class="brand-icon">✈️</span>
        <span class="brand-text">Flight Manager</span>
      </div>

      <div class="nav-links">
        <router-link to="/" class="nav-link">
          <span class="link-icon">🏠</span>
          Home
        </router-link>
        <router-link v-if="canAccess('airplanes')" to="/airplanes" class="nav-link">
          <span class="link-icon">🛩️</span>
          Airplanes
        </router-link>
        <router-link v-if="canAccess('flights')" to="/flights" class="nav-link">
          <span class="link-icon">🛫</span>
          Flights
        </router-link>
        <router-link v-if="canAccess('bookings')" to="/bookings" class="nav-link">
          <span class="link-icon">🎫</span>
          Bookings
        </router-link>
        <router-link v-if="canAccess('bills')" to="/bills" class="nav-link">
          <span class="link-icon">💳</span>
          Bills
        </router-link>
      </div>

      <div class="nav-auth">
        <div v-if="isLoggedIn" class="user-info">
          <span class="user-name">{{ currentUser?.name }}</span>
          <span class="user-role">({{ currentUser?.role }})</span>
          <button @click="handleLogout" class="logout-btn">
            <span class="link-icon">🚪</span>
            Logout
          </button>
        </div>
        <div v-else class="auth-links">
          <router-link to="/login" class="nav-link auth-link">
            <span class="link-icon">🔐</span>
            Login
          </router-link>
          <router-link to="/register" class="nav-link auth-link">
            <span class="link-icon">📝</span>
            Register
          </router-link>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth/auth'
import { canAccess } from '@/lib/rbac'

const router = useRouter()
const authStore = useAuthStore()

const isLoggedIn = computed(() => authStore.isLoggedIn)
const currentUser = computed(() => authStore.currentUser)

const handleLogout = async () => {
  await authStore.logoutUser()
  router.push('/login')
}
</script>

<style scoped>
.navbar {
  background: #ffffff;
  border-bottom: 1px solid var(--color-gray-200);
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 70px;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-gray-900);
  cursor: pointer;
}

.brand-icon {
  font-size: 1.75rem;
}

.brand-text {
  color: #7A8450;
}

.nav-links {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.nav-auth {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-gray-700);
  font-weight: 500;
  font-size: 0.9rem;
}

.user-name {
  color: var(--color-gray-900);
  font-weight: 600;
}

.user-role {
  color: var(--color-gray-500);
  font-size: 0.85rem;
}

.logout-btn {
  padding: 0.5rem 1rem;
  background: #ffffff;
  color: var(--color-error);
  border: 1.5px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.logout-btn:hover {
  background: var(--color-error-light);
  border-color: var(--color-error);
}

.auth-links {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.auth-link {
  padding: 0.6rem 1.25rem !important;
  font-size: 0.9rem !important;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.25rem;
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--color-gray-700);
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  background: transparent;
  border: none;
}

.nav-link:hover {
  background: var(--color-gray-50);
  color: var(--color-gray-900);
}

.nav-link.router-link-active {
  background: #7A8450;
  color: #ffffff;
  font-weight: 700;
}

.link-icon {
  font-size: 1.1rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .nav-container {
    padding: 0 1rem;
    flex-direction: column;
    height: auto;
    padding-top: 1rem;
    padding-bottom: 1rem;
    gap: 1rem;
  }

  .nav-brand {
    font-size: 1.25rem;
  }

  .brand-icon {
    font-size: 1.5rem;
  }

  .nav-links {
    flex-wrap: wrap;
    justify-content: center;
    width: 100%;
  }

  .nav-link {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }

  .user-info {
    flex-direction: column;
    text-align: center;
    gap: 0.25rem;
  }
}

@media (min-width: 1024px) {
  .nav-container {
    padding: 0 3rem;
  }

  .nav-links {
    gap: 0.75rem;
  }
}
</style>