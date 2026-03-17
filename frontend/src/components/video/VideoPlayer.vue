<!-- frontend/src/components/video/VideoPlayer.vue -->
<template>
  <div class="video-player-wrapper">
    <div class="video-container" ref="videoContainer">
      <video 
        ref="videoRef"
        class="video-element"
        :src="videoUrl"
        @timeupdate="handleTimeUpdate"
        @loadedmetadata="handleMetadataLoaded"
        @play="handlePlay"
        @pause="handlePause"
        @ended="handleEnded"
      ></video>
      
      <div class="video-overlay" v-if="!videoUrl">
        <div class="no-video">
          <span class="no-video-icon">🎬</span>
          <p>等待视频...</p>
        </div>
      </div>
    </div>
    
    <VideoControls 
      :currentTime="currentTime"
      :duration="duration"
      :isPlaying="isPlaying"
      :volume="volume"
      @play="play"
      @pause="pause"
      @seek="seek"
      @volume-change="setVolume"
      @fullscreen="toggleFullscreen"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoomStore } from '@/stores/room'
import { socketService } from '@/services/socket'
import VideoControls from './VideoControls.vue'

const roomStore = useRoomStore()
const videoRef = ref(null)
const videoContainer = ref(null)
const currentTime = ref(0)
const duration = ref(0)
const isPlaying = ref(false)
const volume = ref(1)
const isSyncing = ref(false)

const videoUrl = computed(() => roomStore.videoState.url)

// Socket 事件监听
function setupSocketListeners() {
  socketService.onVideoSyncPlay((data) => {
    isSyncing.value = true
    videoRef.value.currentTime = data.time
    videoRef.value.play()
    isPlaying.value = true
    setTimeout(() => isSyncing.value = false, 100)
  })
  
  socketService.onVideoSyncPause(() => {
    isSyncing.value = true
    videoRef.value.pause()
    isPlaying.value = false
    setTimeout(() => isSyncing.value = false, 100)
  })
  
  socketService.onVideoSyncSeek((data) => {
    isSyncing.value = true
    videoRef.value.currentTime = data.time
    currentTime.value = data.time
    setTimeout(() => isSyncing.value = false, 100)
  })
  
  socketService.onVideoSyncUrlChange((data) => {
    roomStore.updateVideoState({ url: data.url, currentTime: 0, isPlaying: false })
    videoRef.value.load()
  })
}

// 本地事件处理
function handleTimeUpdate() {
  if (!isSyncing.value) {
    currentTime.value = videoRef.value.currentTime
    roomStore.updateVideoState({ currentTime: currentTime.value })
  }
}

function handleMetadataLoaded() {
  duration.value = videoRef.value.duration
  roomStore.updateVideoState({ duration: duration.value })
}

function handlePlay() {
  if (!isSyncing.value) {
    isPlaying.value = true
    roomStore.updateVideoState({ isPlaying: true })
    socketService.emitVideoPlay(roomStore.currentRoom.id, currentTime.value)
  }
}

function handlePause() {
  if (!isSyncing.value) {
    isPlaying.value = false
    roomStore.updateVideoState({ isPlaying: false })
    socketService.emitVideoPause(roomStore.currentRoom.id)
  }
}

function handleEnded() {
  isPlaying.value = false
  roomStore.updateVideoState({ isPlaying: false })
}

// 控制方法
function play() {
  videoRef.value?.play()
}

function pause() {
  videoRef.value?.pause()
}

function seek(time) {
  videoRef.value.currentTime = time
  currentTime.value = time
  if (!isPlaying.value) {
    videoRef.value.play()
  }
  socketService.emitVideoSeek(roomStore.currentRoom.id, time)
}

function setVolume(val) {
  volume.value = val
  videoRef.value.volume = val
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    videoContainer.value.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

// 公开给父组件
defineExpose({
  play,
  pause,
  seek,
  setVideoUrl: (url) => {
    roomStore.updateVideoState({ url, currentTime: 0, isPlaying: false })
  }
})

onMounted(() => {
  setupSocketListeners()
  
  // 恢复视频状态
  if (roomStore.videoState.url) {
    videoUrl.value = roomStore.videoState.url
  }
})
</script>

<style scoped>
.video-player-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #000;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.video-container {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-element {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.video-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
}

.no-video {
  text-align: center;
  color: var(--text-muted);
}

.no-video-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 16px;
}
</style>