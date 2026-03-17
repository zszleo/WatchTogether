<template>
  <div class="error-component">
    <div class="error-icon">❌</div>
    <h3 class="error-title">加载失败</h3>
    <p class="error-message">{{ message }}</p>
    <button class="btn-retry" @click="retry">重试</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  error: {
    type: Error,
    required: true
  }
})

const message = ref(props.error?.message || '加载组件时发生错误')

function retry() {
  window.location.reload()
}
</script>

<style scoped>
.error-component {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  min-height: 200px;
  text-align: center;
}

.error-icon {
  font-size: 3rem;
  color: var(--error);
  margin-bottom: 20px;
}

.error-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.error-message {
  color: var(--text-secondary);
  margin-bottom: 24px;
  max-width: 400px;
}

.btn-retry {
  padding: 12px 24px;
  background: var(--accent-primary);
  color: white;
  border-radius: var(--radius-md);
  font-weight: 600;
  transition: all var(--transition-base);
}

.btn-retry:hover {
  background: var(--accent-secondary);
}
</style>