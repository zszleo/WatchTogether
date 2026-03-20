package com.watchtogether.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.watchtogether.config.SocketIOStartup;
import com.watchtogether.config.TestRedisConfig;
import com.watchtogether.dto.req.CreateRoomReq;
import com.watchtogether.model.Room;
import com.watchtogether.repository.RoomRepository;
import com.watchtogether.service.RoomService;
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
class RoomControllerIntegrationTest {

    @MockBean
    private SocketIOStartup socketIOStartup;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RoomService roomService;

    @Autowired
    private SessionService sessionService;

    @Autowired
    private RoomRepository roomRepository;

    private String sessionId;
    private CreateRoomReq createRoomRequest;

    @BeforeEach
    void setUp() {
        sessionId = sessionService.createSession("TestUser", "https://example.com/avatar.png").getId();

        createRoomRequest = new CreateRoomReq();
        createRoomRequest.setName("Integration Test Room");
        createRoomRequest.setDescription("A room for integration testing");
        createRoomRequest.setMaxUsers(10);
        createRoomRequest.setIsPublic(true);
        createRoomRequest.setVideoUrl("https://example.com/video.mp4");
        createRoomRequest.setVideoTitle("Test Video");
    }

    @Test
    void createRoom_WithValidRequest_ShouldReturnCreatedRoom() throws Exception {
        mockMvc.perform(post("/api/room")
                        .header("X-Session-Id", sessionId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRoomRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id").exists())
                .andExpect(jsonPath("$.data.code").exists())
                .andExpect(jsonPath("$.data.name", is("Integration Test Room")))
                .andExpect(jsonPath("$.data.description", is("A room for integration testing")))
                .andExpect(jsonPath("$.data.maxUsers", is(10)))
                .andExpect(jsonPath("$.data.isPublic", is(true)))
                .andExpect(jsonPath("$.data.ownerSessionId", is(sessionId)))
                .andExpect(jsonPath("$.data.videoUrl", is("https://example.com/video.mp4")))
                .andExpect(jsonPath("$.data.videoTitle", is("Test Video")))
                .andExpect(jsonPath("$.data.inviteLink", startsWith("/join/")));
    }

    @Test
    void createRoom_WithoutSessionId_ShouldReturnUnauthorized() throws Exception {
        mockMvc.perform(post("/api/room")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRoomRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    void createRoom_WithInvalidSessionId_ShouldReturnUnauthorized() throws Exception {
        mockMvc.perform(post("/api/room")
                        .header("X-Session-Id", "invalid-session-id")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRoomRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    void createRoom_WithEmptyName_ShouldReturnBadRequest() throws Exception {
        createRoomRequest.setName("");

        mockMvc.perform(post("/api/room")
                        .header("X-Session-Id", sessionId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRoomRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getPublicRooms_WithNoRooms_ShouldReturnEmptyList() throws Exception {
        mockMvc.perform(get("/api/room"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(0)));
    }

    @Test
    void getPublicRooms_WithRooms_ShouldReturnPublicRooms() throws Exception {
        roomService.createRoom(createRoomRequest, sessionId);

        createRoomRequest.setName("Private Room");
        createRoomRequest.setIsPublic(false);
        roomService.createRoom(createRoomRequest, sessionId);

        mockMvc.perform(get("/api/room"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].name", is("Integration Test Room")))
                .andExpect(jsonPath("$.data[0].isPublic", is(true)));
    }

    @Test
    void getRoom_WithValidRoomId_ShouldReturnRoom() throws Exception {
        Room created = roomService.createRoom(createRoomRequest, sessionId);

        mockMvc.perform(get("/api/room/" + created.getId())
                        .header("X-Session-Id", sessionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(created.getId().intValue())))
                .andExpect(jsonPath("$.data.code", is(created.getCode())))
                .andExpect(jsonPath("$.data.name", is(created.getName())));
    }

    @Test
    void getRoom_WithNonExistentRoomId_ShouldReturnNotFound() throws Exception {
        mockMvc.perform(get("/api/room/99999")
                        .header("X-Session-Id", sessionId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Room not found")));
    }

    @Test
    void getRoom_WithPrivateRoomAndNoSession_ShouldReturnUnauthorized() throws Exception {
        createRoomRequest.setIsPublic(false);
        Room privateRoom = roomService.createRoom(createRoomRequest, sessionId);

        mockMvc.perform(get("/api/room/" + privateRoom.getId()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    void getRoomByCode_WithValidCode_ShouldReturnRoom() throws Exception {
        Room created = roomService.createRoom(createRoomRequest, sessionId);

        mockMvc.perform(get("/api/room/code/" + created.getCode())
                        .header("X-Session-Id", sessionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(created.getId().intValue())))
                .andExpect(jsonPath("$.data.code", is(created.getCode())));
    }

    @Test
    void getRoomByCode_WithNonExistentCode_ShouldReturnNotFound() throws Exception {
        mockMvc.perform(get("/api/room/code/NONEXIST")
                        .header("X-Session-Id", sessionId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    void deleteRoom_WithOwnerSession_ShouldReturnSuccess() throws Exception {
        Room created = roomService.createRoom(createRoomRequest, sessionId);

        mockMvc.perform(delete("/api/room/" + created.getId())
                        .header("X-Session-Id", sessionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", containsString("Room deleted successfully")));

        mockMvc.perform(get("/api/room/" + created.getId())
                        .header("X-Session-Id", sessionId))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteRoom_WithNonOwnerSession_ShouldReturnNotFound() throws Exception {
        Room created = roomService.createRoom(createRoomRequest, sessionId);
        String otherSessionId = sessionService.createSession("OtherUser", null).getId();

        mockMvc.perform(delete("/api/room/" + created.getId())
                        .header("X-Session-Id", otherSessionId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    void deleteRoom_WithNonExistentRoom_ShouldReturnNotFound() throws Exception {
        mockMvc.perform(delete("/api/room/99999")
                        .header("X-Session-Id", sessionId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    void deleteRoom_WithoutSession_ShouldReturnUnauthorized() throws Exception {
        Room created = roomService.createRoom(createRoomRequest, sessionId);

        mockMvc.perform(delete("/api/room/" + created.getId()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getInviteLink_WithValidRoom_ShouldReturnLink() throws Exception {
        Room created = roomService.createRoom(createRoomRequest, sessionId);

        mockMvc.perform(get("/api/room/" + created.getId() + "/invite")
                        .header("X-Session-Id", sessionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", is("/join/" + created.getCode())));
    }

    @Test
    void getChatMessages_WithValidRoom_ShouldReturnMessages() throws Exception {
        Room created = roomService.createRoom(createRoomRequest, sessionId);

        mockMvc.perform(get("/api/room/" + created.getId() + "/messages")
                        .header("X-Session-Id", sessionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(0)));
    }

    @Test
    void createRoom_WithMaxUsersExceedingLimit_ShouldReturnBadRequest() throws Exception {
        createRoomRequest.setMaxUsers(100);

        mockMvc.perform(post("/api/room")
                        .header("X-Session-Id", sessionId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRoomRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createRoom_WithNegativeMaxUsers_ShouldReturnBadRequest() throws Exception {
        createRoomRequest.setMaxUsers(0);

        mockMvc.perform(post("/api/room")
                        .header("X-Session-Id", sessionId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRoomRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createRoom_WithMinimalRequest_ShouldSucceed() throws Exception {
        CreateRoomReq minimalRequest = new CreateRoomReq();
        minimalRequest.setName("Minimal Room");

        mockMvc.perform(post("/api/room")
                        .header("X-Session-Id", sessionId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(minimalRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.name", is("Minimal Room")))
                .andExpect(jsonPath("$.data.maxUsers", is(5)))
                .andExpect(jsonPath("$.data.isPublic", is(true)));
    }
}