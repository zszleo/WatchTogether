# OpenAPI/Swagger 集成文档

## 已完成的集成

### 1. 依赖配置
- 在 `pom.xml` 中添加了 `springdoc-openapi-starter-webmvc-ui` 依赖
- 版本: 2.3.0 (兼容 Spring Boot 3.x)

### 2. 配置类
- 创建了 `OpenApiConfig.java` 配置 OpenAPI 文档信息
- 包含 API 标题、描述、版本、联系信息等

### 3. 应用配置
- 在 `application.yml` 中添加了 `springdoc` 配置
- 启用了 API 文档 (`/api-docs`) 和 Swagger UI (`/swagger-ui.html`)
- 配置了文档路径、UI 选项等

### 4. 控制器注解
为所有控制器添加了 OpenAPI 注解：

| 控制器 | 标签 | 描述 |
|--------|------|------|
| `SessionController` | `会话管理` | 用户会话管理相关的API |
| `RoomController` | `房间管理` | 创建、加入和管理观看房间相关的API |
| `EmojiController` | `表情系统` | 表情管理和反应相关的API |
| `FileController` | `文件上传` | 视频和文件上传相关的API |
| `HealthController` | `健康检查` | 系统健康状态检查相关的API |

### 5. API 文档语言
- **主 API 描述**: 中文（OpenApiConfig.java 中的 description）
- **API 分组标签**: 中文（控制器 @Tag 注解）
- **API 方法签名**: 保持英文（便于前后端统一）
- **参数和模型**: 保持英文（与代码保持一致）

> **语言策略说明**: 主要文档内容使用中文便于团队理解，技术细节保持英文确保API契约的一致性。

## 访问方式

### 开发环境
启动应用后访问以下地址：

1. **Swagger UI 界面**: http://localhost:18080/swagger-ui.html
2. **OpenAPI JSON 文档**: http://localhost:18080/api-docs
3. **OpenAPI YAML 文档**: http://localhost:18080/api-docs.yaml

### 生产环境
生产环境默认禁用 Swagger UI，可通过以下配置启用：
```yaml
springdoc:
  swagger-ui:
    enabled: true
```

## API 分组

所有 API 已按功能分组：
- **会话管理** (`/api/sessions/**`)
- **房间管理** (`/api/rooms/**`)
- **表情系统** (`/api/emojis/**`)
- **文件上传** (`/api/files/**`)
- **健康检查** (`/api/health/**`)

## 实时通信 (Socket.io)

注意：实时通信使用 Socket.io，不在 REST API 文档中显示。Socket.io 服务运行在端口 `19090`。

## 前端对接使用说明

### 1. 获取 API 文档
前端开发人员可通过 Swagger UI 查看所有可用接口：
- 请求方法、路径、参数
- 请求/响应模型
- 示例请求

### 2. 接口测试
可直接在 Swagger UI 中进行接口测试：
- 填写请求参数
- 发送请求查看响应
- 调试接口功能

### 3. 代码生成
可使用 OpenAPI 文档生成前端客户端代码：
```bash
# 使用 openapi-generator
openapi-generator generate -i http://localhost:18080/api-docs -g typescript-axios -o ./src/api
```

## 开发说明

### 添加新的 API 文档
1. 在控制器类上添加 `@Tag` 注解
2. 在方法上添加 `@Operation` 注解（可选）
3. 在参数上添加 `@Parameter` 注解（可选）

示例：
```java
@RestController
@Tag(name = "示例API", description = "示例控制器")
public class ExampleController {
    
    @GetMapping("/example")
    @Operation(summary = "获取示例", description = "返回示例数据")
    public ResponseEntity<ApiResponse<Example>> getExample(
            @Parameter(description = "示例ID") @PathVariable Long id) {
        // ...
    }
}
```

### 安全注意事项
- 生产环境建议禁用 Swagger UI
- 使用环境变量控制启用状态
- 可通过配置限制访问 IP

## 测试

运行以下命令测试集成：
```bash
# 编译项目
mvn clean compile

# 运行测试
mvn test

# 启动应用测试 Swagger UI
mvn spring-boot:run
```

## 故障排除

### 1. Swagger UI 无法访问
- 检查应用是否正常运行
- 确认端口配置（默认 18080）
- 检查 `springdoc.swagger-ui.enabled` 配置

### 2. API 文档不完整
- 确认控制器在 `com.watchtogether.controller` 包下
- 检查 `springdoc.packages-to-scan` 配置
- 确认 `@RestController` 注解存在

### 3. 编译错误
- 检查 Swagger 注解导入是否正确
- 避免类名冲突（如 `ApiResponse`）
- 确认依赖版本兼容性