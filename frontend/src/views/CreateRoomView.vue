<template>
  <div class="page-create">
    <header class="page-header">
      <BackButton />
      <h1 class="page-title">创建房间</h1>
    </header>
    
    <main class="page-content">
      <RoomForm />
    </main>
  </div>
</template>

<script setup>
import RoomForm from '@/components/room/RoomForm.vue'
import BackButton from '@/components/common/BackButton.vue'
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
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
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