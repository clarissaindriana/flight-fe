import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import AirplaneList from '@/components/airplane/AirplaneList.vue'
import AirplaneCreate from '@/components/airplane/AirplaneCreate.vue'
import UpdateAirplaneView from '@/views/airplane/UpdateAirplaneView.vue'
import FlightListView from '@/views/flight/FlightListView.vue'

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
  ],
})

export default router
