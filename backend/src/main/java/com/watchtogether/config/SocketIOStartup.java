package com.watchtogether.config;

import com.corundumstudio.socketio.SocketIOServer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

@Component
public class SocketIOStartup {

    private static final Logger logger = LoggerFactory.getLogger(SocketIOStartup.class);

    private final SocketIOServer socketServer;

    @Autowired
    public SocketIOStartup(SocketIOServer socketServer) {
        this.socketServer = socketServer;
    }

    @PostConstruct
    public void startSocketIOServer() {
        try {
            socketServer.start();
            logger.info("Socket.io server started on {}:{}", 
                socketServer.getConfiguration().getHostname(),
                socketServer.getConfiguration().getPort());
        } catch (Exception e) {
            logger.error("Failed to start Socket.io server", e);
            throw new RuntimeException("Socket.io server failed to start", e);
        }
    }

    @PreDestroy
    public void stopSocketIOServer() {
        try {
            socketServer.stop();
            logger.info("Socket.io server stopped");
        } catch (Exception e) {
            logger.error("Error stopping Socket.io server", e);
        }
    }
}