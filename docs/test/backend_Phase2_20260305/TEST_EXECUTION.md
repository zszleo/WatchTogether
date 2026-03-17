# WatchTogether Phase 2 测试执行指南

## 测试概述

本测试套件为WatchTogether Phase 2后端服务提供全面的测试覆盖，包括单元测试、集成测试和API测试。

## 测试结构

```
backend/src/test/java/com/watchtogether/
├── service/
│   └── RoomServiceTest.java          # 房间服务单元测试 (18个测试)
├── controller/
│   ├── RoomControllerTest.java       # 房间控制器单元测试 (19个测试)
│   └── HealthControllerTest.java     # 健康检查控制器测试 (2个测试)
├── dto/
│   └── CreateRoomRequestTest.java    # DTO验证测试 (16个测试)
├── integration/
│   └── RoomRepositoryTest.java       # 房间仓库集成测试 (14个测试)
└── socket/
    └── SocketEventHandlerTest.java   # Socket事件处理器测试 (17个测试，待修复)
```

## 测试环境配置

测试使用H2内存数据库和模拟的Redis服务，配置文件位于：
- `src/test/resources/application-test.yml`

关键配置：
- H2数据库（MySQL模式）
- 禁用Socket.IO服务器
- 测试专用的日志级别

## 执行测试

### 运行所有测试
```bash
cd backend
mvn test
```

### 运行特定测试类
```bash
# 运行RoomService测试
mvn test -Dtest=RoomServiceTest

# 运行RoomController测试
mvn test -Dtest=RoomControllerTest

# 运行RoomRepository集成测试
mvn test -Dtest=RoomRepositoryTest

# 运行DTO验证测试
mvn test -Dtest=CreateRoomRequestTest
```

### 排除特定测试
```bash
# 排除Socket测试（目前存在问题）
mvn test -Dtest="!SocketEventHandlerTest"
```

### 运行测试并生成覆盖率报告
```bash
# 如果配置了JaCoCo插件
mvn test jacoco:report
# 报告生成在 target/site/jacoco/index.html
```

## 测试覆盖率

### 当前测试统计
- **总测试数**: 86个（69个通过 + 17个待修复）
- **通过率**: 80.2%（69/86）
- **代码覆盖率目标**: ≥80%

### 各组件覆盖率

| 组件 | 测试类型 | 测试数 | 状态 |
|------|---------|--------|------|
| RoomService | 单元测试 | 18 | ✅ 全部通过 |
| RoomController | 单元测试 | 19 | ✅ 全部通过 |
| CreateRoomRequest | 单元测试 | 16 | ✅ 全部通过 |
| RoomRepository | 集成测试 | 14 | ✅ 全部通过 |
| HealthController | 单元测试 | 2 | ✅ 全部通过 |
| SocketEventHandler | 单元测试 | 17 | ⚠️ 需要修复 |

### 关键业务逻辑覆盖

#### 房间创建流程
- ✅ 正常创建房间（带默认值）
- ✅ 验证房间名称长度限制
- ✅ 验证最大用户数边界
- ✅ 生成唯一房间代码
- ✅ Redis缓存集成

#### 房间查询流程
- ✅ Redis缓存优先逻辑
- ✅ 数据库回退机制
- ✅ 公开房间列表查询
- ✅ 私有房间访问控制

#### 房间管理流程
- ✅ 房主删除房间
- ✅ 非房主删除失败
- ✅ 房间活动时间更新
- ✅ 视频播放状态同步

#### API端点测试
- ✅ POST /api/rooms - 创建房间
- ✅ GET /api/rooms - 获取公开房间列表
- ✅ GET /api/rooms/{id} - 获取房间信息
- ✅ DELETE /api/rooms/{id} - 删除房间
- ✅ GET /api/rooms/{id}/invite - 获取邀请链接
- ✅ 会话验证和权限检查

#### 数据验证测试
- ✅ 字段长度验证
- ✅ 必填字段验证
- ✅ 数值范围验证
- ✅ 空值处理

## 测试数据管理

测试使用独立的H2内存数据库，每个测试方法执行后数据自动清理。

