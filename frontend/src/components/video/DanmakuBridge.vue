<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRoomStore } from '@/stores/room'
import { useUserStore } from '@/stores/user'
import { socketService } from '@/services/socket'
import { useDanmaku } from '@/stores/danmaku'

const roomStore = useRoomStore()
const userStore = useUserStore()
const { emitDanmaku, onDanmaku } = useDanmaku()

let danmakuUnsubscribe = null

function handleChatMessage(data) {
  if (data.senderId === userStore.sessionId) {
    return
  }
  if (data.type === 'danmaku') {
    emitDanmaku(data.content, data.color || '#FFFFFF')
  }
}

function sendDanmaku(text, color = '#FFFFFF') {
  emitDanmaku(text, color)
  socketService.emitChatMessage(
    roomStore.currentRoom?.code,
    text,
    'danmaku',
    userStore.sessionId,
    userStore.nickname,
    color
  )
}

onMounted(() => {
  socketService.on('chat:message', handleChatMessage)
  danmakuUnsubscribe = onDanmaku(() => {})
})

onUnmounted(() => {
  socketService.off('chat:message')
  if (danmakuUnsubscribe) danmakuUnsubscribe()
})

defineExpose({ sendDanmaku })
</script>

<template>
</template>