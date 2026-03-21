<template>
  <div class="page-profile">
    <header class="page-header">
      <BackButton />
      <h1 class="page-title">个人中心</h1>
    </header>
    
    <main class="page-content">
      <div v-if="!userStore.isLoggedIn" class="not-logged-in">
        <div class="not-logged-icon">👤</div>
        <p>未登录</p>
        <router-link to="/" class="btn btn-primary">返回首页</router-link>
      </div>
      
      <div v-else class="profile-container">
        <div class="profile-card">
          <div class="avatar-section">
            <div class="avatar-display">
              <span class="avatar-emoji">{{ form.avatar }}</span>
            </div>
            <div class="avatar-options">
              <div class="avatar-grid">
                <button
                  v-for="emoji in avatarEmojis"
                  :key="emoji"
                  class="avatar-option"
                  :class="{ active: form.avatar === emoji }"
                  @click="form.avatar = emoji"
                >
                  {{ emoji }}
                </button>
              </div>
            </div>
          </div>
          
          <form @submit.prevent="saveProfile" class="profile-form">
            <div class="form-group">
              <input
                v-model="form.nickname"
                type="text"
                class="input"
                placeholder="输入昵称"
                required
                maxlength="20"
              />
            </div>
            
            <div class="profile-info">
              <div class="info-item">
                <span class="info-label">会话ID</span>
                <span class="info-value">{{ userStore.sessionId }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">创建时间</span>
                <span class="info-value">{{ formatDate(userStore.createdAt) }}</span>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="loading || !isChanged">
                {{ loading ? '保存中...' : '保存更改' }}
              </button>
              <button type="button" class="btn btn-secondary" @click="resetForm" :disabled="!isChanged">
                重置
              </button>
              <button type="button" class="btn btn-logout" @click="logout">
                退出登录
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import message from '@/utils/message'
import BackButton from '@/components/common/BackButton.vue'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const form = ref({
  nickname: '',
  avatar: '👤'
})

const avatarEmojis = ['👤', '😀', '😎', '🤖', '🐱', '🐶', '🦊', '🐼', '🐯', '🦁', '🐨', '🐻']

// 检查是否有更改
const isChanged = computed(() => {
  return form.value.nickname !== userStore.nickname || form.value.avatar !== userStore.avatar
})

// 初始化表单
function initForm() {
  form.value = {
    nickname: userStore.nickname || '',
    avatar: userStore.avatar || '👤'
  }
}

// 保存个人资料
async function saveProfile() {
  if (!isChanged.value) return
  
  loading.value = true
  try {
    await userStore.updateProfile({
      nickname: form.value.nickname,
      avatar: form.value.avatar
    })
    message.success('个人资料已更新')
  } catch (error) {
    message.error('更新失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

// 重置表单
function resetForm() {
  initForm()
}

// 退出登录
function logout() {
  if (confirm('确定要退出登录吗？')) {
    userStore.logout()
    router.push('/')
  }
}

// 格式化日期
function formatDate(timestamp) {
  if (!timestamp) return '未知'
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  if (userStore.isLoggedIn) {
    initForm()
  }
})
</script>

<style scoped>
.page-profile {
  min-height: 100%;
  background: 
    radial-gradient(ellipse at 70% 30%, rgba(196, 130, 74, 0.1) 0%, transparent 50%),
    var(--bg-primary);
}

.page-header {
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
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
  max-width: 700px;
  margin: 0 auto;
  padding: 24px;
}

.not-logged-in {
  text-align: center;
  padding: 60px 24px;
}

.not-logged-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.5;
}

.not-logged-in p {
  color: var(--text-muted);
  margin-bottom: 24px;
}

.profile-card {
  background: white;
  border-radius: var(--radius-xl);
  padding: 32px;
  box-shadow: var(--shadow-lg);
}

.avatar-section {
  display: flex;
  gap: 32px;
  margin-bottom: 32px;
  padding-bottom: 32px;
  border-bottom: 1px solid var(--bg-tertiary);
}

.avatar-display {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-emoji {
  font-size: 4rem;
  display: block;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: 50%;
  box-shadow: var(--shadow-md);
}

.avatar-options {
  flex: 1;
}

.avatar-label {
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text-primary);
  text-align: center;
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

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-primary);
  text-align: center;
}

.profile-info {
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  color: var(--text-secondary);
  font-weight: 500;
}

.info-value {
  font-family: var(--font-mono);
  color: var(--text-primary);
  word-break: break-all;
  text-align: right;
}

.form-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn {
  flex: 1;
  min-width: 120px;
}

.btn-logout {
  background: var(--error);
  color: white;
}

.btn-logout:hover {
  background: #d1664f;
}

@media (max-width: 768px) {
  .avatar-section {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .avatar-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style>