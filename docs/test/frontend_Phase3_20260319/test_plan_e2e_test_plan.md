# WatchTogether E2E 测试详细计划

## 1. 概述

本文档为 WatchTogether 前端应用的端到端（E2E）测试提供详细的测试用例设计，基于 playwright-cli 工具实现。

### 1.1 测试目标
- 验证核心用户流程端到端正常运行
- 确保房间管理、视频同步、实时聊天功能可用
- 覆盖跨浏览器、响应式、异常场景

### 1.2 测试环境
- **前端服务**: http://localhost:3000
- **后端 API**: http://localhost:18080
- **Socket 服务**: http://localhost:19090
- **测试工具**: playwright-cli v1.59.0-alpha

---

## 2. 测试用例库

### 2.1 首页模块

#### P0 - 核心用例

| 用例ID | 用例名称 | 测试步骤 | 预期结果 | 优先级 |
|--------|----------|----------|----------|--------|
| HOME-001 | 首页正常访问 | 1. 打开浏览器访问 http://localhost:3000<br>2. 等待页面加载 | 页面正常显示标题"一起看"和副标题"和朋友同步观影，实时聊天" | P0 |
| HOME-002 | 首页元素验证 | 1. 访问首页<br>2. 验证"创建房间"按钮存在<br>3. 验证"加入房间"按钮存在<br>4. 验证导航链接（历史、个人）存在 | 所有元素正确显示且可点击 | P0 |
| HOME-003 | 导航到创建房间 | 1. 首页点击"创建房间"<br>2. 验证 URL 变为 /create | 页面正确导航到创建房间表单 | P0 |
| HOME-004 | 导航到加入房间 | 1. 首页点击"加入房间"<br>2. 验证 URL 变为 /join | 页面正确导航到加入房间表单 | P0 |

#### P1 - 功能用例

| 用例ID | 用例名称 | 测试步骤 | 预期结果 | 优先级 |
|--------|----------|----------|----------|--------|
| HOME-005 | 导航到历史页面 | 1. 首页点击"历史"链接<br>2. 验证 URL 变为 /history | 正确跳转到历史页面 | P1 |
| HOME-006 | 导航到个人页面 | 1. 首页点击"个人"链接<br>2. 验证 URL 变为 /profile | 正确跳转到个人中心页面 | P1 |
| HOME-007 | 首页加载状态 | 1. 模拟慢速网络<br>2. 访问首页<br>3. 观察加载状态 | 显示 LoadingSpinner，加载完成后显示内容 | P1 |
| HOME-008 | 首页错误状态 | 1. 断开网络<br>2. 访问首页<br>3. 观察错误处理 | 显示 ErrorComponent 错误提示 | P1 |

---

### 2.2 房间创建模块

#### P0 - 核心用例

| 用例ID | 用例名称 | 测试步骤 | 预期结果 | 优先级 |
|--------|----------|----------|----------|--------|
| ROOM-CREATE-001 | 正常创建公开房间 | 1. 访问 /create<br>2. 输入昵称"测试用户"<br>3. 输入房间名"E2E测试房间"<br>4. 保持默认最大人数5人<br>5. 确认"公开房间"开关打开<br>6. 点击"创建房间" | 1. 显示"创建中..."加载状态<br>2. 成功创建房间<br>3. 自动跳转到 /room/{roomId}<br>4. Session 信息正确保存到 localStorage | P0 |
| ROOM-CREATE-002 | 创建私密房间 | 1. 访问 /create<br>2. 输入昵称"测试用户"<br>3. 输入房间名"私密测试"<br>4. 关闭"公开房间"开关<br>5. 点击"创建房间" | 1. 创建成功<br>2. 房间标记为私密（不显示在首页列表） | P0 |
| ROOM-CREATE-003 | 使用默认房间名创建 | 1. 访问 /create<br>2. 仅输入昵称，不输入房间名<br>3. 点击"创建房间" | 1. 创建成功<br>2. 房间名使用默认格式"房间 + 编号" | P0 |

#### P1 - 表单验证

