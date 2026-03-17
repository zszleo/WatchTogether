package com.watchtogether.common;

public class AppConstants {

    private AppConstants() {
        // Utility class
    }

    // Session settings
    public static final int SESSION_ID_LENGTH = 32;
    public static final String SESSION_ID_PREFIX = "sess_";
    public static final int SESSION_TTL_DAYS = 7;

    // Room settings
    public static final int ROOM_CODE_LENGTH = 6;
    public static final int ROOM_MAX_USERS_DEFAULT = 5;
    public static final int ROOM_CLEANUP_INTERVAL_HOURS = 24;

    // File upload settings
    public static final long MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
    public static final String[] ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".webm", ".mkv", ".mov", ".avi"};
    public static final String UPLOAD_DIR = System.getenv("UPLOAD_DIR") != null ? 
                                           System.getenv("UPLOAD_DIR") : "./uploads";

    // Pagination
    public static final int DEFAULT_PAGE_SIZE = 20;
    public static final int MAX_PAGE_SIZE = 100;

    // Chat settings
    public static final int MAX_CHAT_MESSAGE_LENGTH = 1000;
    public static final int CHAT_HISTORY_LIMIT = 100;

    // Validation messages
    public static final String VALIDATION_NICKNAME_REQUIRED = "Nickname is required";
    public static final String VALIDATION_NICKNAME_LENGTH = "Nickname must be between 1 and 50 characters";
    public static final String VALIDATION_ROOM_NAME_REQUIRED = "Room name is required";
    public static final String VALIDATION_ROOM_NAME_LENGTH = "Room name must be between 1 and 100 characters";

    // Error messages
    public static final String ERROR_ROOM_NOT_FOUND = "Room not found";
    public static final String ERROR_SESSION_NOT_FOUND = "Session not found";
    public static final String ERROR_UNAUTHORIZED = "Unauthorized access";
    public static final String ERROR_ROOM_FULL = "Room is full";
    public static final String ERROR_INVALID_VIDEO_URL = "Invalid video URL";
    public static final String ERROR_FILE_TOO_LARGE = "File size exceeds limit";
    public static final String ERROR_UNSUPPORTED_FILE_TYPE = "Unsupported file type";

    // Socket.io events
    public static final String SOCKET_EVENT_JOIN_ROOM = "join-room";
    public static final String SOCKET_EVENT_LEAVE_ROOM = "leave-room";
    public static final String SOCKET_EVENT_VIDEO_PLAY = "video:play";
    public static final String SOCKET_EVENT_VIDEO_PAUSE = "video:pause";
    public static final String SOCKET_EVENT_VIDEO_SEEK = "video:seek";
    public static final String SOCKET_EVENT_VIDEO_URL_CHANGE = "video:url-change";
    public static final String SOCKET_EVENT_CHAT_MESSAGE = "chat:message";
    public static final String SOCKET_EVENT_USER_JOINED = "user-joined";
    public static final String SOCKET_EVENT_USER_LEFT = "user-left";
    public static final String SOCKET_EVENT_ROOM_STATE = "room-state";
    public static final String SOCKET_EVENT_VIDEO_SYNC_PLAY = "video:sync-play";
    public static final String SOCKET_EVENT_VIDEO_SYNC_PAUSE = "video:sync-pause";
    public static final String SOCKET_EVENT_VIDEO_SYNC_SEEK = "video:sync-seek";
    public static final String SOCKET_EVENT_VIDEO_SYNC_URL_CHANGE = "video:sync-url-change";
}