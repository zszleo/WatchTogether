# WatchTogether Phase 2 后端服务测试计划

## 概述
本文档为WatchTogether Phase 2后端服务的测试计划，涵盖房间管理功能的完整测试策略，包括单元测试、集成测试和端到端测试。

## 测试目标
- 确保Phase 2实现的功能质量
- 达到80%+的代码覆盖率
- 验证核心业务逻辑的正确性
- 确保API端点的可靠性
- 验证Socket事件处理的正确性

## 测试范围
### Phase 2 实现组件
1. **DTO类**
   - CreateRoomRequest - 创建房间请求验证
   - RoomResponse - 房间响应DTO

2. **服务层**
   - RoomService - 房间核心业务逻辑
   - SessionService - 会话管理（已存在）

3. **控制器层**
   - RoomController - REST API端点

4. **Socket事件处理器**
   - SocketEventHandler - Socket.IO事件处理

5. **数据访问层**
   - RoomRepository - 房间数据访问
   - RedisUtil - Redis缓存工具

## 测试策略

### 1. 单元测试（Unit Tests）
**目标**: 测试单个组件在隔离环境下的行为

#### 1.1 RoomService单元测试
- 创建房间（各种边界条件）
- 查询房间（缓存优先逻辑）
- 删除房间（权限验证）
- 房间活动更新
- 视频状态管理

#### 1.2 RoomController单元测试
- REST端点验证
- 请求验证和错误处理
- 会话验证逻辑
- 权限检查

#### 1.3 SocketEventHandler单元测试
- Socket连接/断开事件
- 房间加入/离开事件
- 视频控制事件
- 聊天消息事件

#### 1.4 DTO验证测试
- 字段验证注解
- 边界值测试
- 构造器和访问器

### 2. 集成测试（Integration Tests）
**目标**: 测试组件间的交互

#### 2.1 RoomRepository集成测试
- 数据库CRUD操作
- 自定义查询方法
- 更新时间戳自动生成

#### 2.2 RoomService集成测试（带模拟Redis）
- 服务与Repository集成
- 缓存逻辑验证

#### 2.3 API集成测试
- 完整HTTP请求/响应流程
- 数据库和Redis的集成

### 3. 端到端测试（End-to-End Tests）
**目标**: 测试完整用户流程

#### 3.1 房间创建流程
1. 创建会话 → 创建房间 → 获取房间信息 → 删除房间

#### 3.2 Socket房间加入流程
1. Socket连接 → 加入房间 → 发送视频控制 → 离开房间

## 测试环境配置

### 单元测试环境
- 使用Mockito模拟外部依赖
- 使用H2内存数据库
- 禁用Socket.IO服务器

### 集成测试环境
- 使用Testcontainers或H2数据库
- 使用嵌入式Redis（可选）或模拟Redis
- 配置测试专用的application-test.yml

### 测试配置文件
```yaml
# src/test/resources/application-test.yml
spring:
  datasource:
    url: jdbc:h2:mem:testdb;MODE=MySQL;DB_CLOSE_DELAY=-1
    driver-class-name: org.h2.Driver
  jpa:
    hibernate:
      ddl-auto: create-drop
  data:
    redis:
      host: localhost
      port: 6379
      database: 0
  main:
    allow-bean-definition-overriding: true
socketio:
  enabled: false
```

## 测试用例矩阵

### RoomService 测试用例
| 测试场景 | 输入条件 | 预期结果 | 优先级 |
|---------|---------|---------|--------|
| 创建房间 - 有效请求 | 有效请求 + 有效会话 | 创建成功，返回房间 | P0 |
| 创建房间 - 无效会话 | 有效请求 + 无效会话 | 失败，抛出异常 | P1 |
| 创建房间 - 名称过长 | 名称>100字符 | 验证失败 | P1 |
| 获取房间 - Redis命中 | 房间在缓存中 | 从缓存返回 | P0 |
| 获取房间 - Redis未命中 | 房间不在缓存 | 从DB查询并缓存 | P0 |
| 删除房间 - 房主 | 房主会话 | 删除成功 | P0 |
| 删除房间 - 非房主 | 非房主会话 | 删除失败 | P0 |