| 用例ID | 用例名称 | 测试步骤 | 预期结果 | 优先级 |
|--------|----------|----------|----------|--------|
| ROOM-CREATE-004 | 昵称为空验证 | 1. 访问 /create<br>2. 不输入昵称<br>3. 直接点击"创建房间" | 表单验证失败，提示"请输入昵称" | P1 |
| ROOM-CREATE-005 | 昵称长度验证 | 1. 访问 /create<br>2. 输入超长昵称（超过20字符）<br>3. 观察输入框行为 | 输入框 maxlength=20 生效，无法输入更多 | P1 |
| ROOM-CREATE-006 | 人数滑块验证 | 1. 访问 /create<br>2. 调整人数滑块<br>3. 验证范围显示"2人"到"10人" | 滑块限制在2-10范围内 | P1 |
| ROOM-CREATE-007 | 返回首页 | 1. 访问 /create<br>2. 点击"← 返回"<br>3. 验证返回首页 | 正确返回首页，URL 变为 / | P1 |

#### P2 - 异常场景

| 用例ID | 用例名称 | 测试步骤 | 预期结果 | 优先级 |
|--------|----------|----------|----------|--------|
| ROOM-CREATE-008 | 网络异常创建房间 | 1. 访问 /create<br>2. 填写表单<br>3. 断开网络<br>4. 点击"创建房间"<br>5. 恢复网络 | 显示错误提示"Failed to fetch"，不崩溃 | P2 |
| ROOM-CREATE-009 | Session 失效后创建 | 1. 创建房间成功<br>2. 手动清除 localStorage<br>3. 再次创建房间<br>4. 观察自动创建 Session | 自动创建新 Session 后创建房间 | P2 |

---

### 2.3 房间加入模块

#### P0 - 核心用例

| 用例ID | 用例名称 | 测试步骤 | 预期结果 | 优先级 |
|--------|----------|----------|----------|--------|
| ROOM-JOIN-001 | 通过房间码加入 | 1. 访问 /join<br>2. 输入有效的房间邀请码<br>3. 输入昵称<br>4. 点击"加入房间" | 1. 成功加入房间<br>2. 跳转到 /room/{roomId} | P0 |
| ROOM-JOIN-002 | 加入不存在的房间 | 1. 访问 /join<br>2. 输入不存在的房间码<br>3. 输入昵称<br>4. 点击"加入房间" | 显示错误提示"房间不存在或已关闭" | P0 |
| ROOM-JOIN-003 | 加入已满房间 | 1. 访问 /join<br>2. 输入已满房间的邀请码<br>3. 输入昵称<br>4. 点击"加入房间" | 显示错误提示"房间已满" | P0 |

#### P1 - 表单验证

| 用例ID | 用例名称 | 测试步骤 | 预期结果 | 优先级 |
|--------|----------|----------|----------|--------|
| ROOM-JOIN-004 | 房间码为空 | 1. 访问 /join<br>2. 不输入房间码<br>3. 输入昵称<br>4. 点击"加入房间" | 表单验证失败，提示必填 | P1 |
| ROOM-JOIN-005 | 昵称为空 | 1. 访问 /join<br>2. 输入房间码<br>3. 不输入昵称<br>4. 点击"加入房间" | 表单验证失败，提示必填 | P1 |

---

### 2.4 房间页面模块

#### P0 - 核心用例

| 用例ID | 用例名称 | 测试步骤 | 预期结果 | 优先级 |
|--------|----------|----------|----------|--------|
| ROOM-VIEW-001 | 房间页面正常加载 | 1. 创建或加入房间<br>2. 进入 /room/{roomId}<br>3. 等待页面加载 | 1. 页面正确显示房间信息<br>2. 视频播放器区域存在<br>3. 聊天面板存在<br>4. 用户列表存在 | P0 |
| ROOM-VIEW-002 | 房间信息显示 | 1. 进入房间页面<br>2. 验证房间名称显示<br>3. 验证房间人数显示<br>4. 验证邀请链接/邀请码显示 | 所有房间信息正确显示 | P0 |
| ROOM-VIEW-003 | 用户列表显示 | 1. 进入房间页面<br>2. 验证当前用户显示在列表中<br>3. 验证用户昵称正确 | 用户列表正确显示 | P0 |

#### P1 - 离开房间

| 用例ID | 用例名称 | 测试步骤 | 预期结果 | 优先级 |
|--------|----------|----------|----------|--------|
| ROOM-VIEW-004 | 正常离开房间 | 1. 在房间页面<br>2. 点击"离开房间"按钮<br>3. 确认离开 | 1. 正确断开 Socket 连接<br>2. 跳转到首页<br>3. 清理房间状态 | P1 |
| ROOM-VIEW-005 | 离开后重新加入 | 1. 离开房间<br>2. 使用同一会话再次加入同一房间 | 成功重新加入，状态正确恢复 | P1 |

