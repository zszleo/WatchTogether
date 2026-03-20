<template>
  <div class="home">
    <header class="home-header">
      <div class="header-content">
        <div class="header-title">
          <h1 class="logo">一起看</h1>
          <p class="tagline">和朋友同步观影，实时聊天</p>
        </div>
        <nav class="home-nav">
          <router-link to="/history" class="nav-item">
            <span class="nav-icon">📋</span>
            历史
          </router-link>
          <router-link to="/profile" class="nav-item">
            <span class="nav-icon">👤</span>
            个人
          </router-link>
        </nav>
      </div>
    </header>
    
    <main class="home-main">
      <div class="action-buttons">
        <router-link to="/create" class="btn btn-primary btn-large">
          <span class="btn-icon">🎬</span>
          创建房间
        </router-link>
        <router-link to="/join" class="btn btn-secondary btn-large">
          <span class="btn-icon">🚪</span>
          加入房间
        </router-link>
      </div>
      
      <LoadingSpinner v-if="loadingPublicRooms" text="加载公开房间..." />
      
      <ErrorComponent v-else-if="publicRoomsError" :error="publicRoomsError" />
      
      <section class="rooms-section" v-else-if="publicRooms.length > 0">
        <h2 class="section-title">公开房间</h2>
        <div class="rooms-grid">
          <div 
            v-for="room in publicRooms" 
            :key="room.id" 
            class="room-card"
            @click="goToRoom(room.code)"
          >
            <div class="room-info">
              <h3 class="room-name">{{ room.name || '房间 ' + room.id }}</h3>
              <p class="room-meta">
                <span class="room-users">{{ room.userCount }}/{{ room.maxUsers }}</span>
                <span class="room-creator">by {{ room.creatorNickname }}</span>
              </p>
            </div>
            <button class="btn btn-join">加入</button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRoomStore } from '@/stores/room'
import { storeToRefs } from 'pinia'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorComponent from '@/components/common/ErrorComponent.vue'

const router = useRouter()
const roomStore = useRoomStore()
const { publicRooms, loadingPublicRooms, publicRoomsError } = storeToRefs(roomStore)

onMounted(() => {
  roomStore.fetchPublicRooms()
})

function goToRoom(roomCode) {
  router.push(`/join/${roomCode}`)
}
</script>

<style scoped>
.home {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  background: 
    radial-gradient(ellipse at 20% 20%, rgba(167, 195, 166, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 80%, rgba(196, 130, 74, 0.1) 0%, transparent 50%),
    linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
}

.home-header {
  position: relative;
  padding: 80px 24px 40px;
  text-align: center;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
}

.header-title {
  text-align: center;
}

.home-nav {
  position: absolute;
  top: 30px;
  right: 24px;
  display: flex;
  gap: 16px;
}

.logo {
  font-family: var(--font-display);
  font-size: 3.5rem;
  color: var(--accent-caramel);
  margin-bottom: 8px;
  letter-spacing: 0.1em;
}

.tagline {
  color: var(--text-secondary);
  font-size: 1.125rem;
}

.home-main {
  flex: 1;
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
  padding: 20px 24px 40px;
}

.action-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-bottom: 48px;
}

.btn-large {
  padding: 20px 56px;
  font-size: 1.25rem;
}

.btn-icon {
  margin-right: 10px;
}

.rooms-section {
  margin-top: 32px;
}

.section-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  color: var(--text-primary);
  margin-bottom: 20px;
  text-align: center;
}

.rooms-grid {
  display: grid;
  gap: 16px;
}

.room-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  border-radius: var(--radius-lg);
  padding: 20px 24px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all var(--transition-base);
  border: 2px solid transparent;
}

.room-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--accent-primary);
}

.room-name {
  font-family: var(--font-display);
  font-size: 1.125rem;
  margin-bottom: 4px;
}

.room-meta {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.room-users {
  margin-right: 12px;
  color: var(--accent-primary);
  font-weight: 600;
}

.btn-join {
  padding: 8px 20px;
  background: var(--accent-primary);
  color: white;
  border-radius: var(--radius-sm);
  font-weight: 500;
  transition: all var(--transition-base);
}

.btn-join:hover {
  background: var(--accent-secondary);
}

.home-nav {
  display: flex;
  gap: 16px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  font-weight: 500;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}

.nav-item:hover,
.nav-item.router-link-active {
  color: var(--accent-caramel);
  background: var(--bg-tertiary);
}

.nav-icon {
  font-size: 1rem;
}
</style>