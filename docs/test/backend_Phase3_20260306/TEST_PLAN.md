# WatchTogether Phase 3 后端服务测试计划

## 概述
本文档为WatchTogether Phase 3后端服务的测试计划，涵盖表情系统、文件上传、观看历史和会话管理增强功能的完整测试策略，包括单元测试、集成测试和API测试。

## 测试目标
- 确保Phase 3实现的功能质量
- 达到80%+的代码覆盖率（遵循TDD原则）
- 验证核心业务逻辑的正确性
- 确保API端点的可靠性
- 验证文件上传和存储的安全性

## 测试范围
### Phase 3 实现组件
1. **实体类**
   - Emoji - 表情实体
   - SessionHistory - 观看历史实体

2. **数据访问层**
   - EmojiRepository - 表情数据访问
   - SessionHistoryRepository - 观看历史数据访问

3. **服务层**
   - EmojiService - 表情核心业务逻辑
   - SessionHistoryService - 观看历史管理
   - FileService - 文件上传和存储

4. **控制器层**
   - EmojiController - 表情REST API端点
   - FileController - 文件上传REST API端点
   - SessionController - 新增个人资料更新和历史记录API

5. **辅助组件**
   - 文件存储目录结构
   - 文件类型验证
   - 会话验证集成

## 测试策略

### 1. 单元测试（Unit Tests）
**目标**: 测试单个组件在隔离环境下的行为

#### 1.1 EmojiService单元测试
- 获取默认表情列表
- 获取用户自定义表情列表
- 添加用户自定义表情
- 删除用户自定义表情（权限验证）
- 按ID查询表情

#### 1.2 SessionHistoryService单元测试
- 用户加入房间记录创建
- 用户离开房间记录更新
- 获取用户观看历史
- 获取带限制的用户观看历史
- 边界条件测试（空历史、大量历史）

#### 1.3 FileService单元测试
- 文件保存（不同文件类型：表情/视频）
- 文件信息查询（存在/不存在）
- 文件删除（存在/不存在）
- 文件内容读取
- 文件大小限制验证
- 文件扩展名处理
- 目录不存在时的自动创建

#### 1.4 DTO验证测试
- Emoji相关DTO验证（如有）
- 文件上传请求验证

### 2. 集成测试（Integration Tests）
**目标**: 测试组件间的交互

#### 2.1 EmojiRepository集成测试
- 数据库CRUD操作
- 自定义查询方法（findByIsDefaultTrueOrderByNameAsc, findBySessionIdOrderByCreatedAtDesc, findByIdAndSessionId）

#### 2.2 SessionHistoryRepository集成测试
- 数据库CRUD操作
- 自定义查询方法（findBySessionIdOrderByJoinedAtDesc, findBySessionIdOrderByJoinedAtDescLimit）
- 时间戳自动更新验证

#### 2.3 API集成测试
- EmojiController完整HTTP请求/响应流程
- FileController文件上传下载流程
- SessionController个人资料和历史API
- 会话验证中间件集成

#### 2.4 文件系统集成测试
- 实际文件存储和检索
- 目录权限验证
- 文件清理机制

### 3. API测试（API Tests）
**目标**: 测试REST API端点的正确性

#### 3.1 EmojiController API测试
- `GET /api/emojis/default` - 获取默认表情列表
- `GET /api/emojis/user` - 获取用户自定义表情（需要会话验证）
- `POST /api/emojis/user` - 添加用户自定义表情
- `DELETE /api/emojis/user/{emojiId}` - 删除用户自定义表情

#### 3.2 FileController API测试
- `POST /api/files/upload` - 文件上传
- `GET /api/files/{fileId}` - 获取文件信息
- `DELETE /api/files/{fileId}` - 删除文件
- 文件类型验证
- 文件大小限制
- 会话验证

#### 3.3 SessionController API测试（新增功能）
- `PUT /api/sessions/{sessionId}/profile` - 更新个人资料
- `GET /api/sessions/{sessionId}/history` - 获取观看历史
- `POST /api/sessions/{sessionId}/history/join/{roomId}` - 记录加入房间
- `POST /api/sessions/{sessionId}/history/{historyId}/leave` - 记录离开房间

## 测试环境配置

### 单元测试环境
- 使用Mockito模拟外部依赖（Repository、文件系统）
- 使用H2内存数据库
- 禁用实际文件系统操作（使用临时目录）
- 测试专用的application-test.yml