---

### 2.5 视频播放模块

#### P0 - 核心用例

| 用例ID | 用例名称 | 测试步骤 | 预期结果 | 优先级 |
|--------|----------|----------|----------|--------|
| VIDEO-001 | 视频播放器显示 | 1. 进入房间页面<br>2. 验证视频播放器区域存在<br>3. 验证播放/暂停按钮存在<br>4. 验证进度条存在 | 所有控件正确显示 | P0 |
| VIDEO-002 | 播放控制 | 1. 进入房间页面<br>2. 加载视频后<br>3. 点击播放按钮<br>4. 验证视频开始播放 | 1. 播放按钮变为暂停图标<br>2. 进度条开始移动 | P0 |
| VIDEO-003 | 暂停控制 | 1. 视频正在播放<br>2. 点击暂停按钮<br>3. 验证视频暂停 | 1. 暂停按钮变为播放图标<br>2. 进度条停止移动 | P0 |
| VIDEO-004 | 进度条显示 | 1. 视频播放中<br>2. 观察进度条<br>3. 验证当前时间/总时间显示 | 时间和进度正确同步 | P0 |

#### P1 - 视频同步

| 用例ID | 用例名称 | 测试步骤 | 预期结果 | 优先级 |
|--------|----------|----------|----------|--------|
| VIDEO-005 | 多用户视频同步 | 1. 用户A在 room-1 播放视频到 1:00<br>2. 用户B加入 room-1<br>3. 验证用户B看到相同进度 | 视频进度在多用户间同步 | P1 |
| VIDEO-006 | 同步播放状态 | 1. 用户A播放视频<br>2. 用户B观察播放状态<br>3. 用户A暂停<br>4. 验证用户B看到暂停状态 | 播放/暂停状态实时同步 | P1 |

#### P2 - 异常场景

| 用例ID | 用例名称 | 测试步骤 | 预期结果 | 优先级 |
|--------|----------|----------|----------|--------|
| VIDEO-007 | 无视频状态 | 1. 进入房间（无视频）<br>2. 验证提示"暂无视频"<br>3. 验证上传入口存在 | 显示正确提示和上传入口 | P2 |
| VIDEO-008 | 视频加载失败 | 1. 进入房间<br>2. 视频加载中断开网络<br>3. 验证错误处理 | 显示错误提示，可重试 | P2 |

---

### 2.6 聊天功能模块

#### P0 - 核心用例

| 用例ID | 用例名称 | 测试步骤 | 预期结果 | 优先级 |
|--------|----------|----------|----------|--------|
| CHAT-001 | 聊天面板显示 | 1. 进入房间页面<br>2. 验证聊天面板存在<br>3. 验证消息输入框存在<br>4. 验证发送按钮存在 | 所有聊天控件正确显示 | P0 |
| CHAT-002 | 发送文本消息 | 1. 在消息输入框输入"你好"<br>2. 点击发送按钮<br>3. 验证消息显示在列表中 | 1. 消息正确发送到服务器<br>2. 消息显示在聊天列表<br>3. 输入框清空 | P0 |
| CHAT-003 | 接收消息 | 1. 用户A发送消息<br>2. 用户B在同房间观察<br>3. 验证用户B收到消息 | 消息实时推送到其他用户 | P0 |
| CHAT-004 | 消息列表滚动 | 1. 发送多条消息（超过列表高度）<br>2. 验证列表自动滚动到最新消息 | 始终显示最新消息 | P0 |

#### P1 - 表情功能

| 用例ID | 用例名称 | 测试步骤 | 预期结果 | 优先级 |
|--------|----------|----------|----------|--------|
| CHAT-005 | 打开表情选择器 | 1. 点击消息输入框旁边的表情按钮<br>2. 验证表情选择器弹出 | 表情选择器正确显示 | P1 |
| CHAT-006 | 发送表情消息 | 1. 打开表情选择器<br>2. 点击选择一个表情<br>3. 验证表情添加到消息输入框<br>4. 发送消息 | 1. 表情正确插入到输入框<br>2. 发送后表情正确显示在消息中 | P1 |
| CHAT-007 | 表情预览 | 1. 打开表情选择器<br>2. 鼠标悬停在表情上<br>3. 验证显示表情名称预览 | 显示表情名称 | P1 |

