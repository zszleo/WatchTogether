# WatchTogether Phase 3 测试执行指南

## 测试概述

本测试套件为WatchTogether Phase 3后端服务提供全面的测试覆盖，包括表情系统、文件上传、观看历史和会话管理的单元测试、集成测试和API测试。

## 测试结构

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

## 测试环境配置

测试使用H2内存数据库和临时文件目录，配置文件位于：
- `src/test/resources/application-test.yml`

关键配置：
- H2数据库（MySQL模式）
- 临时上传目录
- 测试专用的文件大小限制
- 禁用Socket.IO服务器

## 执行测试

### 运行所有测试
```bash
cd backend
mvn test
```

### 运行特定测试类
```bash
# 运行EmojiService测试
mvn test -Dtest=EmojiServiceTest

# 运行SessionHistoryService测试
mvn test -Dtest=SessionHistoryServiceTest

# 运行FileService测试
mvn test -Dtest=FileServiceTest

# 运行EmojiController测试
mvn test -Dtest=EmojiControllerTest

# 运行FileController测试
mvn test -Dtest=FileControllerTest

# 运行SessionController测试（新增功能）
mvn test -Dtest=SessionControllerTest

# 运行仓库集成测试
mvn test -Dtest="*RepositoryTest"

# 运行集成测试
mvn test -Dtest="*IntegrationTest"
```

### 排除特定测试
```bash
# 排除集成测试（如果运行慢）
mvn test -Dtest="!*IntegrationTest"
```

### 运行测试并生成覆盖率报告
```bash
# 如果配置了JaCoCo插件
mvn test jacoco:report
# 报告生成在 target/site/jacoco/index.html
```

## 测试覆盖率

### 当前测试统计
- **总测试数**: 待实现
- **通过率**: 待实现
- **代码覆盖率目标**: ≥80%

### 各组件覆盖率目标

| 组件 | 测试类型 | 目标测试数 | 状态 |
|------|---------|------------|------|
| EmojiService | 单元测试 | 10-12 | ⏳ 待实现 |
| SessionHistoryService | 单元测试 | 8-10 | ⏳ 待实现 |
| FileService | 单元测试 | 12-15 | ⏳ 待实现 |
| EmojiController | 单元测试 | 10-12 | ⏳ 待实现 |
| FileController | 单元测试 | 12-15 | ⏳ 待实现 |
| SessionController | 单元测试 | 8-10 | ⏳ 待实现 |
| EmojiRepository | 集成测试 | 6-8 | ⏳ 待实现 |
| SessionHistoryRepository | 集成测试 | 6-8 | ⏳ 待实现 |

### 关键业务逻辑覆盖目标

#### 表情系统
- ✅ 获取默认表情列表
- ✅ 获取用户自定义表情
- ✅ 添加自定义表情（会话验证）
- ✅ 删除自定义表情（权限验证）
- ✅ 表情数据持久化

#### 文件上传系统
- ✅ 文件类型验证
- ✅ 文件大小限制
- ✅ 文件存储目录管理
- ✅ 文件信息查询
- ✅ 文件删除（会话验证）
- ✅ 异常处理（IO错误）

#### 观看历史系统
- ✅ 加入房间记录创建
- ✅ 离开房间记录更新
- ✅ 历史记录查询（排序、限制）
- ✅ 会话关联验证

#### 会话管理增强
- ✅ 个人资料更新（昵称、头像）
- ✅ 历史记录API端点
- ✅ 加入/离开房间记录API
- ✅ 会话验证中间件

## 测试数据管理

测试使用独立的H2内存数据库，每个测试方法执行后数据自动清理。

### 测试数据工厂模式
```java
// TestDataFactory中的示例
public class TestDataFactory {
    public static Emoji createDefaultEmoji(String name, String url) {
        Emoji emoji = new Emoji();
        emoji.setName(name);
        emoji.setType("emoji");
        emoji.setUrl(url);
        emoji.setIsDefault(true);
        return emoji;
    }
    
    public static SessionHistory createSessionHistory(String sessionId, Long roomId) {
        SessionHistory history = new SessionHistory();
        history.setSessionId(sessionId);
        history.setRoomId(roomId);
        history.setRoomName("Test Room");
        history.setVideoTitle("Test Video");
        return history;
    }
    
    public static MockMultipartFile createMockMultipartFile(String filename, String content) {
        return new MockMultipartFile(
            "file",
            filename,
            "application/octet-stream",
            content.getBytes()
        );
    }
}
```

### 测试数据准备示例
```java
@BeforeEach
void setUp() throws IOException {
    // 创建测试表情
    defaultEmoji1 = TestDataFactory.createDefaultEmoji("smile", "/emojis/smile.png");
    emojiRepository.save(defaultEmoji1);
    
    // 创建临时目录
    tempUploadDir = Files.createTempDirectory("uploads-test");
    
    // 设置测试配置
    ReflectionTestUtils.setField(fileService, "uploadDir", tempUploadDir.toString());
}
```

