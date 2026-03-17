<!-- frontend/src/components/video/VideoControls.vue -->
<template>
  <div class="video-controls">
    <div class="progress-bar" @click="handleProgressClick">
      <div class="progress-track">
        <div 
          class="progress-fill" 
          :style="{ width: progressPercent + '%' }"
        ></div>
      </div>
    </div>
    
    <div class="controls-row">
      <div class="controls-left">
        <button class="control-btn" @click="isPlaying ? $emit('pause') : $emit('play')">
          {{ isPlaying ? '⏸' : '▶' }}
        </button>
        
        <span class="time-display">
          {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
        </span>
      </div>
      
      <div class="controls-right">
        <div class="volume-control">
          <button class="control-btn" @click="toggleMute">
            {{ volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊' }}
          </button>
          <input 
            type="range"
            class="volume-slider"
            min="0"
            max="1"
            step="0.1"
            :value="volume"
            @input="$emit('volume-change', +$event.target.value)"
          />
        </div>
        
        <button class="control-btn" @click="$emit('fullscreen')">⛶</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  currentTime: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
  isPlaying: { type: Boolean, default: false },
  volume: { type: Number, default: 1 }
})

const emit = defineEmits(['play', 'pause', 'seek', 'volume-change', 'fullscreen'])

const progressPercent = computed(() => {
  if (!props.duration) return 0
  return (props.currentTime / props.duration) * 100
})

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function handleProgressClick(e) {
  const rect = e.currentTarget.getBoundingClientRect()
  const percent = (e.clientX - rect.left) / rect.width
  emit('seek', percent * props.duration)
}

function toggleMute() {
  if (props.volume > 0) {
    emit('volume-change', 0)
  } else {
    emit('volume-change', 1)
  }
}
</script>

<style scoped>
.video-controls {
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  padding: 40px 16px 16px;
}

.progress-bar {
  padding: 8px 0;
  cursor: pointer;
}

.progress-track {
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent-caramel);
  border-radius: 2px;
  transition: width 0.1s linear;
}

.controls-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.controls-left,
.controls-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.control-btn {
  background: none;
  color: white;
  font-size: 1.25rem;
  padding: 8px;
  opacity: 0.9;
  transition: opacity var(--transition-fast);
}

.control-btn:hover {
  opacity: 1;
}

.time-display {
  color: white;
  font-size: 0.875rem;
  font-family: var(--font-mono);
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.volume-slider {
  width: 80px;
  height: 4px;
  -webkit-appearance: none;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
}
</style>