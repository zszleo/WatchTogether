<template>
  <div class="page-create">
    <header class="page-header">
      <router-link to="/" class="back-link">← 返回</router-link>
      <h1 class="page-title">创建房间</h1>
    </header>
    
    <main class="page-content">
      <RoomForm />
    </main>
  </div>
</template>

<script setup>
import RoomForm from '@/components/room/RoomForm.vue'
</script>

<style scoped>
.page-create {
  min-height: 100%;
  background: 
    radial-gradient(ellipse at 30% 30%, rgba(167, 195, 166, 0.1) 0%, transparent 50%),
    var(--bg-primary);
}

.page-header {
  padding: 24px;
  text-align: center;
}

.back-link {
  display: inline-block;
  margin-bottom: 16px;
  color: var(--text-secondary);
}

.page-title {
  font-family: var(--font-display);
  font-size: 2rem;
  color: var(--text-primary);
}

.page-content {
  padding: 24px;
}
</style>