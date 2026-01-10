package models

import (
	"database/sql"
	"net"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	Username  string `json:"email"`
	JTI       string `json:"jti"`
	TokenType string `json:"token_type"`
	jwt.RegisteredClaims
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required,min=8"`
}

type LoginResult struct {
	UserID       int64
	Username     string
	AccessToken  string
	RefreshToken string
	AccessTTL    time.Duration
}

// type RefreshRequest struct {
// 	RefreshToken string `json:"refresh_token" binding:"required"`
// }

// users
type User struct {
	ID           int64        `db:"id" json:"id"`
	Username     string       `db:"username" json:"username"`
	Email        string       `db:"email" json:"email"`
	PasswordHash string       `db:"password_hash" json:"-"`
	IsActive     bool         `db:"is_active" json:"is_active"`
	CreatedAt    time.Time    `db:"created_at" json:"created_at"`
	LastLoginAt  sql.NullTime `db:"last_login_at" json:"last_login_at"` // nullable
}

// refresh_tokens
type RefreshToken struct {
	ID        int64        `db:"id" json:"id"`
	UserID    int64        `db:"user_id" json:"user_id"`
	TokenHash string       `db:"token_hash" json:"-"`
	CreatedAt time.Time    `db:"created_at" json:"created_at"`
	ExpiresAt time.Time    `db:"expires_at" json:"expires_at"`
	RevokedAt sql.NullTime `db:"revoked_at" json:"revoked_at"` // nullable
	UserAgent string       `db:"user_agent" json:"user_agent"`
	IP        net.IP       `db:"ip" json:"ip"`
}
