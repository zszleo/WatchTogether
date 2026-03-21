<template>
  <Transition name="message-fade">
    <div 
      v-if="visible" 
      class="message-container" 
      :class="[type, { 'with-close': showClose }]"
    >
      <div class="message-icon">
        <span v-if="type === 'success'">✓</span>
        <span v-else-if="type === 'error'">✕</span>
        <span v-else-if="type === 'warning'">⚠</span>
        <span v-else>ℹ</span>
      </div>
      <div class="message-content">
        <span class="message-text">{{ message }}</span>
      </div>
      <button 
        v-if="showClose" 
        class="message-close" 
        @click="close"
        aria-label="关闭"
      >×</button>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
  },
  message: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 3000
  },
  showClose: {
    type: Boolean,
    default: false
  },
  onClose: {
    type: Function,
    default: () => {}
  }
})

const visible = ref(true)
let timer = null

function close() {
  visible.value = false
  props.onClose()
}

function startTimer() {
  if (props.duration > 0) {
    timer = setTimeout(() => {
      close()
    }, props.duration)
  }
}

function clearTimer() {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

onMounted(() => {
  startTimer()
})

onUnmounted(() => {
  clearTimer()
})
</script>

<style scoped>
.message-container {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 20px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 9999;
  min-width: 300px;
  max-width: 80vw;
  font-family: var(--font-body);
  font-size: 0.95rem;
  animation: slideDown 0.3s ease;
}

.message-container.success {
  background: linear-gradient(135deg, var(--success), #8fb58e);
  color: white;
}

.message-container.error {
  background: linear-gradient(135deg, var(--error), #d4695a);
  color: white;
}

.message-container.warning {
  background: linear-gradient(135deg, var(--accent-caramel), var(--accent-caramel-light));
  color: white;
}

.message-container.info {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  color: white;
}

.message-icon {
  font-size: 1.2rem;
  font-weight: bold;
  flex-shrink: 0;
}

.message-content {
  flex: 1;
  word-break: break-word;
}

.message-close {
  background: none;
  border: none;
  color: inherit;
  font-size: 1.5rem;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity var(--transition-fast);
  padding: 0;
  line-height: 1;
  margin-left: 8px;
}

.message-close:hover {
  opacity: 1;
}

.message-fade-enter-active,
.message-fade-leave-active {
  transition: all 0.3s ease;
}

.message-fade-enter-from,
.message-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

@keyframes slideDown {
  from {
    transform: translateX(-50%) translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

@media (max-width: 480px) {
  .message-container {
    min-width: 280px;
    left: 20px;
    right: 20px;
    transform: none;
  }
  
  .message-fade-enter-from,
  .message-fade-leave-to {
    transform: translateY(-20px);
  }
  
  @keyframes slideDown {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
}
</style>
