import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AirplaneList from '../components/airplane/AirplaneList.vue'
import AirplaneCreate from '../components/airplane/AirplaneCreate.vue'
import UpdateAirplaneView from '../views/airplane/UpdateAirplaneView.vue'

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
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
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
  ],
})

export default router
