<template>
  <div class="artplayer-wrapper">
    <div ref="containerRef" class="artplayer-container"></div>
  </div>
</template>

<script setup>
import Artplayer from 'artplayer'
import artplayerPluginDanmuku from 'artplayer-plugin-danmuku'
import { ref, onMounted, onUnmounted, watch, nextTick, toRaw } from 'vue'

const props = defineProps({
  videoUrl: { type: String, default: '' },
  initialTime: { type: Number, default: 0 },
  isPlaying: { type: Boolean, default: false }
})

const emit = defineEmits([
  'play', 'pause', 'seek', 'timeupdate', 'ready', 'danmaku-send'
])

const containerRef = ref(null)
const art = ref(null)

function getVideoType(url) {
  if (!url) return ''
  const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase()
  const typeMap = {
    'mp4': 'mp4',
    'webm': 'webm',
    'ogg': 'ogg',
    'm3u8': 'm3u8',
    'mpd': 'mpd'
  }
  return typeMap[ext] || 'mp4'
}

function initPlayer() {
  if (!containerRef.value || !props.videoUrl) {
    return
  }

  if (art.value) {
    art.value.destroy()
    art.value = null
  }

  art.value = new Artplayer({
    container: containerRef.value,
    url: props.videoUrl,
    type: getVideoType(props.videoUrl),
    autoplay: props.isPlaying,
    autoSize: false,
    mutex: true,
    playbackRate: true,
    aspectRatio: true,
    fullscreen: true,
    fullscreenWeb: true,
    lang: 'zh-cn',
    plugins: [
      artplayerPluginDanmuku({
        danmuku: [],
        speed: 5,
        margin: [10, '25%'],
        opacity: 1,
        fontSize: 25,
        color: '#FFFFFF',
        mode: 0,
        modes: [0, 1, 2],
        antiOverlap: true,
        useWorker: true,
        synchronousPlayback: true,
        emitter: true,
        beforeEmit: (danmu) => {
          emit('danmaku-send', {
            text: danmu.text,
            mode: danmu.mode || 0,
            color: danmu.color || '#FFFFFF'
          })
          return true
        }
      })
    ]
  })

  art.value.on('play', () => emit('play'))
  art.value.on('pause', () => emit('pause'))
  art.value.on('seeked', () => emit('seek', art.value.currentTime))
  art.value.on('video:timeupdate', () => emit('timeupdate', art.value.currentTime))
  art.value.on('ready', () => {
    if (props.initialTime > 0) {
      art.value.currentTime = props.initialTime
    }
    emit('ready')
  })
}

function play() {
  art.value?.play()
}

function pause() {
  art.value?.pause()
}

function seek(time) {
  if (art.value) {
    art.value.currentTime = time
  }
}

function sendDanmaku(danmaku) {
  const artInstance = toRaw(art.value)
  if (!artInstance) return
  
  const danmakuPlugin = artInstance.plugins?.artplayerPluginDanmuku
  if (!danmakuPlugin) return
  
  danmakuPlugin.emit({
    text: danmaku.text,
    mode: danmaku.mode || 0,
    color: danmaku.color || '#FFFFFF'
  })
}

defineExpose({ play, pause, seek, sendDanmaku })

watch(() => props.videoUrl, async (newUrl, oldUrl) => {
  if (newUrl && newUrl !== oldUrl) {
    await nextTick()
    initPlayer()
  }
})

onMounted(async () => {
  await nextTick()
  if (props.videoUrl) {
    initPlayer()
  }
})

onUnmounted(() => {
  if (art.value) {
    art.value.destroy()
    art.value = null
  }
})
</script>

<style scoped>
.artplayer-wrapper {
  width: 100%;
  height: 100%;
  min-height: 300px;
}

.artplayer-container {
  width: 100%;
  height: 100%;
  min-height: 300px;
}
</style>