## 模拟策略

### 仓库模拟
服务层测试中模拟Repository层：
```java
@Mock
private EmojiRepository emojiRepository;

@Mock
private SessionHistoryRepository historyRepository;

when(emojiRepository.findByIsDefaultTrueOrderByNameAsc()).thenReturn(List.of(defaultEmoji));
```

### 文件系统模拟
文件服务测试中模拟文件操作：
```java
@Mock
private FileService fileService;

// 或者使用真实文件系统但使用临时目录
Path tempDir = Files.createTempDirectory("filetest");
ReflectionTestUtils.setField(fileService, "uploadDir", tempDir.toString());
```

### SessionService模拟
控制器测试中模拟会话验证：
```java
@MockBean
private SessionService sessionService;

when(sessionService.validateSession("valid-session")).thenReturn(true);
when(sessionService.validateSession("invalid-session")).thenReturn(false);
```

### 文件上传模拟
控制器测试中模拟MultipartFile：
```java
MockMultipartFile file = new MockMultipartFile(
    "file",
    "test.mp4",
    "video/mp4",
    "test video content".getBytes()
);
```

## 待实现测试详情

### 1. EmojiServiceTest
**测试方法列表**:
1. `getDefaultEmojis_WhenDefaultEmojisExist_ShouldReturnSortedList()`
2. `getDefaultEmojis_WhenNoDefaultEmojis_ShouldReturnEmptyList()`
3. `getUserEmojis_WithValidSessionId_ShouldReturnUserEmojis()`
4. `getUserEmojis_WithInvalidSessionId_ShouldReturnEmptyList()`
5. `addUserEmoji_WithValidInput_ShouldCreateAndReturnEmoji()`
6. `addUserEmoji_WithNullName_ShouldThrowException()` (取决于实现)
7. `deleteUserEmoji_WithOwnedEmoji_ShouldDeleteAndReturnTrue()`
8. `deleteUserEmoji_WithNonExistentEmoji_ShouldReturnFalse()`
9. `deleteUserEmoji_WithOtherUserEmoji_ShouldReturnFalse()`
10. `getEmojiById_WithExistingId_ShouldReturnEmoji()`
11. `getEmojiById_WithNonExistentId_ShouldReturnEmptyOptional()`

### 2. SessionHistoryServiceTest
**测试方法列表**:
1. `joinRoom_WithValidInput_ShouldCreateHistoryRecord()`
2. `leaveRoom_WithValidHistoryId_ShouldUpdateLeftAt()`
3. `leaveRoom_WithInvalidHistoryId_ShouldDoNothing()`
4. `getUserHistory_WithHistoryRecords_ShouldReturnSortedList()`
5. `getUserHistory_WithNoHistory_ShouldReturnEmptyList()`
6. `getUserHistoryWithLimit_WithMoreRecordsThanLimit_ShouldReturnLimitedList()`
7. `getUserHistoryWithLimit_WithFewerRecordsThanLimit_ShouldReturnAllRecords()`
8. `joinRoom_ShouldSetCurrentTimestamp()`
9. `leaveRoom_ShouldSetCurrentTimestamp()`

### 3. FileServiceTest
**测试方法列表**:
1. `saveFile_WithVideoType_ShouldSaveToVideosDirectory()`
2. `saveFile_WithEmojiType_ShouldSaveToEmojisDirectory()`
3. `saveFile_WhenDirectoryNotExists_ShouldCreateDirectory()`
4. `saveFile_WithFileWithoutExtension_ShouldHandleGracefully()`
5. `saveFile_WithFileWithExtension_ShouldPreserveExtension()`
6. `getFileInfo_WithExistingVideoFile_ShouldReturnInfoMap()`
7. `getFileInfo_WithExistingEmojiFile_ShouldReturnInfoMap()`
8. `getFileInfo_WithNonExistentFile_ShouldReturnNull()`
9. `deleteFile_WithExistingFile_ShouldDeleteAndReturnTrue()`
10. `deleteFile_WithNonExistentFile_ShouldReturnFalse()`
11. `deleteFile_WhenFileInBothDirectories_ShouldDeleteBoth()`
12. `getFileContent_WithExistingFile_ShouldReturnBytes()`
13. `getFileContent_WithNonExistentFile_ShouldReturnNull()`
14. `saveFile_WithIOException_ShouldThrowIOException()`

### 4. EmojiControllerTest
**测试方法列表**:
1. `getDefaultEmojis_ShouldReturn200AndEmojiList()`
2. `getUserEmojis_WithValidSession_ShouldReturn200AndUserEmojis()`
3. `getUserEmojis_WithInvalidSession_ShouldReturn401()`
4. `getUserEmojis_WithoutSessionHeader_ShouldReturn401()`
5. `addUserEmoji_WithValidInputAndSession_ShouldReturn201AndEmoji()`
6. `addUserEmoji_WithMissingName_ShouldReturn400()`
7. `addUserEmoji_WithMissingType_ShouldReturn400()`
8. `addUserEmoji_WithInvalidSession_ShouldReturn401()`
9. `deleteUserEmoji_WithOwnedEmoji_ShouldReturn200()`
10. `deleteUserEmoji_WithNonExistentEmoji_ShouldReturn404()`
11. `deleteUserEmoji_WithOtherUserEmoji_ShouldReturn404()`
12. `deleteUserEmoji_WithInvalidSession_ShouldReturn401()`