### 集成测试环境
- 使用H2内存数据库或Testcontainers
- 使用临时目录进行文件系统测试
- 配置测试专用的application-integration-test.yml

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
  servlet:
    multipart:
      max-file-size: 100MB
      max-request-size: 100MB
app:
  upload:
    dir: ./uploads-test
    allowed-extensions: .mp4,.webm,.mkv,.mov,.avi,.png,.jpg,.jpeg,.gif
    max-size-mb: 100
socketio:
  enabled: false
```

## 测试用例矩阵

### EmojiService 测试用例
| 测试场景 | 输入条件 | 预期结果 | 优先级 |
|---------|---------|---------|--------|
| 获取默认表情 | 数据库中有默认表情 | 返回排序后的默认表情列表 | P0 |
| 获取默认表情 | 数据库中无默认表情 | 返回空列表 | P1 |
| 获取用户表情 | 有效会话ID | 返回用户自定义表情列表 | P0 |
| 获取用户表情 | 无效会话ID | 返回空列表 | P1 |
| 添加用户表情 | 有效输入 | 创建成功，返回表情实体 | P0 |
| 添加用户表情 | 名称为空 | 业务逻辑验证（取决于实现） | P1 |
| 删除用户表情 | 表情存在且属于用户 | 删除成功，返回true | P0 |
| 删除用户表情 | 表情不存在 | 返回false | P0 |
| 删除用户表情 | 表情存在但不属于用户 | 返回false | P0 |
| 按ID查询表情 | 表情存在 | 返回Optional包含表情 | P0 |
| 按ID查询表情 | 表情不存在 | 返回空Optional | P0 |

### SessionHistoryService 测试用例
| 测试场景 | 输入条件 | 预期结果 | 优先级 |
|---------|---------|---------|--------|
| 加入房间记录 | 有效输入 | 创建历史记录，返回实体 | P0 |
| 离开房间记录 | 有效历史ID | 更新leftAt时间戳 | P0 |
| 离开房间记录 | 无效历史ID | 无操作，不抛异常 | P1 |
| 获取用户历史 | 有历史记录 | 按加入时间降序返回列表 | P0 |
| 获取用户历史 | 无历史记录 | 返回空列表 | P0 |
| 获取带限制的历史 | limit=5，有10条记录 | 返回前5条记录 | P0 |
| 获取带限制的历史 | limit=10，有5条记录 | 返回全部5条记录 | P0 |

### FileService 测试用例
| 测试场景 | 输入条件 | 预期结果 | 优先级 |
|---------|---------|---------|--------|
| 保存文件 - 视频类型 | 有效文件，type=video | 保存到videos目录，返回URL | P0 |
| 保存文件 - 表情类型 | 有效文件，type=emoji | 保存到emojis目录，返回URL | P0 |
| 保存文件 - 目录不存在 | 目录不存在 | 自动创建目录 | P0 |
| 保存文件 - 无扩展名 | 原始文件名无扩展名 | 使用空扩展名 | P1 |
| 获取文件信息 - 存在 | 文件存在 | 返回文件信息map | P0 |
| 获取文件信息 - 不存在 | 文件不存在 | 返回null | P0 |
| 删除文件 - 存在 | 文件存在 | 删除成功，返回true | P0 |
| 删除文件 - 不存在 | 文件不存在 | 返回false | P0 |
| 删除文件 - 同时存在视频和表情 | 同名文件在不同目录 | 都删除，返回true | P1 |
| 读取文件内容 - 存在 | 文件存在 | 返回字节数组 | P0 |
| 读取文件内容 - 不存在 | 文件不存在 | 返回null | P0 |
| 异常处理 - IO错误 | 保存时IO错误 | 抛出IOException | P1 |

### EmojiController API测试用例
| 测试场景 | HTTP方法 | 端点 | 预期状态码 | 会话验证 |
|---------|---------|------|-----------|---------|
| 获取默认表情 | GET | /api/emojis/default | 200 | 不需要 |
| 获取用户表情 - 有效会话 | GET | /api/emojis/user | 200 | 需要 |
| 获取用户表情 - 无效会话 | GET | /api/emojis/user | 401 | 需要 |
| 获取用户表情 - 无会话头 | GET | /api/emojis/user | 401 | 需要 |
| 添加用户表情 - 有效输入 | POST | /api/emojis/user | 201 | 需要 |
| 添加用户表情 - 缺少名称 | POST | /api/emojis/user | 400 | 需要 |
| 添加用户表情 - 无效会话 | POST | /api/emojis/user | 401 | 需要 |
| 删除用户表情 - 成功 | DELETE | /api/emojis/user/{emojiId} | 200 | 需要 |
| 删除用户表情 - 不存在 | DELETE | /api/emojis/user/{emojiId} | 404 | 需要 |
| 删除用户表情 - 无效会话 | DELETE | /api/emojis/user/{emojiId} | 401 | 需要 |

### FileController API测试用例
| 测试场景 | HTTP方法 | 端点 | 预期状态码 | 会话验证 |
|---------|---------|------|-----------|---------|
| 文件上传 - 成功 | POST | /api/files/upload | 201 | 需要 |
| 文件上传 - 空文件 | POST | /api/files/upload | 400 | 需要 |
| 文件上传 - 超过大小限制 | POST | /api/files/upload | 400 | 需要 |
| 文件上传 - 不允许的扩展名 | POST | /api/files/upload | 400 | 需要 |
| 文件上传 - 无文件名 | POST | /api/files/upload | 400 | 需要 |
| 文件上传 - 无效会话 | POST | /api/files/upload | 401 | 需要 |
| 获取文件信息 - 存在 | GET | /api/files/{fileId} | 200 | 需要 |
| 获取文件信息 - 不存在 | GET | /api/files/{fileId} | 404 | 需要 |
| 获取文件信息 - 无效会话 | GET | /api/files/{fileId} | 401 | 需要 |
| 删除文件 - 成功 | DELETE | /api/files/{fileId} | 200 | 需要 |
| 删除文件 - 不存在 | DELETE | /api/files/{fileId} | 404 | 需要 |
| 删除文件 - 无效会话 | DELETE | /api/files/{fileId} | 401 | 需要 |

### SessionController API测试用例（新增）
| 测试场景 | HTTP方法 | 端点 | 预期状态码 | 会话验证 |
|---------|---------|------|-----------|---------|
| 更新个人资料 - 成功 | PUT | /api/sessions/{sessionId}/profile | 200 | 需要 |
| 更新个人资料 - 无效会话 | PUT | /api/sessions/{sessionId}/profile | 404 | 需要 |
| 更新个人资料 - 仅昵称 | PUT | /api/sessions/{sessionId}/profile | 200 | 需要 |
| 更新个人资料 - 仅头像 | PUT | /api/sessions/{sessionId}/profile | 200 | 需要 |
| 获取历史记录 - 成功 | GET | /api/sessions/{sessionId}/history | 200 | 需要 |
| 获取历史记录 - 带限制参数 | GET | /api/sessions/{sessionId}/history?limit=10 | 200 | 需要 |
| 获取历史记录 - 无效会话 | GET | /api/sessions/{sessionId}/history | 404 | 需要 |
| 记录加入房间 - 成功 | POST | /api/sessions/{sessionId}/history/join/{roomId} | 201 | 需要 |
| 记录加入房间 - 房间不存在 | POST | /api/sessions/{sessionId}/history/join/{roomId} | 404 | 需要 |
| 记录加入房间 - 无效会话 | POST | /api/sessions/{sessionId}/history/join/{roomId} | 404 | 需要 |
| 记录离开房间 - 成功 | POST | /api/sessions/{sessionId}/history/{historyId}/leave | 200 | 需要 |
| 记录离开房间 - 无效会话 | POST | /api/sessions/{sessionId}/history/{historyId}/leave | 404 | 需要 |

## 测试执行

### 执行命令
```bash
# 运行所有测试
mvn test

