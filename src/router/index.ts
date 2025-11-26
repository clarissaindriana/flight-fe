import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import AirplaneList from '@/components/airplane/AirplaneList.vue'
import AirplaneCreate from '@/components/airplane/AirplaneCreate.vue'
import UpdateAirplaneView from '@/views/airplane/UpdateAirplaneView.vue'
import FlightListView from '@/views/flight/FlightListView.vue'
import LoginView from '@/views/auth/LoginView.vue'
import RegisterView from '@/views/auth/RegisterView.vue'
import { useAuthStore } from '@/stores/auth/auth'
import { canAccess } from '@/lib/rbac'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
    },
    {
      path: '/airplanes',
      name: 'airplanes',
      component: AirplaneList,
    },
    {
      path: '/airplanes/create',
      name: 'airplane-create',
      component: AirplaneCreate,
    },
    {
      path: '/airplanes/update/:id',
      name: 'airplane-update',
      component: UpdateAirplaneView,
      props: true,
    },
    // Flights
    {
      path: '/flights',
      name: 'flights',
      component: FlightListView,
    },
    {
      path: '/flights/create',
      name: 'flight-create',
      component: () => import('@/views/flight/FlightCreateView.vue'),
    },
    {
      path: '/flights/:id',
      name: 'flight-detail',
      component: () => import('@/views/flight/FlightDetailView.vue'),
      props: true,
    },
    {
      path: '/flights/:id/update',
      name: 'flight-update',
      component: () => import('@/views/flight/FlightUpdateView.vue'),
      props: true,
    },
    // Bookings
    {
      path: '/bookings',
      name: 'bookings',
      component: () => import('@/views/booking/BookingListView.vue'),
    },
    {
      path: '/bookings/create',
      name: 'booking-create',
      component: () => import('@/views/booking/CreateBookingView.vue'),
    },
    {
      path: '/bookings/:id',
      name: 'booking-detail',
      component: () => import('@/views/booking/BookingDetailView.vue'),
      props: true,
    },
    {
      path: '/bookings/:id/update',
      name: 'booking-update',
      component: () => import('@/views/booking/UpdateBookingView.vue'),
      props: true,
    },
  ],
})

// Navigation guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Initialize auth state
  authStore.initializeAuth()

  // Public routes that don't require authentication
  const publicRoutes = ['login', 'register']

  // Check if route requires authentication
  if (!publicRoutes.includes(to.name as string)) {
    if (!authStore.isLoggedIn) {
      next({ name: 'login' })
      return
    }

    // Check RBAC for specific routes
    const routePermissions: Record<string, string[]> = {
      'airplanes': ['airplanes'],
      'airplane-create': ['airplanes/create'],
      'airplane-update': ['airplanes/update'],
      'flights': ['flights'],
      'flight-create': ['flights/create'],
      'flight-update': ['flights/update'],
      'bookings': ['bookings'],
      'booking-create': ['bookings/create'],
      'booking-update': ['bookings/update'],
    }

    const requiredPermission = routePermissions[to.name as string]
    if (requiredPermission && requiredPermission[0] && !canAccess(requiredPermission[0])) {
      // Redirect to home if no permission
      next({ name: 'home' })
      return
    }
  }

  // Redirect authenticated users away from login/register
  if (publicRoutes.includes(to.name as string) && authStore.isLoggedIn) {
    next({ name: 'home' })
    return
  }

  next()
})

export default router
