package com.watchtogether.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.watchtogether.dto.req.CreateRoomReq;
import com.watchtogether.dto.resp.ApiResp;
import com.watchtogether.dto.resp.RoomResp;
import com.watchtogether.model.Room;
import com.watchtogether.service.RoomService;
import com.watchtogether.service.SessionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Optional;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(RoomController.class)
class RoomControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RoomService roomService;

    @MockBean
    private SessionService sessionService;

    private CreateRoomReq createRoomRequest;
    private Room mockRoom;
    private RoomResp mockRoomResponse;
    private String validSessionId = "session-123";

    @BeforeEach
    void setUp() {
        createRoomRequest = new CreateRoomReq();
        createRoomRequest.setName("Test Room");
        createRoomRequest.setDescription("Test Description");
        createRoomRequest.setMaxUsers(10);
        createRoomRequest.setIsPublic(true);
        createRoomRequest.setVideoUrl("https://example.com/video.mp4");
        createRoomRequest.setVideoTitle("Test Video");

        mockRoom = new Room();
        mockRoom.setId(1L);
        mockRoom.setCode("ABC123");
        mockRoom.setName("Test Room");
        mockRoom.setDescription("Test Description");
        mockRoom.setMaxUsers(10);
        mockRoom.setIsPublic(true);
        mockRoom.setOwnerSessionId(validSessionId);
        mockRoom.setVideoUrl("https://example.com/video.mp4");
        mockRoom.setVideoTitle("Test Video");
        mockRoom.setCreatedAt(LocalDateTime.now());
        mockRoom.setUpdatedAt(LocalDateTime.now());
        mockRoom.setLastActivityAt(LocalDateTime.now());

        mockRoomResponse = new RoomResp();
        mockRoomResponse.setId(1L);
        mockRoomResponse.setCode("ABC123");
        mockRoomResponse.setName("Test Room");
        mockRoomResponse.setDescription("Test Description");
        mockRoomResponse.setMaxUsers(10);
        mockRoomResponse.setIsPublic(true);
        mockRoomResponse.setOwnerSessionId(validSessionId);
        mockRoomResponse.setVideoUrl("https://example.com/video.mp4");
        mockRoomResponse.setVideoTitle("Test Video");
        mockRoomResponse.setCreatedAt(LocalDateTime.now());
        mockRoomResponse.setUpdatedAt(LocalDateTime.now());
        mockRoomResponse.setLastActivityAt(LocalDateTime.now());
        mockRoomResponse.setInviteLink("/join/ABC123");
        mockRoomResponse.setOnlineUserCount(0);
    }

    @Test
    void createRoom_WithValidRequestAndSession_ShouldReturnCreated() throws Exception {
        // Arrange
        when(sessionService.validateSession(validSessionId)).thenReturn(true);
        when(roomService.createRoom(any(), eq(validSessionId)))
                .thenReturn(mockRoom);

        // Act & Assert
        mockMvc.perform(post("/api/rooms")
                        .header("X-Session-Id", validSessionId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRoomRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(1)))
                .andExpect(jsonPath("$.data.name", is("Test Room")))
                .andExpect(jsonPath("$.data.code", is("ABC123")));

        verify(sessionService).validateSession(validSessionId);
        verify(roomService).createRoom(any(), eq(validSessionId));
    }

    @Test
    void createRoom_WithoutSessionId_ShouldReturnUnauthorized() throws Exception {
        // Act & Assert
        mockMvc.perform(post("/api/rooms")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRoomRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Missing required session ID in header: X-Session-Id")));

        verify(sessionService, never()).validateSession(anyString());
        verify(roomService, never()).createRoom(any(), any());
    }

    @Test
    void createRoom_WithInvalidSession_ShouldReturnUnauthorized() throws Exception {
        // Arrange
        when(sessionService.validateSession(validSessionId)).thenReturn(false);

        // Act & Assert
        mockMvc.perform(post("/api/rooms")
                        .header("X-Session-Id", validSessionId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRoomRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Invalid session ID: " + validSessionId)));

        verify(sessionService).validateSession(validSessionId);
        verify(roomService, never()).createRoom(any(), any());
    }

    @Test
    void createRoom_WithInvalidRequest_ShouldReturnBadRequest() throws Exception {
        // Arrange
        CreateRoomReq invalidRequest = new CreateRoomReq();
        invalidRequest.setName(""); // Empty name - violates @NotBlank

        when(sessionService.validateSession(validSessionId)).thenReturn(true);

        // Act & Assert
        mockMvc.perform(post("/api/rooms")
                        .header("X-Session-Id", validSessionId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());

        // Validation fails before session check, so validateSession should not be called
        verify(sessionService, never()).validateSession(anyString());
        verify(roomService, never()).createRoom(any(), any());
    }

    @Test
    void getPublicRooms_ShouldReturnListOfRooms() throws Exception {
        // Arrange
        when(roomService.getPublicRooms()).thenReturn(Arrays.asList(mockRoomResponse));

        // Act & Assert
        mockMvc.perform(get("/api/rooms"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].id", is(1)))
                .andExpect(jsonPath("$.data[0].name", is("Test Room")));

        verify(roomService).getPublicRooms();
    }

    @Test
    void getRoom_WithValidRoomIdAndAccess_ShouldReturnRoom() throws Exception {
        // Arrange
        when(roomService.getRoomById(1L)).thenReturn(Optional.of(mockRoom));
        when(sessionService.validateSession(validSessionId)).thenReturn(true);

        // Act & Assert
        mockMvc.perform(get("/api/rooms/1")
                        .header("X-Session-Id", validSessionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(1)))
                .andExpect(jsonPath("$.data.name", is("Test Room")));

        verify(roomService).getRoomById(1L);
    }

    @Test
    void getRoom_WithNonExistentRoom_ShouldReturnNotFound() throws Exception {
        // Arrange
        when(roomService.getRoomById(1L)).thenReturn(Optional.empty());
        when(sessionService.validateSession(validSessionId)).thenReturn(true);

        // Act & Assert
        mockMvc.perform(get("/api/rooms/1")
                        .header("X-Session-Id", validSessionId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Room not found")));

        verify(roomService).getRoomById(1L);
        // Session validation happens in parameter resolver even for non-existent rooms
        verify(sessionService).validateSession(validSessionId);
    }

    @Test
    void getRoom_WithPrivateRoomAndNoSession_ShouldReturnUnauthorized() throws Exception {
        // Arrange
        mockRoom.setIsPublic(false);
        when(roomService.getRoomById(1L)).thenReturn(Optional.of(mockRoom));

        // Act & Assert
        mockMvc.perform(get("/api/rooms/1"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Access denied to private room")));

        verify(roomService).getRoomById(1L);
        verify(sessionService, never()).validateSession(anyString());
    }

    @Test
    void getRoom_WithPrivateRoomAndInvalidSession_ShouldReturnUnauthorized() throws Exception {
        // Arrange
        mockRoom.setIsPublic(false);
        when(roomService.getRoomById(1L)).thenReturn(Optional.of(mockRoom));
        // For @SessionId(required=false), invalid session results in null sessionId
        when(sessionService.validateSession(validSessionId)).thenReturn(false);
        
        // Act & Assert
        mockMvc.perform(get("/api/rooms/1")
                        .header("X-Session-Id", validSessionId))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Access denied to private room")));

        verify(roomService).getRoomById(1L);
        verify(sessionService).validateSession(validSessionId);
    }

    @Test
    void getRoomByCode_WithValidCodeAndAccess_ShouldReturnRoom() throws Exception {
        // Arrange
        when(roomService.getRoomByCode("ABC123")).thenReturn(Optional.of(mockRoom));
        when(sessionService.validateSession(validSessionId)).thenReturn(true);

        // Act & Assert
        mockMvc.perform(get("/api/rooms/code/ABC123")
                        .header("X-Session-Id", validSessionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(1)))
                .andExpect(jsonPath("$.data.code", is("ABC123")));

        verify(roomService).getRoomByCode("ABC123");
    }

    @Test
    void getRoomByCode_WithNonExistentCode_ShouldReturnNotFound() throws Exception {
        // Arrange
        when(roomService.getRoomByCode("XYZ789")).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(get("/api/rooms/code/XYZ789"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Room not found")));

        verify(roomService).getRoomByCode("XYZ789");
    }

    @Test
    void deleteRoom_WithOwnerSession_ShouldDeleteRoom() throws Exception {
        // Arrange
        when(sessionService.validateSession(validSessionId)).thenReturn(true);
        when(roomService.deleteRoom(1L, validSessionId)).thenReturn(true);

        // Act & Assert
        mockMvc.perform(delete("/api/rooms/1")
                        .header("X-Session-Id", validSessionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", containsString("Room deleted successfully")));

        verify(sessionService).validateSession(validSessionId);
        verify(roomService).deleteRoom(1L, validSessionId);
    }

    @Test
    void deleteRoom_WithoutSession_ShouldReturnUnauthorized() throws Exception {
        // Act & Assert
        mockMvc.perform(delete("/api/rooms/1"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Missing required session ID in header: X-Session-Id")));

        verify(sessionService, never()).validateSession(anyString());
        verify(roomService, never()).deleteRoom(anyLong(), anyString());
    }

    @Test
    void deleteRoom_WithInvalidSession_ShouldReturnUnauthorized() throws Exception {
        // Arrange
        when(sessionService.validateSession(validSessionId)).thenReturn(false);

        // Act & Assert
        mockMvc.perform(delete("/api/rooms/1")
                        .header("X-Session-Id", validSessionId))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Invalid session ID: " + validSessionId)));

        verify(sessionService).validateSession(validSessionId);
        verify(roomService, never()).deleteRoom(anyLong(), anyString());
    }

    @Test
    void deleteRoom_WithNonOwnerOrNonExistentRoom_ShouldReturnNotFound() throws Exception {
        // Arrange
        when(sessionService.validateSession(validSessionId)).thenReturn(true);
        when(roomService.deleteRoom(1L, validSessionId)).thenReturn(false);

        // Act & Assert
        mockMvc.perform(delete("/api/rooms/1")
                        .header("X-Session-Id", validSessionId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Room not found or access denied")));

        verify(sessionService).validateSession(validSessionId);
        verify(roomService).deleteRoom(1L, validSessionId);
    }

    @Test
    void getInviteLink_WithValidRoomAndAccess_ShouldReturnLink() throws Exception {
        // Arrange
        when(sessionService.validateSession(validSessionId)).thenReturn(true);
        when(roomService.getRoomById(1L)).thenReturn(Optional.of(mockRoom));
        when(roomService.generateInviteLink("ABC123")).thenReturn("/join/ABC123");

        // Act & Assert
        mockMvc.perform(get("/api/rooms/1/invite")
                        .header("X-Session-Id", validSessionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", is("/join/ABC123")));

        verify(sessionService).validateSession(validSessionId);
        verify(roomService).getRoomById(1L);
        verify(roomService).generateInviteLink("ABC123");
    }

    @Test
    void getInviteLink_WithPrivateRoomAndNoSession_ShouldReturnUnauthorized() throws Exception {
        // Arrange
        mockRoom.setIsPublic(false);
        when(roomService.getRoomById(1L)).thenReturn(Optional.of(mockRoom));

        // Act & Assert
        mockMvc.perform(get("/api/rooms/1/invite"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Access denied")));

        verify(roomService).getRoomById(1L);
        verify(sessionService, never()).validateSession(anyString());
        verify(roomService, never()).generateInviteLink(anyString());
    }

    @Test
    void getChatMessages_WithValidRoomAndAccess_ShouldReturnPlaceholder() throws Exception {
        // Arrange
        when(roomService.getRoomById(1L)).thenReturn(Optional.of(mockRoom));
        when(sessionService.validateSession(validSessionId)).thenReturn(true);

        // Act & Assert
        mockMvc.perform(get("/api/rooms/1/messages")
                        .header("X-Session-Id", validSessionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", containsString("Chat messages endpoint - to be implemented")));

        verify(roomService).getRoomById(1L);
        // Session validation happens in parameter resolver even for public rooms
        verify(sessionService).validateSession(validSessionId);
    }

    @Test
    void getChatMessages_WithNonExistentRoom_ShouldReturnNotFound() throws Exception {
        // Arrange
        when(roomService.getRoomById(1L)).thenReturn(Optional.empty());
        when(sessionService.validateSession(validSessionId)).thenReturn(true);

        // Act & Assert
        mockMvc.perform(get("/api/rooms/1/messages")
                        .header("X-Session-Id", validSessionId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Room not found")));

        verify(roomService).getRoomById(1L);
        // Session validation happens in parameter resolver even for non-existent rooms
        verify(sessionService).validateSession(validSessionId);
    }
}