# 运行特定测试类
mvn test -Dtest=EmojiServiceTest
mvn test -Dtest=FileServiceTest
mvn test -Dtest=SessionHistoryServiceTest
mvn test -Dtest=EmojiControllerTest
mvn test -Dtest=FileControllerTest
mvn test -Dtest=SessionControllerTest

# 运行集成测试
mvn test -Dtest="*RepositoryTest"
mvn test -Dtest="*IntegrationTest"

# 运行测试并生成覆盖率报告
mvn test jacoco:report

# 查看HTML覆盖率报告
open target/site/jacoco/index.html
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

# 检查覆盖率阈值
mvn jacoco:check
```

## 测试数据管理

### 测试数据准备
使用@BeforeEach和@AfterEach管理测试数据：
```java
@BeforeEach
void setUp() {
    // 创建测试数据
    testEmoji = createTestEmoji();
    testHistory = createTestHistory();
    
    // 创建临时目录
    tempDir = Files.createTempDirectory("filetest");
}

@AfterEach
void tearDown() {
    // 清理测试数据
    repository.deleteAll();
    
    // 清理临时目录
    FileUtils.deleteDirectory(tempDir.toFile());
}
```

### 测试数据工厂
创建测试数据工厂类：
```java
class TestDataFactory {
    static Emoji createDefaultEmoji(String name, String url) { ... }
    static Emoji createUserEmoji(String sessionId, String name, String url) { ... }
    static SessionHistory createSessionHistory(String sessionId, Long roomId) { ... }
    static MultipartFile createMockMultipartFile(String filename, byte[] content) { ... }
}
```

### 模拟文件上传
使用MockMultipartFile模拟文件上传：
```java
MockMultipartFile file = new MockMultipartFile(
    "file", 
    "test.mp4", 
    "video/mp4", 
    "test content".getBytes()
);
```

## 测试质量指标

### 通过标准
1. 所有测试用例通过
2. 代码覆盖率 ≥ 80%
3. 无重大缺陷（P0、P1级别）
4. 测试执行时间合理（< 5分钟）
5. 测试独立且可重复

### 质量检查清单
- [ ] 每个公共方法都有单元测试
- [ ] 每个API端点都有集成测试
- [ ] 每个错误场景都有测试
- [ ] 每个边界条件都有测试
- [ ] 测试是独立且可重复的
- [ ] 测试名称清晰描述测试内容
- [ ] 模拟对象使用恰当
- [ ] 测试数据清理完整

## 风险与缓解

### 风险1: 文件系统依赖
**风险**: 单元测试需要文件系统操作
**缓解**: 使用临时目录，@AfterEach清理，或使用Mockito模拟Files操作

### 风险2: 文件上传大小限制
**风险**: 测试大文件上传可能内存不足
**缓解**: 使用小文件进行测试，模拟文件大小验证逻辑

### 风险3: 会话验证集成
**风险**: 多个控制器需要会话验证，测试冗余
**缓解**: 创建基础测试类封装会话验证逻辑

### 风险4: 数据库模式差异
**风险**: H2与MySQL行为差异
**缓解**: 使用MODE=MySQL配置H2，进行集成测试验证

### 风险5: 并发文件访问
**风险**: 多线程测试文件操作可能冲突
**缓解**: 使用独立临时目录，避免测试并行执行冲突

## 附录

### 测试文件结构
```
backend/src/test/java/com/watchtogether/
├── service/
│   ├── EmojiServiceTest.java          # 表情服务单元测试
│   ├── SessionHistoryServiceTest.java # 观看历史服务单元测试
│   └── FileServiceTest.java           # 文件服务单元测试
├── controller/
│   ├── EmojiControllerTest.java       # 表情控制器单元测试
│   ├── FileControllerTest.java        # 文件控制器单元测试
│   └── SessionControllerTest.java     # 会话控制器单元测试（新增功能）
├── repository/
│   ├── EmojiRepositoryTest.java       # 表情仓库集成测试
│   └── SessionHistoryRepositoryTest.java # 观看历史仓库集成测试
├── integration/
│   ├── FileSystemIntegrationTest.java # 文件系统集成测试
│   └── SessionHistoryIntegrationTest.java # 观看历史集成测试
└── util/
    └── TestDataFactory.java           # 测试数据工厂
```

### 依赖的测试库
- JUnit 5
- Mockito
- Spring Boot Test
- H2 Database
- AssertJ
- Hamcrest
- MockMultipartFile (Spring)
- TemporaryFolder (JUnit 5)

### TDD工作流程
1. **红**: 为每个功能点编写失败的测试
2. **绿**: 实现最小功能使测试通过
3. **重构**: 优化代码结构，保持测试通过
4. **覆盖率**: 确保每次提交前覆盖率达标

### 测试命名规范
使用 `方法名_测试场景_预期结果` 模式：
```java
@Test
void getDefaultEmojis_WhenDatabaseHasEmojis_ShouldReturnSortedList()

@Test  
void saveFile_WithVideoType_ShouldSaveToVideosDirectory()

@Test
void uploadFile_WithInvalidSession_ShouldReturnUnauthorized()
```

---

*最后更新: 2026-03-06*
*测试计划版本: 1.0*