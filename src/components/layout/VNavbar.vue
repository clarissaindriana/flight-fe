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
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(25px);
  border-bottom: 2px solid var(--color-gray-100);
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  animation: slideIn 0.8s ease-out;
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 80px;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 1.75rem;
  font-weight: 900;
  color: var(--color-gray-900);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
}

.nav-brand::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(135deg, var(--color-pink) 0%, var(--color-orange) 50%, var(--color-red) 100%);
  border-radius: var(--radius-full);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.nav-brand:hover::after {
  transform: scaleX(1);
}

.brand-icon {
  font-size: 2.5rem;
  background: linear-gradient(135deg, var(--color-pink) 0%, var(--color-orange) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 2px 4px rgba(236, 72, 153, 0.3));
  animation: pulse 3s infinite;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
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
}

.user-name {
  color: var(--color-gray-900);
}

.user-role {
  color: var(--color-gray-600);
  font-size: 0.9rem;
}

.logout-btn {
  padding: 0.5rem 1rem;
  background: var(--color-red);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logout-btn:hover {
  background: var(--color-red-dark);
  transform: translateY(-1px);
}

.auth-links {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.auth-link {
  padding: 0.75rem 1.25rem !important;
  font-size: 0.95rem !important;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.75rem;
  border-radius: var(--radius-xl);
  text-decoration: none;
  color: var(--color-gray-700);
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--color-white);
  border: 2px solid var(--color-gray-200);
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.nav-link::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--color-pink) 0%, var(--color-orange) 100%);
  transition: left 0.5s;
  z-index: -1;
}

.nav-link:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 25px rgba(236, 72, 153, 0.2);
  border-color: var(--color-pink-light);
  color: white;
}

.nav-link:hover::before {
  left: 0;
}

.nav-link.router-link-active {
  background: linear-gradient(135deg, var(--color-pink) 0%, var(--color-orange) 100%);
  color: white;
  border-color: var(--color-pink);
  box-shadow: 0 8px 25px rgba(236, 72, 153, 0.4);
  transform: translateY(-2px);
}

.link-icon {
  font-size: 1.2rem;
  transition: transform 0.3s ease;
}

.nav-link:hover .link-icon {
  transform: scale(1.1);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .nav-container {
    padding: 0 1rem;
    flex-direction: column;
    height: auto;
    padding-top: 1rem;
    padding-bottom: 1rem;
  }

  .nav-brand {
    font-size: 1.25rem;
  }

  .nav-links {
    margin-top: 1rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .nav-link {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
}

@media (min-width: 1024px) {
  .nav-container {
    padding: 0 3rem;
    height: 100px;
  }

  .nav-brand {
    font-size: 2.25rem;
  }

  .nav-links {
    gap: 2rem;
  }

  .nav-link {
    padding: 1.25rem 2rem;
    font-size: 1.1rem;
  }
}
</style>