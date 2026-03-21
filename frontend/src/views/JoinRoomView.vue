<template>
  <div class="page-join">
    <header class="page-header">
      <BackButton />
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
          <label class="form-label">选择头像</label>
          <div class="avatar-grid">
            <button
              v-for="emoji in avatarEmojis"
              :key="emoji"
              class="avatar-option"
              :class="{ active: avatar === emoji }"
              type="button"
              @click="avatar = emoji"
            >
              {{ emoji }}
            </button>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">房间号</label>
          <input 
            v-model="roomCode"
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
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useRoomStore } from '@/stores/room'
import message from '@/utils/message'
import BackButton from '@/components/common/BackButton.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const roomStore = useRoomStore()

const nickname = ref(userStore.nickname || '')
const avatar = ref('👤')
const roomCode = ref('')
const loading = ref(false)
const copied = ref(false)
const linkInput = ref(null)
const avatarEmojis = ['👤', '😀', '😎', '🤖', '🐱', '🐶', '🦊', '🐼', '🐯', '🦁', '🐨', '🐻']

// 从URL参数获取房间号
onMounted(() => {
  if (route.params.roomCode) {
    roomCode.value = route.params.roomCode.toUpperCase()
  }
  
  // 解析邀请链接
  const urlParams = new URLSearchParams(window.location.search)
  const roomFromUrl = urlParams.get('room')
  if (roomFromUrl) {
    roomCode.value = roomFromUrl.toUpperCase()
  }
})

const inviteLink = computed(() => {
  if (!roomCode.value) return ''
  return `${window.location.origin}/join/${roomCode.value}`
})

async function handleJoin() {
  if (!nickname.value.trim()) {
    message.warning('请输入昵称')
    return
  }
  
  loading.value = true
  try {
    // 确保有会话
    if (!userStore.sessionId) {
      await userStore.createSession(nickname.value, avatar.value)
    }
    
    // 加入房间
    await roomStore.joinRoom(roomCode.value, userStore.sessionId)
    router.push(`/room/${roomCode.value}`)
  } catch (error) {
    message.error(error.message || '加入房间失败')
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

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}

.avatar-option {
  padding: 12px;
  font-size: 1.5rem;
  background: var(--bg-secondary);
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
}

.avatar-option:hover {
  background: var(--bg-tertiary);
  transform: scale(1.1);
}

.avatar-option.active {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-secondary);
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