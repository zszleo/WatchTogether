<template>
  <div class="emoji-picker-enhanced">
    <div class="emoji-content" :class="{ loading: !dataLoaded }">
      <div class="emoji-grid">
        <button
          v-for="emoji in emojis"
          :key="emoji.id"
          class="emoji-btn"
          @click="selectEmoji(emoji)"
          :title="emoji.name"
          @mouseover="setPreview(emoji)"
        >
          {{ emoji.unicode || emoji.name }}
        </button>
      </div>
    </div>
    
    <div class="emoji-footer">
      <div class="emoji-preview" v-if="previewEmoji">
        <span class="emoji-preview-code">{{ previewEmoji.unicode || previewEmoji.name }}</span>
        <span class="emoji-preview-name">{{ previewEmoji.name }}</span>
      </div>
      <div class="emoji-actions">
        <button class="btn-close" @click="$emit('close')">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { EmojiApi } from '@/services/api'

const emit = defineEmits(['select', 'close'])

const previewEmoji = ref(null)
const emojis = ref([])
const dataLoaded = ref(false)

// 全局缓存
const globalEmojiCache = {
  emojis: [],
  loaded: false,
  loading: false,
  promise: null
}

// 重置全局缓存（用于测试）
function resetGlobalCache() {
  globalEmojiCache.emojis = []
  globalEmojiCache.loaded = false
  globalEmojiCache.loading = false
  globalEmojiCache.promise = null
}

// 导出用于测试
defineExpose({
  resetGlobalCache,
  loadData,
  preloadEmojiData,
  emojis,
  previewEmoji
})

// 预加载数据
async function preloadEmojiData() {
  if (globalEmojiCache.loading && globalEmojiCache.promise) {
    return globalEmojiCache.promise
  }
  
  if (globalEmojiCache.loaded) {
    return Promise.resolve()
  }
  
  globalEmojiCache.loading = true
  globalEmojiCache.promise = (async () => {
    try {
      // 先尝试获取默认表情
      let emojisResp = await EmojiApi.getDefaultEmojis()
      let emojisData = emojisResp.data
      console.log('默认表情数据:', emojisData)
      
      // 如果默认表情为空，尝试获取用户表情
      if (!emojisData || emojisData.length === 0) {
        const userStore = await import('@/stores/user').then(m => m.useUserStore())
        console.log('用户昵称:', userStore.nickname)
        if (userStore.nickname) {
          let userEmojisResp = await EmojiApi.getEmojisByNickname(userStore.nickname)
          emojisData = userEmojisResp.data
          console.log('用户表情数据:', emojisData)
        }
      }
      
      globalEmojiCache.emojis = emojisData || []
      globalEmojiCache.loaded = true
      console.log('表情缓存已加载:', globalEmojiCache.emojis)
    } catch (error) {
      console.error('加载表情数据失败:', error)
      globalEmojiCache.promise = null
      throw error
    } finally {
      globalEmojiCache.loading = false
    }
  })()
  
  return globalEmojiCache.promise
}

// 自动预加载
if (!globalEmojiCache.loaded && !globalEmojiCache.loading) {
  Promise.resolve().then(() => {
    preloadEmojiData().catch(() => {
      // 静默失败
    })
  })
}

// 从缓存加载数据到组件
function loadDataFromCache() {
  if (globalEmojiCache.loaded) {
    emojis.value = globalEmojiCache.emojis
    dataLoaded.value = true
    return true
  }
  return false
}

// 初始化数据
async function loadData() {
  if (loadDataFromCache()) {
    return
  }
  
  try {
    await preloadEmojiData()
    loadDataFromCache()
  } catch (error) {
    // 加载表情数据失败
  }
}

// 选择表情
function selectEmoji(emoji) {
  previewEmoji.value = emoji
  emit('select', emoji.unicode || emoji.name)
}

// 鼠标悬停预览
function setPreview(emoji) {
  previewEmoji.value = emoji
}

// 初始化
onMounted(() => {
  loadData().catch(() => {
    // 加载数据失败
  })
})
</script>

<style scoped>
.emoji-picker-enhanced {
  width: 360px;
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  max-height: 480px;
}



.emoji-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  -ms-overflow-style: none;  /* IE/Edge */
  scrollbar-width: none;     /* Firefox */
  opacity: 1;
  transition: opacity var(--transition-base);
}
.emoji-content.loading {
  opacity: 0.7;
}
.emoji-content::-webkit-scrollbar {
  display: none;            /* Chrome/Safari */
}



.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 6px;
}

.emoji-btn {
  position: relative;
  padding: 10px;
  font-size: 1.5rem;
  background: none;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji-btn:hover {
  background: var(--bg-tertiary);
  transform: scale(1.1);
}





.emoji-footer {
  padding: 16px;
  border-top: 1px solid var(--bg-tertiary);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.emoji-preview {
  display: flex;
  align-items: center;
  gap: 12px;
}

.emoji-preview-code {
  font-size: 2rem;
}

.emoji-preview-name {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.btn-close {
  padding: 8px 20px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  font-weight: 500;
  transition: all var(--transition-base);
}

.btn-close:hover {
  background: var(--accent-primary);
  color: white;
}
</style>