<template>
  <div class="message-input-wrapper">
    <div class="mode-switch">
      <button
        :class="{ active: mode === 'text' }"
        @click="mode = 'text'"
      >消息</button>
      <button
        :class="{ active: mode === 'danmaku' }"
        @click="mode = 'danmaku'"
      >弹幕</button>
      <input
        v-if="mode === 'danmaku'"
        type="color"
        v-model="danmakuColor"
        class="color-picker"
        title="弹幕颜色"
      />
    </div>

    <div class="input-container">
      <button class="btn-emoji" @click="showEmojiPicker = !showEmojiPicker">😀</button>

      <input
        v-model="message"
        type="text"
        class="input-field"
        :placeholder="mode === 'danmaku' ? '发送弹幕...' : '发送消息...'"
        @keyup.enter="send"
      />

      <button
        class="btn-send"
        @click="send"
        :disabled="!message.trim()"
      >{{ mode === 'danmaku' ? '发射' : '发送' }}</button>
    </div>

    <div v-if="showEmojiPicker" class="emoji-picker-wrapper" ref="emojiPickerWrapper">
      <EmojiPicker @select="insertEmoji" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import EmojiPicker from './EmojiPicker.vue'

const props = defineProps({
  danmakuEnabled: { type: Boolean, default: true }
})

const emit = defineEmits(['send'])

const message = ref('')
const mode = ref('text')
const danmakuColor = ref('#FFFFFF')
const showEmojiPicker = ref(false)
const emojiPickerWrapper = ref(null)

// 根据弹幕启用状态自动切换模式
watch(() => props.danmakuEnabled, (enabled) => {
  mode.value = enabled ? 'danmaku' : 'text'
}, { immediate: true })

function send() {
  if (!message.value.trim()) return

  emit('send', message.value.trim(), mode.value, danmakuColor.value)
  message.value = ''
  showEmojiPicker.value = false
}

function insertEmoji(emoji) {
  message.value += emoji
  showEmojiPicker.value = false
}

function handleClickOutside(event) {
  if (showEmojiPicker.value && emojiPickerWrapper.value) {
    if (!emojiPickerWrapper.value.contains(event.target)) {
      const emojiBtn = document.querySelector('.btn-emoji')
      if (emojiBtn && !emojiBtn.contains(event.target)) {
        showEmojiPicker.value = false
      }
    }
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.message-input-wrapper {
  position: relative;
  padding: 12px 16px;
  background: white;
  border-top: 1px solid var(--bg-tertiary);
}

.mode-switch {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.mode-switch button {
  padding: 4px 12px;
  border: none;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.875rem;
  transition: all var(--transition-fast);
}

.mode-switch button.active {
  background: var(--accent-primary);
  color: white;
}

.color-picker {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  padding: 0;
}

.input-container {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-secondary);
  border-radius: 24px;
  padding: 6px;
}

.btn-emoji {
  flex-shrink: 0;
  padding: 6px 10px;
  background: none;
  border: none;
  font-size: 1.25rem;
  opacity: 0.7;
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.btn-emoji:hover {
  opacity: 1;
}

.input-field {
  flex: 1;
  min-width: 0;
  padding: 8px 12px;
  background: none;
  font-size: 0.9375rem;
  border: none;
  outline: none;
}

.btn-send {
  flex-shrink: 0;
  padding: 8px 16px;
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 18px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-send:hover:not(:disabled) {
  background: var(--accent-secondary);
}

.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.emoji-picker-wrapper {
  position: absolute;
  bottom: 100%;
  left: 16px;
  margin-bottom: 8px;
  z-index: 1000;
}
</style>