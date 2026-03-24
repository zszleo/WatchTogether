<template>
  <div class="page-room">
    <div class="room-header">
      <div class="header-left">
        <button class="btn-leave" @click="leaveRoom">
          离开房间
        </button>
      </div>
      <div class="header-center">
        <span class="room-playing-info">
          <span class="room-name">{{ roomStore.currentRoom?.name }}</span>：正在播放【{{ videoName }}】
        </span>
      </div>
      <div class="header-right">
        <button class="btn-invite" @click="copyInviteLink">
          邀请
          <span class="room-code">{{ roomStore.currentRoom?.code }}</span>
        </button>
      </div>
    </div>
    
    <div class="room-layout">
      <main class="video-section">
        <VideoPlayer ref="videoPlayer" />
        
        <div class="video-source-bar">
          <div class="source-tabs">
            <button 
              :class="{ active: videoSource === 'url' }"
              @click="videoSource = 'url'"
            >
              URL
            </button>
            <button 
              :class="{ active: videoSource === 'upload' }"
              @click="videoSource = 'upload'"
            >
              上传
            </button>
            <button 
              :class="{ active: videoSource === 'samples' }"
              @click="videoSource = 'samples'"
            >
              示例
            </button>
          </div>
          
          <div class="source-input" v-if="videoSource === 'url'">
            <input 
              v-model="videoUrlInput"
              type="text"
              class="input"
              placeholder="输入视频URL..."
              @keyup.enter="changeVideoUrl"
            />
            <button class="btn btn-primary" @click="changeVideoUrl">
              加载
            </button>
          </div>
          
          <div class="source-input" v-if="videoSource === 'upload'">
            <input 
              type="file"
              accept="video/mp4,video/webm,video/ogg"
              @change="handleVideoUpload"
            />
          </div>
        </div>
      </main>
      
      <aside class="chat-section">
        <ChatPanel />
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRoomStore } from '@/stores/room'
import { useChatStore } from '@/stores/chat'
import { useUserStore } from '@/stores/user'
import { socketService } from '@/services/socket'
import { detectVideoSource } from '@/utils/videoSource'
import message from '@/utils/message'
import VideoPlayer from '@/components/video/VideoPlayer.vue'
import ChatPanel from '@/components/chat/ChatPanel.vue'

const route = useRoute()
const router = useRouter()
const roomStore = useRoomStore()
const chatStore = useChatStore()
const userStore = useUserStore()

const videoPlayer = ref(null)
const videoSource = ref('url')
const videoUrlInput = ref('')

const videoName = computed(() => {
  const source = detectVideoSource(roomStore.videoState.url)
  return source.name || '视频'
})

onMounted(async () => {
  const roomCode = route.params.roomCode
  
  try {
    // 如果没有会话，先创建
    if (!userStore.sessionId) {
      const nickname = `游客${Math.floor(Math.random() * 10000)}`
      await userStore.createSession(nickname, '👤')
    }
    
    // 如果 socket 未连接（可能是页面刷新），重置 socket 的房间状态
    if (!socketService.socket?.connected) {
      console.log('[RoomView] Socket not connected, resetting room state')
      socketService.resetRoomState()
    }
    
    // 如果已经在当前房间中，不需要重新加入
    if (roomStore.currentRoom?.code === roomCode) {
      // 确保 socket 监听器已设置（由 ChatPanel 处理）
      return
    }
    
    // 加入房间
    await roomStore.joinRoom(roomCode, userStore.sessionId)
  } catch (error) {
    message.error('加入房间失败: ' + error.message)
    router.push('/')
  }
})

onUnmounted(() => {
  roomStore.leaveRoom()
  chatStore.clearMessages()
})

function leaveRoom() {
  router.push('/')
}

async function copyInviteLink() {
  if (!roomStore.currentRoom?.code) return
  const link = `${window.location.origin}/join/${roomStore.currentRoom.code}`
  try {
    await navigator.clipboard.writeText(link)
    message.success('邀请链接已复制')
  } catch (error) {
    message.error('复制失败，请手动复制链接')
  }
}

function changeVideoUrl() {
  if (!videoUrlInput.value.trim()) return
  
  socketService.emitVideoUrlChange(roomStore.currentRoom?.code, videoUrlInput.value)
  videoUrlInput.value = ''
}

function handleVideoUpload(event) {
  const file = event.target.files[0]
  if (!file) return
  
  const url = URL.createObjectURL(file)
  socketService.emitVideoUrlChange(roomStore.currentRoom?.code, url)
}
</script>

<style scoped>
.page-room {
  min-height: 100%;
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
}

.room-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid var(--bg-tertiary);
}

.header-left, .header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-leave {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  transition: all var(--transition-base);
}

.btn-leave:hover {
  background: var(--error);
  color: white;
}

.leave-icon {
  font-size: 1rem;
}

.header-center {
  flex: 1;
  text-align: center;
}

.room-playing-info {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.room-playing-info .room-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.btn-invite {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--accent-primary);
  color: white;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  transition: all var(--transition-base);
}

.btn-invite:hover {
  opacity: 0.9;
}

.room-code {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.7);
  font-family: var(--font-mono);
}

.room-layout {
  display: flex;
  flex: 1;
  height: calc(100vh - 56px);
}

.video-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  padding-right: 8px;
}

.video-section .video-player-wrapper {
  flex: 1;
}

.video-source-bar {
  margin-top: 16px;
  background: white;
  border-radius: var(--radius-md);
  padding: 12px;
}

.source-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.source-tabs button {
  padding: 8px 16px;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  font-weight: 500;
  transition: all var(--transition-base);
}

.source-tabs button.active {
  background: var(--accent-primary);
  color: white;
}

.source-input {
  display: flex;
  gap: 8px;
}

.source-input .input {
  flex: 1;
}

.chat-section {
  width: 360px;
  padding: 16px;
  padding-left: 8px;
}

@media (max-width: 900px) {
  .room-layout {
    flex-direction: column;
    height: auto;
  }
  
  .video-section {
    padding-right: 16px;
  }
  
  .chat-section {
    width: 100%;
    height: 50vh;
  }
}
</style>