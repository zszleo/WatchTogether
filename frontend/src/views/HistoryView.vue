<template>
  <div class="page-history">
    <header class="page-header">
      <BackButton />
      <h1 class="page-title">历史记录</h1>
    </header>
    
    <main class="page-content">
      <div v-if="loading" class="loading">
        加载中...
      </div>
      
      <div v-else-if="history.length === 0" class="empty-history">
        <div class="empty-icon">📜</div>
        <p>暂无历史记录</p>
        <router-link to="/" class="btn btn-primary">去首页创建房间</router-link>
      </div>
      
      <div v-else class="history-list">
        <div 
          v-for="item in history" 
          :key="item.roomCode"
          class="history-card"
          @click="goToRoom(item.roomCode)"
        >
          <div class="history-info">
            <h3 class="room-name">{{ item.roomName || '房间 ' + item.roomCode }}</h3>
            <p class="room-meta">
              <span class="room-id">房间号: {{ item.roomCode }}</span>
              <span class="room-time">加入时间: {{ formatTime(item.joinedAt) }}</span>
            </p>
            <div class="room-stats">
              <span class="stat-item">👥 {{ item.userCount || 0 }}人</span>
              <span class="stat-item">📅 {{ formatDate(item.joinedAt) }}</span>
            </div>
          </div>
          <button class="btn btn-join">重新加入</button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { SessionApi } from '@/services/api'
import BackButton from '@/components/common/BackButton.vue'

const router = useRouter()
const userStore = useUserStore()

const history = ref([])
const loading = ref(false)

async function loadHistory() {
  if (!userStore.sessionId) return
  
  loading.value = true
  try {
    const resp = await SessionApi.getHistory(userStore.sessionId)
    history.value = resp.data.rooms || []
  } catch (error) {
    history.value = []
  } finally {
    loading.value = false
  }
}

function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

function goToRoom(roomCode) {
  router.push(`/join/${roomCode}`)
}

onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.page-history {
  min-height: 100%;
  background: 
    radial-gradient(ellipse at 30% 30%, rgba(167, 195, 166, 0.1) 0%, transparent 50%),
    var(--bg-primary);
}

.page-header {
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}



.page-title {
  font-family: var(--font-display);
  font-size: 2rem;
}

.page-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
}

.empty-history {
  text-align: center;
  padding: 60px 24px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-history p {
  color: var(--text-muted);
  margin-bottom: 24px;
}

.history-list {
  display: grid;
  gap: 16px;
}

.history-card {
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

.history-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--accent-primary);
}

.history-info {
  flex: 1;
}

.room-name {
  font-family: var(--font-display);
  font-size: 1.125rem;
  margin-bottom: 8px;
}

.room-meta {
  font-size: 0.875rem;
  color: var(--text-muted);
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.room-id {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--accent-caramel);
}

.room-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
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

@media (max-width: 768px) {
  .history-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .btn-join {
    align-self: flex-end;
  }
}
</style>