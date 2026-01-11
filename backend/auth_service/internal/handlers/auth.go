package handlers

import (
	"errors"
	"net/http"

	"github.com/DopDopTeam/DopDocAI/auth-service/internal/models"
	"github.com/DopDopTeam/DopDocAI/auth-service/internal/services"
	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

type AuthHandler struct {
	auth   *services.AuthService
	cookie models.Cookie
}

func NewAuthHandler(auth *services.AuthService, cookie models.Cookie) *AuthHandler {
	return &AuthHandler{
		auth:   auth,
		cookie: cookie,
	}
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid request"})
		return
	}

	loginResult, err := h.auth.Login(req, c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "error"})
		return
	}

	h.issueRefreshCookie(c, loginResult.RefreshToken)

	c.JSON(http.StatusOK, gin.H{
		"acces_token": loginResult.AccessToken,
		"token_type":  "bearer",
		"expires_in":  loginResult.AccessTTL,
		"user_id":     loginResult.UserID,
		"email":       loginResult.Email})
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	log.Debug("Parsing cookie...")
	reqToken, err := c.Cookie("refresh_token")
	log.Println(c.Cookie("resresh_token"))
	if err != nil {
		if errors.Is(err, http.ErrNoCookie) {
			log.Info("Cookie refresh_token not found")
			c.JSON(http.StatusUnauthorized, gin.H{"message": "Cookie refresh_token not found"})
			return
		}
		log.WithError(err).Info("Cookie parsed with error")
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Unable to parse cookie"})
		return
	}

	refreshResult, err := h.auth.Refresh(reqToken, c.Request.Context())
	if err != nil {
		log.WithError(err).Info("Unable to give refresh token")
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Unable to parse cookie"})
		return
	}

	h.issueRefreshCookie(c, refreshResult.RefreshToken)

	c.JSON(http.StatusOK, gin.H{
		"acces_token": refreshResult.AccessToken,
		"token_type":  "bearer",
		"expires_in":  refreshResult.AccessTTL,
		"user_id":     refreshResult.UserID,
		"email":       refreshResult.Email})
}

func (h *AuthHandler) issueRefreshCookie(c *gin.Context, token string) {
	c.SetCookie(
		"refresh_token",
		token,
		int(h.auth.Jwt.AccessTTL),
		"/",
		h.cookie.Domain,
		h.cookie.Secure,
		true,
	)
}

func (h *AuthHandler) clearRefreshCookie(c *gin.Context) {
	c.SetCookie(
		"refresh_token",
		"",
		-1,
		"/",
		h.cookie.Domain,
		h.cookie.Secure,
		true,
	)
}