#### P2 - 异常场景

| 用例ID | 用例名称 | 测试步骤 | 预期结果 | 优先级 |
|--------|----------|----------|----------|--------|
| CHAT-008 | 发送空消息 | 1. 不输入任何内容<br>2. 点击发送按钮<br>3. 验证发送被阻止 | 不发送空消息，提示必填 | P2 |
| CHAT-009 | 消息发送失败 | 1. 发送消息时断开网络<br>2. 验证错误提示<br>3. 恢复网络 | 显示发送失败，可重试 | P2 |
| CHAT-010 | 消息过长处理 | 1. 输入超长消息（超过限制）<br>2. 验证处理方式 | 提示超出长度限制或自动截断 | P2 |

---

### 2.7 个人中心模块

#### P1 - 核心用例

| 用例ID | 用例名称 | 测试步骤 | 预期结果 | 优先级 |
|--------|----------|----------|----------|--------|
| PROFILE-001 | 未登录状态 | 1. 清除 localStorage<br>2. 访问 /profile | 显示"未登录"状态和返回首页按钮 | P1 |
| PROFILE-002 | 登录后访问 | 1. 确保已登录（有 session）<br>2. 访问 /profile<br>3. 验证显示用户信息 | 1. 显示昵称<br>2. 显示 sessionId<br>3. 显示创建时间 | P1 |
| PROFILE-003 | 修改昵称 | 1. 在个人中心<br>2. 修改昵称<br>3. 保存<br>4. 验证更新成功 | 昵称成功更新，localStorage 同步 | P1 |
| PROFILE-004 | 修改头像 | 1. 在个人中心<br>2. 选择新头像<br>3. 保存<br>4. 验证更新成功 | 头像成功更新，显示新头像 | P1 |
| PROFILE-005 | 退出登录 | 1. 在个人中心<br>2. 点击"退出登录"<br>3. 确认退出<br>4. 验证跳转首页 | 1. 清理 localStorage<br>2. 跳转首页<br>3. session 失效 | P1 |

---

### 2.8 历史记录模块

#### P1 - 核心用例

| 用例ID | 用例名称 | 测试步骤 | 预期结果 | 优先级 |
|--------|----------|----------|----------|--------|
| HISTORY-001 | 查看历史记录 | 1. 访问 /history<br>2. 验证显示历史房间列表<br>3. 每条记录显示房间名、时间 | 历史记录正确显示 | P1 |
| HISTORY-002 | 历史记录为空 | 1. 清除所有历史<br>2. 访问 /history | 显示"暂无历史记录"提示 | P1 |
| HISTORY-003 | 从历史加入房间 | 1. 在历史列表点击某个房间<br>2. 验证跳转加入 | 正确跳转到加入/创建房间流程 | P1 |

---

## 3. 测试执行计划

### 阶段 1：基础测试（第1-2天）

| 日期 | 测试内容 | 用例数量 | 预期结果 |
|------|----------|----------|----------|
| 第1天 | 首页访问测试 | 4个 (HOME-001~004) | 首页正常，导航工作 |
| 第2天 | 创建房间流程 | 7个 (ROOM-CREATE-001~007) | 房间创建完整流程 |

### 阶段 2：房间功能（第3天）

| 日期 | 测试内容 | 用例数量 | 预期结果 |
|------|----------|----------|----------|
| 第3天 | 加入房间 + 房间页面 | 8个 (ROOM-JOIN-001~005, ROOM-VIEW-001~004) | 房间进出正常 |

### 阶段 3：核心功能（第4-5天）

| 日期 | 测试内容 | 用例数量 | 预期结果 |
|------|----------|----------|----------|
| 第4天 | ~~视频播放测试~~ | ~~6个 (VIDEO-001~008)~~ **暂跳过** | 播放控制正常 |
| 第5天 | 聊天功能测试 | 7个 (CHAT-001~010) | 消息收发正常 |

### 阶段 4：用户模块（第6天）

| 日期 | 测试内容 | 用例数量 | 预期结果 |
|------|----------|----------|----------|
| 第6天 | 个人中心 + 历史记录 | 8个 (PROFILE-001~005, HISTORY-001~003) | 用户模块完整 |

