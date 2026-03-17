<template>
  <div class="page-room">
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
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRoomStore } from '@/stores/room'
import { useChatStore } from '@/stores/chat'
import { useUserStore } from '@/stores/user'
import { socketService } from '@/services/socket'
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

onMounted(async () => {
  const roomId = route.params.roomId
  
  try {
    // 如果没有会话，先创建
    if (!userStore.sessionId) {
      const nickname = `游客${Math.floor(Math.random() * 10000)}`
      await userStore.createSession(nickname)
    }
    
    // 加入房间
    await roomStore.joinRoom(roomId, userStore.sessionId)
  } catch (error) {
    alert('加入房间失败: ' + error.message)
    router.push('/')
  }
})

onUnmounted(() => {
  roomStore.leaveRoom()
  chatStore.clearMessages()
})

function changeVideoUrl() {
  if (!videoUrlInput.value.trim()) return
  
  socketService.emitVideoUrlChange(roomStore.currentRoom.id, videoUrlInput.value)
  videoUrlInput.value = ''
}

function handleVideoUpload(event) {
  const file = event.target.files[0]
  if (!file) return
  
  const url = URL.createObjectURL(file)
  socketService.emitVideoUrlChange(roomStore.currentRoom.id, url)
}
</script>

<style scoped>
.page-room {
  min-height: 100%;
  background: var(--bg-primary);
}

.room-layout {
  display: flex;
  height: 100%;
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