### RoomController 测试用例
| 测试场景 | HTTP方法 | 端点 | 预期状态码 |
|---------|---------|------|-----------|
| 创建房间 - 成功 | POST | /api/rooms | 201 |
| 创建房间 - 无会话 | POST | /api/rooms | 401 |
| 获取公开房间 | GET | /api/rooms | 200 |
| 获取房间 - 公开 | GET | /api/rooms/{id} | 200 |
| 获取房间 - 私有无权限 | GET | /api/rooms/{id} | 401 |
| 删除房间 - 成功 | DELETE | /api/rooms/{id} | 200 |
| 获取邀请链接 | GET | /api/rooms/{id}/invite | 200 |

### Socket事件测试用例
| 事件类型 | 测试场景 | 预期行为 |
|---------|---------|---------|
| join-room | 有效房间和会话 | 加入成功，广播通知 |
| join-room | 无效房间 | 返回错误ACK |
| leave-room | 在房间中 | 离开成功，广播通知 |
| video-play | 在房间中 | 广播播放事件，更新状态 |
| chat-message | 在房间中 | 广播消息，更新活动时间 |

## 测试执行

### 执行命令
```bash
# 运行所有测试
mvn test

# 运行特定测试类
mvn test -Dtest=RoomServiceTest

# 运行测试并生成覆盖率报告
mvn test jacoco:report

# 运行特定包下的测试
mvn test -Dtest="com.watchtogether.service.*Test"

# 运行集成测试
mvn verify -Dit.test="*IntegrationTest"
```

### 覆盖率要求
- 行覆盖率: ≥ 80%
- 分支覆盖率: ≥ 80%
- 方法覆盖率: ≥ 80%

### 覆盖率报告
```bash
# 生成JaCoCo覆盖率报告
mvn jacoco:report

# 查看HTML报告
open target/site/jacoco/index.html
```

## 测试数据管理

### 测试数据准备
使用@BeforeEach和@AfterEach管理测试数据：
```java
@BeforeEach
void setUp() {
    // 创建测试数据
    testRoom = createTestRoom();
}

@AfterEach
void tearDown() {
    // 清理测试数据
    repository.deleteAll();
}
```

### 测试数据工厂
创建测试数据工厂类：
```java
class TestDataFactory {
    static CreateRoomRequest createValidRoomRequest() { ... }
    static Room createTestRoom(String sessionId) { ... }
}
```

## 测试质量指标

### 通过标准
1. 所有测试用例通过
2. 代码覆盖率 ≥ 80%
3. 无重大缺陷（P0、P1级别）
4. 测试执行时间合理（< 5分钟）

### 质量检查清单
- [ ] 每个公共方法都有单元测试
- [ ] 每个API端点都有集成测试
- [ ] 每个错误场景都有测试
- [ ] 每个边界条件都有测试
- [ ] 测试是独立且可重复的
- [ ] 测试名称清晰描述测试内容

## 风险与缓解

### 风险1: Redis依赖
**风险**: 单元测试需要Redis连接
**缓解**: 使用Mockito模拟RedisUtil

### 风险2: Socket.IO依赖
**风险**: Socket测试需要服务器
**缓解**: 在测试配置中禁用Socket.IO，使用模拟

### 风险3: 数据库模式差异
**风险**: H2与MySQL行为差异
**缓解**: 使用MODE=MySQL配置H2，进行集成测试

## 附录

### 测试文件结构
```
src/test/java/com/watchtogether/
├── service/
│   ├── RoomServiceTest.java          # 单元测试
│   └── SessionServiceTest.java       # 单元测试
├── controller/
│   ├── RoomControllerTest.java       # 单元测试
│   └── HealthControllerTest.java     # 单元测试
├── socket/
│   └── SocketEventHandlerTest.java   # 单元测试
├── integration/
│   ├── RoomRepositoryTest.java       # 集成测试
│   └── RoomServiceIntegrationTest.java # 集成测试
└── dto/
    └── CreateRoomRequestTest.java    # DTO验证测试
```

### 依赖的测试库
- JUnit 5
- Mockito
- Spring Boot Test
- H2 Database
- AssertJ
- Hamcrest

---

*最后更新: 2026-03-05*