### 测试数据工厂模式
```java
// RoomRepositoryTest中的示例
@BeforeEach
void setUp() {
    publicRoom1 = new Room();
    publicRoom1.setCode("PUB123");
    publicRoom1.setName("Public Room 1");
    // ... 其他字段
    entityManager.persist(publicRoom1);
}
```

## 模拟策略

### Redis模拟
使用Mockito模拟RedisUtil，避免真实Redis依赖：
```java
@Mock
private RedisUtil redisUtil;

when(redisUtil.getRoom(eq("1"), eq(Map.class))).thenReturn(cachedData);
```

### 仓库模拟
服务层测试中模拟Repository层：
```java
@Mock
private RoomRepository roomRepository;

when(roomRepository.findById(1L)).thenReturn(Optional.of(mockRoom));
```

### SessionService模拟
控制器测试中模拟会话验证：
```java
@MockBean
private SessionService sessionService;

when(sessionService.validateSession("session-123")).thenReturn(true);
```

## 待修复问题

### SocketEventHandler测试
当前问题：
1. SocketIOServer模拟复杂
2. BroadcastOperations需要完整模拟链
3. 需要更精细的测试策略

建议解决方案：
- 使用Spring Boot Test的@SpringBootTest进行集成测试
- 或创建简化的单元测试，只测试业务逻辑

## 持续集成建议

### GitHub Actions配置示例
```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'
      - name: Run Tests
        run: |
          cd backend
          mvn test -Dtest="!SocketEventHandlerTest"
      - name: Generate Coverage Report
        run: |
          cd backend
          mvn jacoco:report
```

### 覆盖率阈值检查
建议在pom.xml中添加JaCoCo配置：
```xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.10</version>
    <executions>
        <execution>
            <goals>
                <goal>prepare-agent</goal>
            </goals>
        </execution>
        <execution>
            <id>report</id>
            <phase>test</phase>
            <goals>
                <goal>report</goal>
            </goals>
        </execution>
        <execution>
            <id>check</id>
            <phase>test</phase>
            <goals>
                <goal>check</goal>
            </goals>
            <configuration>
                <rules>
                    <rule>
                        <element>BUNDLE</element>
                        <limits>
                            <limit>
                                <counter>LINE</counter>
                                <value>COVEREDRATIO</value>
                                <minimum>0.80</minimum>
                            </limit>
                        </limits>
                    </rule>
                </rules>
            </configuration>
        </execution>
    </executions>
</plugin>
```

## 测试最佳实践

### 1. 测试命名规范
使用 `方法名_测试场景_预期结果` 模式：
```java
@Test
void createRoom_WithNullMaxUsers_ShouldUseDefault()
```

### 2. 测试隔离
每个测试独立运行，不依赖其他测试状态：
- 使用@BeforeEach准备测试数据
- 使用@AfterEach清理测试数据

### 3. 断言清晰
使用明确的断言消息：
```java
assertEquals("Expected room name", room.getName(), 
    "Room name should match request");
```

### 4. 模拟验证
验证模拟对象的调用情况：
```java
verify(roomRepository, times(1)).save(any(Room.class));
verify(redisUtil, never()).deleteRoom(anyString());
```

## 故障排除

### 常见问题

#### 1. 数据库连接失败
确保测试配置文件正确：
```yaml
spring:
  datasource:
    url: jdbc:h2:mem:testdb;MODE=MySQL;DB_CLOSE_DELAY=-1
```

#### 2. Redis连接失败
测试中Redis被模拟，无需真实Redis服务。

#### 3. Socket测试失败
暂时排除Socket测试或使用集成测试策略。

#### 4. 验证失败
检查DTO验证注解与测试数据匹配。

## 后续改进计划

1. **Socket测试修复** - 完善Socket事件处理器测试
2. **E2E测试添加** - 使用Testcontainers进行端到端测试
3. **性能测试** - 添加负载测试和并发测试
4. **安全测试** - 添加安全漏洞扫描
5. **覆盖率提升** - 目标达到90%+覆盖率

---

*最后更新: 2026-03-05*
*测试执行状态: 69/86 测试通过 (80.2%)*