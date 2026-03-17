package com.watchtogether.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import com.watchtogether.dto.req.CreateRoomReq;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class CreateRoomRequestTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void createRoomRequest_WithValidData_ShouldHaveNoViolations() {
        // Arrange
        CreateRoomReq request = new CreateRoomReq();
        request.setName("Valid Room Name");
        request.setDescription("A valid description");
        request.setMaxUsers(10);
        request.setIsPublic(true);
        request.setVideoUrl("https://example.com/video.mp4");
        request.setVideoTitle("Video Title");

        // Act
        Set<ConstraintViolation<CreateRoomReq>> violations = validator.validate(request);

        // Assert
        assertTrue(violations.isEmpty());
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {" ", "   "})
    void name_WhenBlank_ShouldHaveViolation(String invalidName) {
        // Arrange
        CreateRoomReq request = new CreateRoomReq();
        request.setName(invalidName);
        request.setDescription("Description");
        request.setMaxUsers(5);

        // Act
        Set<ConstraintViolation<CreateRoomReq>> violations = validator.validate(request);

        // Assert
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("name")));
    }

    @Test
    void name_WhenTooLong_ShouldHaveViolation() {
        // Arrange
        CreateRoomReq request = new CreateRoomReq();
        request.setName("a".repeat(101)); // 101 characters > max 100
        request.setDescription("Description");
        request.setMaxUsers(5);

        // Act
        Set<ConstraintViolation<CreateRoomReq>> violations = validator.validate(request);

        // Assert
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("name") &&
                        v.getMessage().contains("between 1 and 100 characters")));
    }

    @Test
    void description_WhenTooLong_ShouldHaveViolation() {
        // Arrange
        CreateRoomReq request = new CreateRoomReq();
        request.setName("Valid Name");
        request.setDescription("a".repeat(501)); // 501 characters > max 500
        request.setMaxUsers(5);

        // Act
        Set<ConstraintViolation<CreateRoomReq>> violations = validator.validate(request);

        // Assert
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("description") &&
                        v.getMessage().contains("less than 500 characters")));
    }

    @Test
    void description_WhenNull_ShouldHaveNoViolation() {
        // Arrange
        CreateRoomReq request = new CreateRoomReq();
        request.setName("Valid Name");
        request.setDescription(null);
        request.setMaxUsers(5);

        // Act
        Set<ConstraintViolation<CreateRoomReq>> violations = validator.validate(request);

        // Assert
        // Null description should be allowed (no @NotBlank)
        boolean hasDescriptionViolation = violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("description"));
        assertFalse(hasDescriptionViolation);
    }

    @Test
    void maxUsers_WhenBelowMinimum_ShouldHaveViolation() {
        // Arrange
        CreateRoomReq request = new CreateRoomReq();
        request.setName("Valid Name");
        request.setMaxUsers(0); // Below minimum of 1

        // Act
        Set<ConstraintViolation<CreateRoomReq>> violations = validator.validate(request);

        // Assert
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("maxUsers") &&
                        v.getMessage().contains("must be at least 1")));
    }

    @Test
    void maxUsers_WhenAboveMaximum_ShouldHaveViolation() {
        // Arrange
        CreateRoomReq request = new CreateRoomReq();
        request.setName("Valid Name");
        request.setMaxUsers(51); // Above maximum of 50

        // Act
        Set<ConstraintViolation<CreateRoomReq>> violations = validator.validate(request);

        // Assert
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("maxUsers") &&
                        v.getMessage().contains("cannot exceed 50")));
    }

    @Test
    void maxUsers_WhenNull_ShouldUseDefault() {
        // Arrange
        CreateRoomReq request = new CreateRoomReq();
        request.setName("Valid Name");

        // Act
        // The default value should be set by the service, not validation
        // So null should pass validation (no @NotNull)
        Set<ConstraintViolation<CreateRoomReq>> violations = validator.validate(request);

        // Assert
        boolean hasMaxUsersViolation = violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("maxUsers"));
        assertFalse(hasMaxUsersViolation);
    }

    @Test
    void videoUrl_WhenTooLong_ShouldHaveViolation() {
        // Arrange
        CreateRoomReq request = new CreateRoomReq();
        request.setName("Valid Name");
        request.setVideoUrl("a".repeat(2049)); // 2049 characters > max 2048

        // Act
        Set<ConstraintViolation<CreateRoomReq>> violations = validator.validate(request);

        // Assert
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("videoUrl") &&
                        v.getMessage().contains("less than 2048 characters")));
    }

    @Test
    void videoUrl_WhenNull_ShouldHaveNoViolation() {
        // Arrange
        CreateRoomReq request = new CreateRoomReq();
        request.setName("Valid Name");
        request.setVideoUrl(null);

        // Act
        Set<ConstraintViolation<CreateRoomReq>> violations = validator.validate(request);

        // Assert
        boolean hasVideoUrlViolation = violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("videoUrl"));
        assertFalse(hasVideoUrlViolation);
    }

    @Test
    void videoTitle_WhenTooLong_ShouldHaveViolation() {
        // Arrange
        CreateRoomReq request = new CreateRoomReq();
        request.setName("Valid Name");
        request.setVideoTitle("a".repeat(201)); // 201 characters > max 200

        // Act
        Set<ConstraintViolation<CreateRoomReq>> violations = validator.validate(request);

        // Assert
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("videoTitle") &&
                        v.getMessage().contains("less than 200 characters")));
    }

    @Test
    void constructor_WithAllParameters_ShouldSetFields() {
        // Arrange & Act
        CreateRoomReq request = new CreateRoomReq(
                "Test Room",
                "Test Description",
                10,
                true,
                "https://example.com/video.mp4",
                "Test Video"
        );

        // Assert
        assertEquals("Test Room", request.getName());
        assertEquals("Test Description", request.getDescription());
        assertEquals(10, request.getMaxUsers());
        assertTrue(request.getIsPublic());
        assertEquals("https://example.com/video.mp4", request.getVideoUrl());
        assertEquals("Test Video", request.getVideoTitle());
    }

    @Test
    void settersAndGetters_ShouldWorkCorrectly() {
        // Arrange
        CreateRoomReq request = new CreateRoomReq();

        // Act
        request.setName("Room Name");
        request.setDescription("Room Description");
        request.setMaxUsers(20);
        request.setIsPublic(false);
        request.setVideoUrl("video.mp4");
        request.setVideoTitle("Title");

        // Assert
        assertEquals("Room Name", request.getName());
        assertEquals("Room Description", request.getDescription());
        assertEquals(20, request.getMaxUsers());
        assertFalse(request.getIsPublic());
        assertEquals("video.mp4", request.getVideoUrl());
        assertEquals("Title", request.getVideoTitle());
    }
}