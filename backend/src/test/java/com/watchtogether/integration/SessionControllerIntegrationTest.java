package com.watchtogether.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.watchtogether.config.SocketIOStartup;
import com.watchtogether.config.TestRedisConfig;
import com.watchtogether.dto.req.CreateSessionReq;
import com.watchtogether.dto.req.UpdateProfileReq;
import com.watchtogether.model.Session;
import com.watchtogether.service.SessionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestRedisConfig.class)
@Transactional
class SessionControllerIntegrationTest {

    @MockBean
    private SocketIOStartup socketIOStartup;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private SessionService sessionService;

    private String sessionId;

    @BeforeEach
    void setUp() {
        Session session = sessionService.createSession("InitialUser", "https://example.com/avatar.png");
        sessionId = session.getId();
    }

    @Test
    void createSession_WithValidRequest_ShouldReturnCreatedSession() throws Exception {
        CreateSessionReq request = new CreateSessionReq();
        request.setNickname("NewUser");
        request.setAvatar("https://example.com/new-avatar.png");

        mockMvc.perform(post("/api/session")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id").exists())
                .andExpect(jsonPath("$.data.nickname", is("NewUser")))
                .andExpect(jsonPath("$.data.avatar", is("https://example.com/new-avatar.png")))
                .andExpect(jsonPath("$.data.isOnline", is(false)));
    }

    @Test
    void createSession_WithNullAvatar_ShouldReturnCreatedSession() throws Exception {
        CreateSessionReq request = new CreateSessionReq();
        request.setNickname("UserWithoutAvatar");

        mockMvc.perform(post("/api/session")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.nickname", is("UserWithoutAvatar")))
                .andExpect(jsonPath("$.data.avatar").doesNotExist());
    }

    @Test
    void createSession_WithEmptyNickname_ShouldReturnBadRequest() throws Exception {
        CreateSessionReq request = new CreateSessionReq();
        request.setNickname("");

        mockMvc.perform(post("/api/session")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getSession_WithValidId_ShouldReturnSession() throws Exception {
        mockMvc.perform(get("/api/session/" + sessionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(sessionId)))
                .andExpect(jsonPath("$.data.nickname", is("InitialUser")))
                .andExpect(jsonPath("$.data.avatar", is("https://example.com/avatar.png")));
    }

    @Test
    void getSession_WithNonExistentId_ShouldReturnNotFound() throws Exception {
        mockMvc.perform(get("/api/session/nonexistent-session-id"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Session not found")));
    }

    @Test
    void deleteSession_WithValidId_ShouldReturnSuccess() throws Exception {
        mockMvc.perform(delete("/api/session/" + sessionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", containsString("Session deleted successfully")));

        mockMvc.perform(get("/api/session/" + sessionId))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteSession_WithNonExistentId_ShouldReturnNotFound() throws Exception {
        mockMvc.perform(delete("/api/session/nonexistent-session-id"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    void validateSession_WithValidId_ShouldReturnTrue() throws Exception {
        mockMvc.perform(get("/api/session/" + sessionId + "/validate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", is(true)));
    }

    @Test
    void validateSession_WithInvalidId_ShouldReturnFalse() throws Exception {
        mockMvc.perform(get("/api/session/invalid-session/validate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", is(false)));
    }

    @Test
    void updateProfile_WithNewNickname_ShouldReturnUpdatedSession() throws Exception {
        UpdateProfileReq request = new UpdateProfileReq();
        request.setNickname("UpdatedNickname");

        mockMvc.perform(put("/api/session/" + sessionId + "/profile")
                        .header("X-Session-Id", sessionId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.nickname", is("UpdatedNickname")))
                .andExpect(jsonPath("$.data.avatar", is("https://example.com/avatar.png")));
    }

    @Test
    void updateProfile_WithNewAvatar_ShouldReturnUpdatedSession() throws Exception {
        UpdateProfileReq request = new UpdateProfileReq();
        request.setAvatar("https://example.com/updated-avatar.png");

        mockMvc.perform(put("/api/session/" + sessionId + "/profile")
                        .header("X-Session-Id", sessionId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.nickname", is("InitialUser")))
                .andExpect(jsonPath("$.data.avatar", is("https://example.com/updated-avatar.png")));
    }

    @Test
    void updateProfile_WithBothFields_ShouldReturnUpdatedSession() throws Exception {
        UpdateProfileReq request = new UpdateProfileReq();
        request.setNickname("NewNickname");
        request.setAvatar("https://example.com/new-avatar.png");

        mockMvc.perform(put("/api/session/" + sessionId + "/profile")
                        .header("X-Session-Id", sessionId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.nickname", is("NewNickname")))
                .andExpect(jsonPath("$.data.avatar", is("https://example.com/new-avatar.png")));
    }

    @Test
    void updateProfile_WithNonExistentSession_ShouldReturnNotFound() throws Exception {
        UpdateProfileReq request = new UpdateProfileReq();
        request.setNickname("NewNickname");

        mockMvc.perform(put("/api/session/nonexistent-session/profile")
                        .header("X-Session-Id", "nonexistent-session")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    void getHistory_WithValidSession_ShouldReturnEmptyList() throws Exception {
        mockMvc.perform(get("/api/session/" + sessionId + "/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(0)));
    }

    @Test
    void getHistory_WithNonExistentSession_ShouldReturnNotFound() throws Exception {
        mockMvc.perform(get("/api/session/nonexistent-session/history"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    void joinRoom_WithValidIds_ShouldReturnCreated() throws Exception {
        com.watchtogether.dto.req.CreateRoomReq roomRequest = 
            new com.watchtogether.dto.req.CreateRoomReq();
        roomRequest.setName("Test Room");
        roomRequest.setIsPublic(true);
        var room = sessionService.createSession("temp", null);
        
        mockMvc.perform(post("/api/session/" + sessionId + "/history/join/99999")
                        .header("X-Session-Id", sessionId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }
}