<template>
  <button class="back-button" @click="handleClick">
    返回
  </button>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  to: {
    type: [String, Object],
    default: '/'
  }
})

const router = useRouter()

function handleClick() {
  if (typeof props.to === 'string') {
    router.push(props.to)
  } else {
    router.push(props.to)
  }
}
</script>

<style scoped>
.back-button {
  position: absolute;
  left: 24px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  transition: all var(--transition-base);
  border: none;
  cursor: pointer;
}

.back-button:hover {
  background: var(--error);
  color: white;
}
</style>