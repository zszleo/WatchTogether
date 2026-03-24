<template>
  <div class="iframe-player-wrapper">
    <iframe
      v-if="embedUrl"
      :src="embedUrl"
      class="iframe-video"
      frameborder="0"
      allowfullscreen
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    ></iframe>
    <div v-else class="no-video">
      <span class="no-video-icon">🎬</span>
      <p>等待视频...</p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  embedUrl: { type: String, default: null }
})
</script>

<style scoped>
.iframe-player-wrapper {
  width: 100%;
  height: 100%;
  background: #000;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.iframe-video {
  width: 100%;
  height: 100%;
}

.no-video {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
}

.no-video-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}
</style>