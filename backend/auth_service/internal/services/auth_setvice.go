package services

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/DopDopTeam/DopDocAI/auth-service/internal/models"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	log "github.com/sirupsen/logrus"
	"golang.org/x/crypto/bcrypt"
)

type UserRepository interface {
	GetByID(ctx context.Context, userID int64) (*models.User, error)
	// GetByUsername(ctx context.Context, username string) (*models.User, error)
	CheckPassword(ctx context.Context, userID int64, password string) (bool, error)
	GetByEmail(ctx context.Context, email string) (*models.User, error)
	CreateUser(ctx context.Context, name, passHash string) (int64, error)
}

type AuthService struct {
	users    UserRepository
	Jwt      models.JWT
	hashCost int
}

func NewAuthService(users UserRepository, jwt models.JWT, hashCost int) *AuthService {
	return &AuthService{
		users:    users,
		Jwt:      jwt,
		hashCost: hashCost,
	}
}

func (s *AuthService) Login(req models.LoginRequest, ctx context.Context) (*models.LoginResult, error) {
	log.WithField("email", req.Email).
		Debug("Attempting to fetch user")
	user, err := s.users.GetByEmail(ctx, req.Email)
	if err != nil {
		log.WithFields(log.Fields{
			"email": req.Email,
			"error": err,
		}).Error("Failed to get user from repository")
		return nil, err
	}

	if user == nil {
		log.WithField("email", req.Email).
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
		"email": req.Email,
	}).Debug("Generating tokens")

	accessToken, err := generateToken(user.ID, "access", s.Jwt.AccessTTL, s.Jwt.Secret)
	if err != nil {
		log.WithError(err).
			Error("Failed to generate access token")
		return nil, err
	}

	refreshToken, err := generateToken(user.ID, "refresh", s.Jwt.RefreshTTL, s.Jwt.Secret)
	if err != nil {
		log.WithError(err).
			Error("Failed to generate refresh token")
		return nil, err
	}

	return &models.LoginResult{
		UserID:       user.ID,
		Email:        user.Email,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		AccessTTL:    s.Jwt.AccessTTL,
	}, nil

}

func (s *AuthService) Refresh(reqToken string, ctx context.Context) (*models.LoginResult, error) {
	log.Debug("Parsing token...")
	claims, err := s.ParseToken(reqToken, "refresh")
	if err != nil {
		log.WithError(err).Info("Token parsed with error")
		return nil, err
	}

	user, err := s.users.GetByID(ctx, claims.UserID)
	if err != nil {
		log.WithError(err).Warn("Trying refresh from deleted account")
		return nil, err
	}

	log.WithFields(log.Fields{
		"jti":        claims.JTI,
		"token_type": claims.TokenType,
	}).Debug("Parsed token claims")

	log.Debug("Generating access token...")
	accessToken, err := generateToken(user.ID, "access", s.Jwt.AccessTTL, s.Jwt.Secret)
	if err != nil {
		return nil, err
	}

	log.Debug("Generating refresh token...")
	refreshToken, err := generateToken(user.ID, "refresh", s.Jwt.RefreshTTL, s.Jwt.Secret)
	if err != nil {
		return nil, err
	}

	return &models.LoginResult{
		UserID:       user.ID,
		Email:        user.Email,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		AccessTTL:    s.Jwt.AccessTTL,
	}, nil
}

func (s *AuthService) RegisterUser(email, password string, ctx context.Context) (*models.RegisterResult, error) {
	hash, err := s.stringToHash(password)
	if err != nil {
		return nil, err
	}

	userID, err := s.users.CreateUser(ctx, email, hash)
	if err != nil {
		return nil, err
	}

	user, err := s.users.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	accessToken, err := generateToken(userID, "access", s.Jwt.AccessTTL, s.Jwt.Secret)
	if err != nil {
		log.WithError(err).
			Error("Failed to generate access token")
		return nil, err
	}

	refreshToken, err := generateToken(userID, "refresh", s.Jwt.RefreshTTL, s.Jwt.Secret)
	if err != nil {
		log.WithError(err).
			Error("Failed to generate refresh token")
		return nil, err
	}

	return &models.RegisterResult{
		UserID:       user.ID,
		Email:        user.Email,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		AccessTTL:    s.Jwt.AccessTTL,
	}, nil
}

func generateToken(userID int64, tokenType string, ttl time.Duration, secret []byte) (string, error) {
	now := time.Now()

	claims := models.Claims{
		UserID:    userID,
		TokenType: tokenType,
		JTI:       uuid.NewString(),
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   strconv.FormatInt(userID, 10),
			Issuer:    "auth-service",
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(secret)
}

func (s *AuthService) ParseToken(tokenString string, tokenType string) (*models.Claims, error) {
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

func (s *AuthService) Logout(refresh_token string) error {
	claims, err := s.ParseToken(refresh_token, "refresh")
	if err != nil {
		return err
	}

	log.WithFields(log.Fields{
		"user_id":    claims.UserID,
		"jti":        claims.JTI,
		"token_type": claims.TokenType,
	}).Debug("Parsed token claims")

	return nil
}

func (s *AuthService) stringToHash(a string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(a), s.hashCost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}
