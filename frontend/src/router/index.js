// frontend/src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { defineAsyncComponent } from 'vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import HomeView from '@/views/HomeView.vue'

// 异步组件工厂函数
const asyncComponent = (loader) => defineAsyncComponent({
  loader,
  loadingComponent: LoadingSpinner,
  errorComponent: defineAsyncComponent(() => import('@/components/common/ErrorComponent.vue')),
  delay: 200,
  timeout: 3000
})

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/create',
      name: 'create-room',
      component: asyncComponent(() => import('@/views/CreateRoomView.vue'))
    },
    {
      path: '/join/:roomId?',
      name: 'join-room',
      component: asyncComponent(() => import('@/views/JoinRoomView.vue'))
    },
    {
      path: '/room/:roomId',
      name: 'room',
      component: asyncComponent(() => import('@/views/RoomView.vue'))
    },
    {
      path: '/history',
      name: 'history',
      component: asyncComponent(() => import('@/views/HistoryView.vue'))
    },
    {
      path: '/profile',
      name: 'profile',
      component: asyncComponent(() => import('@/views/ProfileView.vue'))
    }
  ]
})

export default router