package com.watchtogether.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Value("${spring.application.name:WatchTogether Backend}")
    private String appName;

    @Value("${server.port:18080}")
    private String serverPort;

    @Bean
    public OpenAPI openAPI() {
        final String apiKeyName = "X-Session-Id";
        Server server = new Server()
                .url("http://localhost:" + serverPort)
                .description("Local development server");

        Contact contact = new Contact()
                .name("WatchTogether Team")
                .email("contact@watchtogether.com")
                .url("https://watchtogether.com");

        License license = new License()
                .name("MIT License")
                .url("https://opensource.org/licenses/MIT");

        Info info = new Info()
                .title(appName + " API 文档")
                .version("1.0.0")
                .description("""
                        WatchTogether 后端 REST API - 同步视频观看平台。
                        
                        ## 功能特性
                        - **房间管理**: 创建、加入和管理观看房间
                        - **会话管理**: 用户会话处理，支持Redis缓存
                        - **实时通信**: Socket.io 实现同步视频播放和聊天
                        - **文件上传**: 视频和图片上传支持
                        - **表情系统**: 交互式表情反应功能
                        
                        ## 认证方式
                        当前使用基于会话令牌的认证方式。
                        
                        ## Socket.io 事件
                        实时事件通过Socket.io处理，端口19090。
                        详情请参考SocketEventHandler类。
                        """)
                .contact(contact)
                .license(license);



        // 1. 构建 Components，包含两个安全方案
        Components components = new Components()
                // API Key 方案（放在 header 中）
                .addSecuritySchemes(apiKeyName, new SecurityScheme()
                        .type(SecurityScheme.Type.APIKEY)
                        .in(SecurityScheme.In.HEADER)
                        .name(apiKeyName)          // 实际的请求头名称
                        .description("请输入您的 API Key"));

        // 2. 构建全局安全要求（所有接口默认都需要这两个安全方案）
        List<SecurityRequirement> globalSecurityRequirements = List.of(
                new SecurityRequirement().addList(apiKeyName)
        );
        return new OpenAPI()
                .info(info)
                .servers(List.of(server))
                .components(components)
                .security(globalSecurityRequirements);
    }
}