### 5. FileControllerTest
**测试方法列表**:
1. `uploadFile_WithValidFileAndSession_ShouldReturn201AndFileInfo()`
2. `uploadFile_WithEmptyFile_ShouldReturn400()`
3. `uploadFile_WithFileExceedingSizeLimit_ShouldReturn400()`
4. `uploadFile_WithInvalidExtension_ShouldReturn400()`
5. `uploadFile_WithNullFilename_ShouldReturn400()`
6. `uploadFile_WithInvalidSession_ShouldReturn401()`
7. `getFileInfo_WithExistingFileAndValidSession_ShouldReturn200AndInfo()`
8. `getFileInfo_WithNonExistentFile_ShouldReturn404()`
9. `getFileInfo_WithInvalidSession_ShouldReturn401()`
10. `deleteFile_WithExistingFileAndValidSession_ShouldReturn200()`
11. `deleteFile_WithNonExistentFile_ShouldReturn404()`
12. `deleteFile_WithInvalidSession_ShouldReturn401()`
13. `uploadFile_WithIOException_ShouldReturn500()`

### 6. SessionControllerTest (新增功能)
**测试方法列表**:
1. `updateProfile_WithValidSessionAndData_ShouldReturn200AndUpdatedSession()`
2. `updateProfile_WithInvalidSession_ShouldReturn404()`
3. `updateProfile_WithOnlyNickname_ShouldUpdateOnlyNickname()`
4. `updateProfile_WithOnlyAvatar_ShouldUpdateOnlyAvatar()`
5. `getHistory_WithValidSession_ShouldReturn200AndHistoryList()`
6. `getHistory_WithLimitParameter_ShouldApplyLimit()`
7. `getHistory_WithInvalidSession_ShouldReturn404()`
8. `joinRoom_WithValidSessionAndRoom_ShouldReturn201AndHistory()`
9. `joinRoom_WithNonExistentRoom_ShouldReturn404()`
10. `joinRoom_WithInvalidSession_ShouldReturn404()`
11. `leaveRoom_WithValidSessionAndHistory_ShouldReturn200()`
12. `leaveRoom_WithInvalidSession_ShouldReturn404()`

## 持续集成建议

### GitHub Actions配置示例
```yaml
name: Phase 3 Tests
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
          mvn test
      - name: Generate Coverage Report
        run: |
          cd backend
          mvn jacoco:report
      - name: Upload Coverage Report
        uses: actions/upload-artifact@v3
        with:
          name: coverage-report
          path: backend/target/site/jacoco/
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
                            <limit>
                                <counter>BRANCH</counter>
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
void getUserEmojis_WithValidSessionId_ShouldReturnUserEmojis()

@Test  
void saveFile_WithVideoType_ShouldSaveToVideosDirectory()

@Test
void uploadFile_WithInvalidSession_ShouldReturnUnauthorized()
```

### 2. 测试隔离
每个测试独立运行，不依赖其他测试状态：
- 使用@BeforeEach准备测试数据
- 使用@AfterEach清理测试数据
- 使用临时目录避免文件冲突

### 3. 断言清晰
使用明确的断言消息：
```java
assertEquals("Expected 3 default emojis", 3, emojis.size(), 
    "Should return correct number of default emojis");
```

### 4. 模拟验证
验证模拟对象的调用情况：
```java
verify(emojiRepository, times(1)).save(any(Emoji.class));
verify(fileService, never()).deleteFile(anyString(), anyString());
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

#### 2. 文件权限问题
使用临时目录并确保测试有读写权限：
```java
Path tempDir = Files.createTempDirectory("uploads-test");
```

#### 3. 会话验证失败
确保正确模拟SessionService：
```java
when(sessionService.validateSession("valid-session")).thenReturn(true);
```

#### 4. 文件上传测试失败
确保正确配置multipart参数：
```java
mockMvc.perform(multipart("/api/files/upload")
    .file(mockFile)
    .param("type", "video")
    .header("X-Session-Id", "valid-session"))
```

#### 5. 事务回滚问题
在集成测试中使用@Transactional确保数据回滚：
```java
@SpringBootTest
@Transactional
class EmojiRepositoryTest {
    // 测试方法
}
```

## 后续改进计划

1. **性能测试** - 添加文件上传下载的性能测试
2. **并发测试** - 多用户同时上传文件的并发测试
3. **安全测试** - 文件路径遍历攻击测试
4. **存储测试** - 大文件存储和清理策略测试
5. **覆盖率提升** - 目标达到90%+覆盖率

---

*最后更新: 2026-03-06*
*测试执行状态: 待实现*