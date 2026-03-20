<!-- frontend/src/components/room/RoomForm.vue -->
<template>
  <form @submit.prevent="handleSubmit" class="room-form">
    <div class="form-group">
      <label class="form-label">你的昵称</label>
      <input 
        v-model="form.nickname"
        type="text" 
        class="input"
        placeholder="输入昵称"
        required
        maxlength="20"
      />
    </div>
    
    <div class="form-group">
      <label class="form-label">房间名称 <span class="optional">(可选)</span></label>
      <input 
        v-model="form.name"
        type="text" 
        class="input"
        placeholder="默认：房间 + 编号"
        maxlength="50"
      />
    </div>
    
    <div class="form-group">
      <label class="form-label">最大人数: {{ form.maxUsers }}人</label>
      <input 
        v-model.number="form.maxUsers"
        type="range" 
        class="range-slider"
        min="2"
        max="10"
        step="1"
      />
      <div class="range-labels">
        <span>2人</span>
        <span>10人</span>
      </div>
    </div>
    
    <div class="form-group">
      <label class="toggle-label">
        <span>公开房间</span>
        <input 
          v-model="form.isPublic"
          type="checkbox" 
          class="toggle-input"
        />
        <span class="toggle-switch"></span>
      </label>
      <p class="form-hint">公开房间会显示在首页列表中</p>
    </div>
    
    <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
      {{ loading ? '创建中...' : '创建房间' }}
    </button>
  </form>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useRoomStore } from '@/stores/room'

const emit = defineEmits(['success'])
const router = useRouter()
const userStore = useUserStore()
const roomStore = useRoomStore()

const loading = ref(false)
const form = reactive({
  nickname: userStore.nickname || '',
  name: '',
  maxUsers: 5,
  isPublic: true
})

function generateDefaultName() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

async function handleSubmit() {
  loading.value = true
  try {
    // 确保有会话
    if (!userStore.sessionId) {
      await userStore.createSession(form.nickname)
    }
    
    // 创建房间
    const room = await roomStore.createRoom({
      name: form.name || generateDefaultName(),
      maxUsers: form.maxUsers,
      isPublic: form.isPublic,
      creatorSessionId: userStore.sessionId,
      creatorNickname: userStore.nickname
    })
    
    emit('success', room)
    router.push(`/room/${room.id}`)
  } catch (error) {
    alert(error.message || '创建房间失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.room-form {
  max-width: 480px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.optional {
  font-weight: 400;
  color: var(--text-muted);
  font-size: 0.875rem;
}

.range-slider {
  width: 100%;
  height: 8px;
  -webkit-appearance: none;
  background: var(--bg-tertiary);
  border-radius: 4px;
  outline: none;
}

.range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 24px;
  height: 24px;
  background: var(--accent-primary);
  border-radius: 50%;
  cursor: pointer;
  transition: transform var(--transition-base);
}

.range-slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.range-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 0.875rem;
  color: var(--text-muted);
}

.toggle-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.toggle-input {
  display: none;
}

.toggle-switch {
  width: 52px;
  height: 28px;
  background: var(--bg-tertiary);
  border-radius: 14px;
  position: relative;
  transition: background var(--transition-base);
}

.toggle-switch::after {
  content: '';
  position: absolute;
  width: 22px;
  height: 22px;
  background: white;
  border-radius: 50%;
  top: 3px;
  left: 3px;
  transition: transform var(--transition-base);
  box-shadow: var(--shadow-sm);
}

.toggle-input:checked + .toggle-switch {
  background: var(--accent-primary);
}

.toggle-input:checked + .toggle-switch::after {
  transform: translateX(24px);
}

.form-hint {
  margin-top: 8px;
  font-size: 0.875rem;
  color: var(--text-muted);
}

.btn-block {
  width: 100%;
  margin-top: 32px;
  padding: 16px;
}
</style>