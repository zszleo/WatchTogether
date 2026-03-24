<template>
  <div class="video-player-wrapper">
    <div v-if="!videoUrl" class="no-video-placeholder">
      <span class="no-video-icon">🎬</span>
      <p>等待视频...</p>
    </div>

    <IframePlayer
      v-else-if="isEmbed"
      :embed-url="videoSource.embedUrl"
    />

    <template v-else>
      <ArtPlayerWrapper
        ref="playerRef"
        :video-url="videoUrl"
        :initial-time="roomStore.videoState.currentTime"
        :is-playing="roomStore.videoState.isPlaying"
        @play="handlePlay"
        @pause="handlePause"
        @seek="handleSeek"
        @timeupdate="handleTimeUpdate"
        @danmaku-send="handleDanmakuSend"
      />
      <DanmakuBridge />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoomStore } from '@/stores/room'
import { useUserStore } from '@/stores/user'
import { useChatStore } from '@/stores/chat'
import { socketService } from '@/services/socket'
import { useDanmaku } from '@/stores/danmaku'
import { detectVideoSource } from '@/utils/videoSource'
import ArtPlayerWrapper from './ArtPlayerWrapper.vue'
import IframePlayer from './IframePlayer.vue'
import DanmakuBridge from './DanmakuBridge.vue'

const roomStore = useRoomStore()
const userStore = useUserStore()
const chatStore = useChatStore()
const { onDanmaku, emitDanmaku } = useDanmaku()

const playerRef = ref(null)
const isSyncing = ref(false)
let danmakuUnsubscribe = null

const videoUrl = computed(() => roomStore.videoState.url)
const videoSource = computed(() => detectVideoSource(videoUrl.value))
const isEmbed = computed(() => ['bilibili', 'youtube'].includes(videoSource.value.type))

function setupSocketListeners() {
  socketService.onVideoSyncPlay((data) => {
    if (isEmbed.value || !playerRef.value) return
    isSyncing.value = true
    playerRef.value.seek(data.time)
    playerRef.value.play()
    setTimeout(() => isSyncing.value = false, 100)
  })

  socketService.onVideoSyncPause(() => {
    if (isEmbed.value || !playerRef.value) return
    isSyncing.value = true
    playerRef.value.pause()
    setTimeout(() => isSyncing.value = false, 100)
  })

  socketService.onVideoSyncSeek((data) => {
    if (isEmbed.value || !playerRef.value) return
    isSyncing.value = true
    playerRef.value.seek(data.time)
    setTimeout(() => isSyncing.value = false, 100)
  })

  socketService.onVideoSyncUrlChange((data) => {
    roomStore.updateVideoState({ url: data.url, currentTime: 0, isPlaying: false, name: '' })
  })
}

function handlePlay() {
  if (!isSyncing.value && roomStore.currentRoom?.code) {
    socketService.emitVideoPlay(roomStore.currentRoom.code, playerRef.value?.art?.currentTime || 0)
  }
}

function handlePause() {
  if (!isSyncing.value && roomStore.currentRoom?.code) {
    socketService.emitVideoPause(roomStore.currentRoom.code)
  }
}

function handleSeek(time) {
  if (!isSyncing.value && roomStore.currentRoom?.code) {
    socketService.emitVideoSeek(roomStore.currentRoom.code, time)
  }
}

function handleTimeUpdate(time) {
  roomStore.updateVideoState({ currentTime: time })
}

function handleDanmakuSend(danmu) {
  // 用户从播放器发送弹幕，同步到聊天框
  chatStore.addMessage({
    id: `temp_${Date.now()}`,
    content: danmu.text,
    type: 'danmaku',
    color: danmu.color,
    senderId: userStore.sessionId,
    senderNickname: userStore.nickname,
    timestamp: new Date().toISOString()
  })

  // 发送到服务器广播给其他用户
  socketService.emitChatMessage(
    roomStore.currentRoom?.code,
    danmu.text,
    'danmaku',
    userStore.sessionId,
    userStore.nickname,
    danmu.color
  )
}

onMounted(() => {
  setupSocketListeners()
  danmakuUnsubscribe = onDanmaku(({ text, color, mode }) => {
    if (!isEmbed.value && playerRef.value) {
      playerRef.value.sendDanmaku({ text, color, mode })
    }
  })
})

onUnmounted(() => {
  socketService.off('video:sync-play')
  socketService.off('video:sync-pause')
  socketService.off('video:sync-seek')
  socketService.off('video:sync-url-change')
  if (danmakuUnsubscribe) danmakuUnsubscribe()
})
</script>

<style scoped>
.video-player-wrapper {
  width: 100%;
  height: 100%;
  min-height: 400px;
  background: #000;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.no-video-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 400px;
  color: var(--text-muted);
}

.no-video-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}
</style>