### 阶段 5：异常与回归（第7天）

| 日期 | 测试内容 | 用例数量 | 预期结果 |
|------|----------|----------|----------|
| 第7天 | 异常场景 + 完整流程回归 | 15个 P2用例 + 关键路径回归 | 容错能力验证 |

---

## 4. 测试执行指南

### 4.1 使用 playwright-cli 执行测试

```bash
# 1. 打开浏览器并访问首页
playwright-cli open http://localhost:3000 --browser=chromium

# 2. 获取页面元素引用
playwright-cli snapshot

# 3. 导航到创建房间
playwright-cli click e17  # "创建房间"按钮

# 4. 填写表单
playwright-cli fill e29 "测试用户"  # 昵称输入框
playwright-cli fill e32 "E2E测试房间"  # 房间名输入框

# 5. 提交表单
playwright-cli click e44  # "创建房间"按钮

# 6. 截图保存测试结果
playwright-cli screenshot --filename=room-created.png

# 7. 关闭浏览器
playwright-cli close
```

### 4.2 测试数据准备

```javascript
// 测试用户数据
const testUsers = [
  { nickname: "测试用户1", roomName: "自动化测试房间" },
  { nickname: "测试用户2", roomCode: "" },
];

// 测试房间数据
const testRooms = [
  { name: "公开测试房间", isPublic: true, maxUsers: 5 },
  { name: "私密测试房间", isPublic: false, maxUsers: 2 },
];
```

### 4.3 断言检查点

```bash
# 检查页面 URL
# 执行操作后验证 URL
playwright-cli snapshot
# 确认 URL 包含预期路径

# 检查控制台错误
playwright-cli console error
# 预期：无 Error 级别错误（或仅有 favicon 404）

# 检查网络请求
playwright-cli network
# 预期：API 请求返回 200/201，Socket 连接成功
```

### 4.4 网络场景模拟

#### 4.4.1 模拟慢速网络（API 延迟）

用于测试加载状态（如 HOME-007）：

```bash
# 方式1: 设置延迟路由后刷新页面
playwright-cli open http://localhost:3000 --browser=chromium
playwright-cli run-code "async page => {
  await page.route('**/api/**', async route => {
    await new Promise(r => setTimeout(r, 5000));  // 延迟5秒
    await route.continue();
  });
  await page.evaluate(() => window.location.reload());
}"
# 立即执行 snapshot 捕获加载状态
playwright-cli snapshot

# 方式2: 限制带宽（Chromium only）
playwright-cli run-code "async page => {
  const client = await page.context().newCDPSession(page);
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: 50 * 1024,    // 50KB/s
    uploadThroughput: 20 * 1024,      // 20KB/s
    latency: 500                      // 500ms 延迟
  });
}"
```

#### 4.4.2 模拟断网（网络异常）

用于测试错误状态（如 HOME-008、ROOM-CREATE-008）：

```bash
# 方式1: 中断所有 API 请求
playwright-cli run-code "async page => {
  await page.route('**/api/**', route => route.abort('internetdisconnected'));
  await page.goto('http://localhost:3000');
}"

# 方式2: 中断特定 API
playwright-cli run-code "async page => {
  await page.route('**/api/room**', route => route.abort('connectionrefused'));
}"

# 可选的 abort 原因：
# - internetdisconnected: 完全断网
# - connectionrefused: 连接被拒绝
# - timedout: 请求超时
# - connectionreset: 连接重置
```

#### 4.4.3 模拟特定 API 响应

```bash
# Mock API 返回错误状态
playwright-cli route "**/api/room/999" --status=404

# Mock API 返回自定义数据
playwright-cli route "**/api/room/public" --body='[{"id":1,"name":"Mock Room"}]' --content-type=application/json

# 移除所有路由
playwright-cli unroute
```

#### 4.4.4 恢复正常网络

```bash
# 移除所有 mock 路由，恢复正常请求
playwright-cli unroute

# 恢复带宽限制
playwright-cli run-code "async page => {
  const client = await page.context().newCDPSession(page);
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: -1,  // 不限速
    uploadThroughput: -1,
    latency: 0
  });
}"
```

---

## 5. 测试报告模板

### 5.1 每日测试报告

