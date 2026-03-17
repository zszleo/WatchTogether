import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './styles/main.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)

// 预加载表情数据（不阻塞应用启动）
setTimeout(() => {
  // 动态导入表情选择器模块，触发其预加载逻辑
  import('./components/chat/EmojiPicker.vue').catch(() => {
    // 静默失败，不影响应用运行
  })
}, 500)

app.mount('#app')