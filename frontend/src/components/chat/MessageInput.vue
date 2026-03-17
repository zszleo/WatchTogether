<!-- frontend/src/components/chat/MessageInput.vue -->
<template>
  <div class="message-input-wrapper">
    <div class="input-container">
      <button class="btn-emoji" @click="showEmojiPicker = !showEmojiPicker">
        😀
      </button>
      
      <input 
        v-model="message"
        type="text"
        class="input-field"
        placeholder="发送消息..."
        @keyup.enter="send"
      />
      
      <button 
        class="btn-send" 
        @click="send"
        :disabled="!message.trim()"
      >
        发送
      </button>
    </div>
    
    <div v-if="showEmojiPicker" class="emoji-picker-enhanced-wrapper">
      <EmojiPicker
        @select="insertEmoji"
        @close="showEmojiPicker = false"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import EmojiPicker from './EmojiPicker.vue'

const emit = defineEmits(['send'])
const message = ref('')
const showEmojiPicker = ref(false)

function send() {
  if (!message.value.trim()) return
  emit('send', message.value.trim())
  message.value = ''
}

function insertEmoji(emoji) {
  message.value += emoji
  showEmojiPicker.value = false
}
</script>

<style scoped>
.message-input-wrapper {
  position: relative;
  padding: 12px 16px;
  background: white;
  border-top: 1px solid var(--bg-tertiary);
}

.input-container {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-secondary);
  border-radius: 24px;
  padding: 4px;
}

.btn-emoji {
  padding: 8px 12px;
  background: none;
  font-size: 1.25rem;
  opacity: 0.7;
  transition: opacity var(--transition-fast);
}

.btn-emoji:hover {
  opacity: 1;
}

.input-field {
  flex: 1;
  padding: 10px;
  background: none;
  font-size: 0.9375rem;
}

.btn-send {
  padding: 10px 20px;
  background: var(--accent-primary);
  color: white;
  border-radius: 20px;
  font-weight: 600;
  transition: all var(--transition-base);
}

.btn-send:hover:not(:disabled) {
  background: var(--accent-secondary);
}

.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.emoji-picker-enhanced-wrapper {
  position: absolute;
  bottom: 100%;
  left: 0;
  z-index: 1000;
  margin-bottom: 8px;
}
</style>