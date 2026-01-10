package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/DopDopTeam/DopDocAI/auth-service/internal/models"
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
	users UserRepository
	Jwt   models.JWT
}

func NewAuthService(users UserRepository, jwt models.JWT) *AuthService {
	return &AuthService{
		users: users,
		Jwt:   jwt,
	}
}

func (s *AuthService) Login(req models.LoginRequest, ctx context.Context) (*models.LoginResult, error) {
	log.WithField("username", req.Username).
		Debug("Attempting to fetch user")
	user, err := s.users.GetByUsername(ctx, req.Username)
	if err != nil {
		log.WithFields(log.Fields{
			"username": req.Username,
			"error":    err,
		}).Error("Failed to get user from repository")
		return nil, err
	}

	if user == nil {
		log.WithField("username", req.Username).
			Warn("User not found")
		return nil, errors.New("User not found")
	}

	log.WithField("userID", user.ID).
		Debug("Checking user password")

	auth, err := s.users.CheckPassword(ctx, user.ID, req.Password)
	if err != nil {
		log.WithFields(log.Fields{
			"userID": user.ID,
			"error":  err,
		}).Error("Error while checking password")
		return nil, err
	}

	if !auth {
		log.WithField("userID", user.ID).
			Warn("Password mismatch")
		return nil, errors.New("Password mismatch")
	}

	log.WithFields(log.Fields{
		"username": req.Username,
	}).Debug("Generating tokens")

	accessToken, err := generateToken(req.Username, "access", s.Jwt.AccessTTL, s.Jwt.Secret)
	if err != nil {
		log.WithError(err).
			Error("Failed to generate access token")
		return nil, err
	}

	refreshToken, err := generateToken(req.Username, "refresh", s.Jwt.RefreshTTL, s.Jwt.Secret)
	if err != nil {
		log.WithError(err).
			Error("Failed to generate refresh token")
		return nil, err
	}

	return &models.LoginResult{
		UserID:       user.ID,
		Username:     user.Username,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		AccessTTL:    s.Jwt.AccessTTL,
	}, nil

}

func (s *AuthService) Refresh(reqToken string, ctx context.Context) (*models.LoginResult, error) {
	log.Debug("Parsing token...")
	claims, err := s.parseToken(reqToken, "refresh")
	if err != nil {
		log.WithError(err).Info("Token parsed with error")
		return nil, err
	}

	user, err := s.users.GetByUsername(ctx, claims.Username)
	if err != nil {
		log.WithError(err).Warn("Trying refresh from deleted account")
		return nil, err
	}

	log.WithFields(log.Fields{
		"username":   claims.Username,
		"email":      user.Email,
		"jti":        claims.JTI,
		"token_type": claims.TokenType,
	}).Debug("Parsed token claims")

	log.Debug("Generating access token...")
	accessToken, err := generateToken(claims.Username, "access", s.Jwt.AccessTTL, s.Jwt.Secret)
	if err != nil {
		return nil, err
	}

	log.Debug("Generating refresh token...")
	refreshToken, err := generateToken(claims.Username, "refresh", s.Jwt.RefreshTTL, s.Jwt.Secret)
	if err != nil {
		return nil, err
	}

	return &models.LoginResult{
		UserID:       user.ID,
		Username:     user.Username,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		AccessTTL:    s.Jwt.AccessTTL,
	}, nil
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

func (s *AuthService) parseToken(tokenString string, tokenType string) (*models.Claims, error) {
	var claims models.Claims
	token, err := jwt.ParseWithClaims(tokenString, &claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return s.Jwt.Secret, nil
	})
	if err != nil || !token.Valid {
		return nil, errors.New("invalid token")
	} else if claims, ok := token.Claims.(*models.Claims); ok {
		log.WithField("token_id", claims.JTI).Info("Token parsed successfully")
	} else {
		return nil, errors.New("uknown claims, can't proceed")
	}

	if claims.TokenType != tokenType {
		return nil, errors.New("invalid token type")
	}

	return &claims, nil
}
