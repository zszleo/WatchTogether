package com.watchtogether.context;

import com.watchtogether.model.Session;

public class SessionContext {
    private static final ThreadLocal<String> currentSessionId = new ThreadLocal<>();
    private static final ThreadLocal<Session> currentSession = new ThreadLocal<>();
    
    public static void setSessionId(String sessionId) {
        currentSessionId.set(sessionId);
    }
    
    public static String getSessionId() {
        return currentSessionId.get();
    }
    
    public static void setSession(Session session) {
        currentSession.set(session);
    }
    
    public static Session getSession() {
        return currentSession.get();
    }
    
    public static void clear() {
        currentSessionId.remove();
        currentSession.remove();
    }
}