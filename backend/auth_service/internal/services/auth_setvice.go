package services

import (
	"context"
	"net/http"
	"time"

	"github.com/DopDopTeam/DopDocAI/auth-service/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	log "github.com/sirupsen/logrus"
)

type UserRepository interface {
	GetByID(ctx context.Context, userID int64) (*models.User, error)
	GetByUsername(ctx context.Context, username string) (*models.User, error)
	CheckPassword(ctx context.Context, userID int64, password string) (bool, error)
}

type AuthService struct {
	users     UserRepository
	jwtSecret []byte
}

func NewAuthService(users UserRepository, jwtSecret []byte) *AuthService {
	return &AuthService{users: users}
}

func (s *AuthService) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid request"})
		return
	}

	log.WithField("username", req.Username).
		Debug("Attempting to fetch user")
	user, err := s.users.GetByUsername(c.Request.Context(), req.Username)
	if err != nil {
		log.WithFields(log.Fields{
			"username": req.Username,
			"error":    err,
		}).Error("Failed to get user from repository")
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid request"})
		return
	}

	if user == nil {
		log.WithField("username", req.Username).
			Warn("User not found")
		c.JSON(http.StatusUnauthorized, gin.H{"message": "input error"})
		return
	}

	log.WithField("userID", user.ID).
		Debug("Checking user password")

	auth, err := s.users.CheckPassword(c.Request.Context(), user.ID, req.Password)
	if err != nil {
		log.WithFields(log.Fields{
			"userID": user.ID,
			"error":  err,
		}).Error("Error while checking password")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not check user creds"})
		return
	}

	if !auth {
		log.WithField("userID", user.ID).
			Warn("Password mismatch")
		c.JSON(http.StatusUnauthorized, gin.H{"message": "authorization failed"})
		return
	}

	log.WithFields(log.Fields{
		"username": req.Username,
	}).Debug("Generating tokens")

	accessToken, err := generateToken(req.Username, "access", 5*time.Minute, s.jwtSecret)
	if err != nil {
		log.WithError(err).
			Error("Failed to generate access token")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create access token"})
		return
	}

	// refreshToken, err := generateToken(req.Username, role, "refresh", 7*24*time.Hour, config.JwtSecret)
	// if err != nil {
	// 	log.WithError(err).
	// 		Error("Failed to generate refresh token")
	// 	c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create refresh token"})
	// 	return
	// }

	c.JSON(http.StatusOK, gin.H{
		"user":               user,
		"access_token":       accessToken,
		"token_type":         "bearer",
		"refresh_expires_in": 1800, // seconds (30 mins)
	})
}

func generateToken(username string, tokenType string, ttl time.Duration, secret []byte) (string, error) {
	claims := models.Claims{
		Username:  username,
		TokenType: tokenType,
		JTI:       uuid.NewString(),
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(ttl)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   username,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(secret)
}

// func parseToken(tokenString string, tokenType string) (*models.Claims, error) {
// 	var claims models.Claims
// 	token, err := jwt.ParseWithClaims(tokenString, &claims, func(token *jwt.Token) (interface{}, error) {
// 		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
// 			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
// 		}
// 		return config.JwtSecret, nil
// 	})
// 	if err != nil || !token.Valid {
// 		return nil, errors.New("invalid token")
// 	} else if claims, ok := token.Claims.(*models.Claims); ok {
// 		log.WithField("token_id", claims.JTI).Info("Token parsed successfully")
// 	} else {
// 		return nil, errors.New("uknown claims, can't proceed")
// 	}

// 	if claims.TokenType != tokenType {
// 		return nil, errors.New("invalid token type")
// 	}

// 	return &claims, nil
// }
