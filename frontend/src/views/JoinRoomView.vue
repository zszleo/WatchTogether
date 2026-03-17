<template>
  <div class="page-join">
    <header class="page-header">
      <router-link to="/" class="back-link">← 返回</router-link>
      <h1 class="page-title">加入房间</h1>
    </header>
    
    <main class="page-content">
      <form @submit.prevent="handleJoin" class="join-form">
        <div class="form-group">
          <label class="form-label">你的昵称</label>
          <input 
            v-model="nickname"
            type="text" 
            class="input"
            placeholder="输入昵称"
            required
            maxlength="20"
          />
        </div>
        
        <div class="form-group">
          <label class="form-label">房间号</label>
          <input 
            v-model="roomId"
            type="text" 
            class="input input-large"
            placeholder="输入6位房间号"
            required
            pattern="[A-Za-z0-9]{6}"
            maxlength="6"
          />
        </div>
        
        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
          {{ loading ? '加入中...' : '加入房间' }}
        </button>
      </form>
      
      <div class="divider">
        <span>或</span>
      </div>
      
      <div class="invite-section" v-if="inviteLink">
        <p class="invite-label">邀请链接</p>
        <div class="invite-link-box">
          <input 
            :value="inviteLink" 
            type="text" 
            class="input" 
            readonly 
            ref="linkInput"
          />
          <button @click="copyLink" class="btn btn-copy">
            {{ copied ? '已复制' : '复制' }}
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useRoomStore } from '@/stores/room'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const roomStore = useRoomStore()

const nickname = ref(userStore.nickname || '')
const roomId = ref('')
const loading = ref(false)
const copied = ref(false)
const linkInput = ref(null)

// 从URL参数获取房间号
onMounted(() => {
  if (route.params.roomId) {
    roomId.value = route.params.roomId.toUpperCase()
  }
  
  // 解析邀请链接
  const urlParams = new URLSearchParams(window.location.search)
  const roomFromUrl = urlParams.get('room')
  if (roomFromUrl) {
    roomId.value = roomFromUrl.toUpperCase()
  }
})

const inviteLink = computed(() => {
  if (!roomId.value) return ''
  return `${window.location.origin}/join/${roomId.value}`
})

async function handleJoin() {
  if (!nickname.value.trim()) {
    alert('请输入昵称')
    return
  }
  
  loading.value = true
  try {
    // 确保有会话
    if (!userStore.sessionId) {
      await userStore.createSession(nickname.value)
    }
    
    // 加入房间
    await roomStore.joinRoom(roomId.value, userStore.sessionId)
    router.push(`/room/${roomId.value}`)
  } catch (error) {
    alert(error.message || '加入房间失败')
  } finally {
    loading.value = false
  }
}

function copyLink() {
  linkInput.value?.select()
  document.execCommand('copy')
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}
</script>

<style scoped>
.page-join {
  min-height: 100%;
  background: 
    radial-gradient(ellipse at 70% 70%, rgba(196, 130, 74, 0.1) 0%, transparent 50%),
    var(--bg-primary);
}

.page-header {
  padding: 24px;
  text-align: center;
}

.back-link {
  display: inline-block;
  margin-bottom: 16px;
  color: var(--text-secondary);
}

.page-title {
  font-family: var(--font-display);
  font-size: 2rem;
}

.page-content {
  max-width: 480px;
  margin: 0 auto;
  padding: 24px;
}

.join-form {
  margin-bottom: 32px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
}

.input-large {
  font-size: 1.25rem;
  text-align: center;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.btn-block {
  width: 100%;
  padding: 16px;
}

.divider {
  text-align: center;
  margin: 32px 0;
  position: relative;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40%;
  height: 1px;
  background: var(--bg-tertiary);
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.divider span {
  background: var(--bg-primary);
  padding: 0 16px;
  color: var(--text-muted);
}

.invite-section {
  text-align: center;
}

.invite-label {
  font-weight: 600;
  margin-bottom: 12px;
}

.invite-link-box {
  display: flex;
  gap: 12px;
}

.invite-link-box .input {
  flex: 1;
  font-size: 0.875rem;
}

.btn-copy {
  padding: 12px 20px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  font-weight: 500;
  transition: all var(--transition-base);
}

.btn-copy:hover {
  background: var(--accent-primary);
  color: white;
}
</style>