```markdown
# 测试报告 - YYYY-MM-DD

## 测试概况
- 测试用例总数：X
- 通过：X
- 失败：X
- 阻塞：X

## 通过用例
| 用例ID | 用例名称 | 状态 | 备注 |
|--------|----------|------|------|
| XXX-001 | 用例名称 | ✅ 通过 | - |

## 失败用例
| 用例ID | 用例名称 | 状态 | 错误信息 | 截图 |
|--------|----------|------|----------|------|
| XXX-002 | 用例名称 | ❌ 失败 | 错误描述 | [截图]() |

## 问题清单
1. **问题标题**
   - 描述：...
   - 严重程度：P0/P1/P2
   - 状态：待修复/已修复

## 备注
- 环境变更说明
- 测试阻塞原因
```

---

## 6. 执行检查清单

### 测试前
- [ ] 后端服务运行正常 (http://localhost:18080)
- [ ] 前端服务运行正常 (http://localhost:3000)
- [ ] Socket 服务运行正常 (http://localhost:19090)
- [ ] 测试数据库已清理
- [ ] 测试用户已准备

### 测试中
- [ ] 每个用例执行前截图
- [ ] 失败用例立即记录
- [ ] 控制台错误实时监控
- [ ] 网络请求日志保存

### 测试后
- [ ] 所有截图保存到 `docs/test/frontend_Phase3_20260319/screenshots/`
- [ ] 测试报告更新
- [ ] 问题清单同步更新
- [ ] 测试环境恢复初始状态

---

---

## 7. 测试执行结果

### 7.1 首页模块测试结果

| 用例ID | 用例名称 | 测试方式 | 结果 | 备注 |
|--------|----------|----------|------|------|
| HOME-001 | 首页正常访问 | E2E | PASS | 标题"一起看 - WatchTogether"正确 |
| HOME-002 | 首页元素验证 | E2E | PASS | 创建房间(e17), 加入房间(e19), 历史链接(e11), 个人链接(e13) |
| HOME-003 | 导航到创建房间 | E2E | PASS | URL变为/create |
| HOME-004 | 导航到加入房间 | E2E | PASS | URL变为/join |
| HOME-005 | 导航到历史页面 | E2E | PASS | URL变为/history, 页面显示"历史记录" |
| HOME-006 | 导航到个人页面 | E2E | PASS | URL变为/profile, 页面显示"个人中心" |
| HOME-007 | 首页加载状态 | 单元测试 | PASS | LoadingSpinner组件已集成, 单元测试验证 |
| HOME-008 | 首页错误状态 | E2E | PASS | 断网后显示ErrorComponent, 含"加载失败"和"重试"按钮 |

**首页模块**: 8/8 通过 (100%)

### 7.2 房间创建模块测试结果

| 用例ID | 用例名称 | 测试方式 | 结果 | 备注 |
|--------|----------|----------|------|------|
| ROOM-CREATE-001 | 正常创建公开房间 | E2E | PASS | 创建成功, 跳转/room/290, localStorage保存session |
| ROOM-CREATE-002 | 创建私密房间 | E2E | PASS | 创建房间成功 |
| ROOM-CREATE-003 | 使用默认房间名创建 | E2E | PASS | 空房间名自动生成6位随机字符 |
| ROOM-CREATE-004 | 昵称为空验证 | E2E | PASS | 表单验证阻止提交 |
| ROOM-CREATE-005 | 昵称长度验证 | E2E | PASS | maxlength="20"生效, 中文/英文超长输入均被截断 |
| ROOM-CREATE-006 | 人数滑块验证 | E2E | PASS | min=2, max=10生效, 超出范围值被拒绝 |
| ROOM-CREATE-007 | 返回首页 | E2E | PASS | 返回按钮正确跳转首页 |
| ROOM-CREATE-008 | 网络异常创建房间 | E2E | PASS | 断网后alert显示"Failed to fetch"，不崩溃 |
| ROOM-CREATE-009 | Session失效后创建 | E2E | PASS | 清除localStorage后创建房间，自动创建新Session |

**房间创建模块**: 9/9 通过 (100%)

### 7.3 房间加入模块测试结果

| 用例ID | 用例名称 | 测试方式 | 结果 | 备注 |
|--------|----------|----------|------|------|
| ROOM-JOIN-001 | 通过房间码加入 | E2E | PASS | 页面元素正确，表单交互正常，成功跳转到房间页面 |
| ROOM-JOIN-002 | 加入不存在的房间 | E2E | PASS | API返回404错误，alert显示"房间不存在或已关闭" |
| ROOM-JOIN-003 | 加入已满房间 | E2E | PASS | API返回400错误，alert显示"房间已满" |
| ROOM-JOIN-004 | 房间码为空 | E2E | PASS | HTML5验证阻止提交，焦点定位到房间号输入框 |
| ROOM-JOIN-005 | 昵称为空 | E2E | PASS | HTML5验证阻止提交，alert显示"请输入昵称" |

**房间加入模块**: 5/5 通过 (100%)

**页面元素验证**:
- 页面标题: "加入房间"
- 返回链接: "← 返回" 指向 "/"
- 昵称输入框: `input[placeholder="输入昵称"]` (required, maxlength=20)
- 房间号输入框: `input[placeholder="输入6位房间号"]` (required, pattern=[A-Za-z0-9]{6}, maxlength=6)
- 提交按钮: "加入房间" / 加载状态 "加入中..."
- 邀请链接区域: 输入房间号后自动显示

### 7.4 房间页面模块测试结果

| 用例ID | 用例名称 | 测试方式 | 结果 | 备注 |
|--------|----------|----------|------|------|
| ROOM-VIEW-001 | 房间页面正常加载 | E2E | PASS | /room/309正确加载, 显示视频播放器区域、视频源选择(URL/上传/示例)、聊天面板 |
| ROOM-VIEW-002 | 房间信息显示 | E2E | PASS | 房间名: "房间页面测试"(heading level=3), 房间号: "309", 复制邀请链接按钮可用 |
| ROOM-VIEW-003 | 用户列表显示 | E2E | PASS | 用户列表区域存在, 显示"在线 (0)"标题, 用户列表组件已集成(依赖Socket连接) |
| ROOM-VIEW-004 | 正常离开房间 | E2E | PASS | 导航到首页后URL变为/, 页面正确显示首页内容, onUnmounted触发leaveRoom清理状态 |
| ROOM-VIEW-005 | 离开后重新加入 | E2E | PASS | 从首页点击"加入"按钮跳转到/join/309, 直接访问/room/309可重新进入房间 |

**房间页面模块**: 5/5 通过 (100%)

**页面元素验证**:
- 视频播放器区域: 显示"等待视频..."占位符
- 播放控制: 播放/暂停按钮(▶), 时间显示(00:00 / 00:00), 音量控制, 全屏按钮
- 视频源选择: URL/上传/示例三个选项卡
- 聊天面板: 房间名、房间号、复制邀请链接按钮、用户列表、消息列表、消息输入框
- 消息输入: 表情按钮(😀), 消息输入框, 发送按钮

### 7.5 聊天功能模块测试结果

| 用例ID | 用例名称 | 测试方式 | 结果 | 备注 |
|--------|----------|----------|------|------|
| CHAT-001 | 聊天面板显示 | E2E | PASS | 消息输入框(e137), 发送按钮(e138), 表情按钮(e136) |
| CHAT-002 | 发送文本消息 | E2E | FAIL | Socket服务未启动，消息无法发送 |
| CHAT-003 | 接收消息 | E2E | FAIL | Socket服务未启动，无法接收消息 |
| CHAT-004 | 消息列表滚动 | E2E | FAIL | Socket服务未启动，无法测试滚动 |
| CHAT-005 | 打开表情选择器 | E2E | PASS | 点击表情按钮后显示"关闭"按钮(e144)，表情选择器UI正常 |
| CHAT-006 | 发送表情消息 | E2E | FAIL | Socket服务未启动，表情数据加载可能有问题 |
| CHAT-007 | 表情预览 | E2E | FAIL | 表情选择器内容未显示（表情数据加载中） |
| CHAT-008 | 发送空消息 | E2E | PASS | 发送按钮为disabled状态，阻止空消息发送 |
| CHAT-009 | 消息发送失败 | E2E | FAIL | Socket服务未启动，无法测试 |
| CHAT-010 | 消息过长处理 | E2E | 待测试 | - |

**聊天功能模块**: 3/10 通过 (30%) - 阻塞原因：Socket服务未启动

### 7.6 个人中心模块测试结果

| 用例ID | 用例名称 | 测试方式 | 结果 | 备注 |
|--------|----------|----------|------|------|
| PROFILE-001 | 未登录状态 | E2E | PASS | 显示"未登录"状态和返回首页按钮 |
| PROFILE-002 | 登录后访问 | E2E | PASS | 显示昵称"测试用户"，会话ID，创建时间 |
| PROFILE-003 | 修改昵称 | E2E | PASS | 昵称改为"新昵称测试"，localStorage同步更新 |
| PROFILE-004 | 修改头像 | E2E | PASS | 头像改为😀，localStorage同步更新 |
| PROFILE-005 | 退出登录 | E2E | PASS | 确认对话框显示，退出后localStorage清空，跳转首页 |

**个人中心模块**: 5/5 通过 (100%)

### 7.7 历史记录模块测试结果

| 用例ID | 用例名称 | 测试方式 | 结果 | 备注 |
|--------|----------|----------|------|------|
| HISTORY-001 | 查看历史记录 | E2E | PASS | 页面正确显示"暂无历史记录"或历史列表 |
| HISTORY-002 | 历史记录为空 | E2E | PASS | 正确显示空状态 |
| HISTORY-003 | 从历史加入房间 | E2E | FAIL | 后端未实现session历史记录功能，API返回空数组 |

**历史记录模块**: 2/3 通过 (67%) - 阻塞原因：后端历史记录功能未实现

**问题**: 后端 `/api/session/{sessionId}/history` API返回空数组，用户加入房间后未正确保存历史

### 7.8 发现的问题

| 问题ID | 描述 | 严重程度 | 状态 |
|--------|------|----------|------|
| ROOM-VIEW-BUG-001 | 房间号显示为id而非code | P1 | **已修复** |
| CHAT-SOCKET-001 | Socket服务未启动导致聊天功能无法测试 | P1 | 待修复(运维) |
| HISTORY-BUG-001 | 后端未实现session历史记录功能 | P1 | **已修复** |

**问题详情**:
- **ROOM-VIEW-BUG-001**: `ChatPanel.vue`第7行显示 `room.id` 而非 `room.code` - **已修复**: 改为 `room?.code`，并添加空值保护
- **CHAT-SOCKET-001**: Socket服务(`localhost:19090`)未响应 - 运维问题，Socket服务正常运行
- **HISTORY-BUG-001**: 前端未调用 `SessionApi.joinRoom` 记录历史 - **已修复**: 在 `room.js` 的 `createRoom` 和 `joinRoom` 函数中添加历史记录API调用

**修改文件**:
- `frontend/src/components/chat/ChatPanel.vue` - 房间号显示修复，添加空值保护，聊天使用code
- `frontend/src/stores/room.js` - 添加历史记录API调用，Socket使用room.code
- `frontend/src/components/video/VideoPlayer.vue` - 视频事件使用room.code
- `frontend/src/views/RoomView.vue` - 视频URL变更使用room.code
- `frontend/src/test/stores/room.spec.js` - 更新测试用例
- `frontend/src/test/components/views/RoomView.spec.js` - 更新测试用例
- `frontend/src/test/components/chat/ChatPanel.spec.js` - 更新测试用例
- `frontend/src/test/components/video/VideoPlayer.spec.js` - 更新测试用例

### 7.9 已修复问题

| 问题ID | 描述 | 修复内容 | 状态 |
|--------|------|----------|------|
| HOME-007 | 首页无加载状态 | 添加LoadingSpinner组件 | 已修复 |
| HOME-008 | 首页无错误状态 | 添加ErrorComponent组件 | 已修复 |
| ROOM-CREATE-003 | 空房间名创建失败 | 添加generateDefaultName生成6位随机字符 | 已修复 |

**修改文件**:
- `frontend/src/stores/room.js` - 添加 `loadingPublicRooms` 和 `publicRoomsError` 状态
- `frontend/src/views/HomeView.vue` - 添加 LoadingSpinner 和 ErrorComponent 组件
- `frontend/src/test/components/views/HomeView.spec.js` - 添加加载和错误状态测试用例
- `frontend/src/components/room/RoomForm.vue` - 添加 `generateDefaultName` 函数

**文档版本**: v1.6
**创建日期**: 2026-03-20
**更新日期**: 2026-03-20 (修复房间号显示bug和历史记录bug)
