import { createRouter, createWebHistory } from 'vue-router'

const MapView = () => import('@/views/Map.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      // 懒加载
      component: MapView,
    },
  ],
})

export default router
