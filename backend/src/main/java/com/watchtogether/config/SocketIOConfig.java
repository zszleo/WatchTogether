package com.watchtogether.config;

import com.corundumstudio.socketio.Configuration;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.annotation.SpringAnnotationScanner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;

@org.springframework.context.annotation.Configuration
public class SocketIOConfig {

    @Value("${socketio.host:0.0.0.0}")
    private String host;

    @Value("${socketio.port:19090}")
    private Integer port;

    @Value("${socketio.max-frame-payload-length:10485760}")
    private int maxFramePayloadLength;

    @Value("${socketio.max-http-content-length:10485760}")
    private int maxHttpContentLength;

    @Value("${socketio.ping-timeout:60000}")
    private int pingTimeout;

    @Value("${socketio.ping-interval:25000}")
    private int pingInterval;

    @Value("${socketio.tcp-nodelay:true}")
    private boolean tcpNoDelay;

    @Value("${socketio.tcp-keepalive:true}")
    private boolean tcpKeepAlive;

    @Bean
    public SocketIOServer socketIOServer() {
        Configuration config = new Configuration();
        config.setHostname(host);
        config.setPort(port);
        config.setMaxFramePayloadLength(maxFramePayloadLength);
        config.setMaxHttpContentLength(maxHttpContentLength);
        config.setPingTimeout(pingTimeout);
        config.setPingInterval(pingInterval);
        // config.setTcpNoDelay(tcpNoDelay); // Not available in netty-socketio 2.0.11
        // config.setTcpKeepAlive(tcpKeepAlive); // Not available in netty-socketio 2.0.11
        
        // Allow all origins for development (adjust for production)
        config.setOrigin("*");
        
        return new SocketIOServer(config);
    }

    @Bean
    public SpringAnnotationScanner springAnnotationScanner(SocketIOServer socketServer) {
        return new SpringAnnotationScanner(socketServer);
    }
}