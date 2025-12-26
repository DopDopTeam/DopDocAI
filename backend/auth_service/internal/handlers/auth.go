package handlers

import (
	"net/http"

	"github.com/DopDopTeam/DopDocAI/auth-service/internal/models"
	"github.com/DopDopTeam/DopDocAI/auth-service/internal/services"
	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	auth *services.AuthService
}

func NewAuthHandler(auth *services.AuthService) *AuthHandler {
	return &AuthHandler{auth: auth}
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

	c.JSON(http.StatusOK, gin.H{
		"acces_token": loginResult.AccessToken,
		"token_type":  "bearer",
		"expires_in":  loginResult.AccessTTL,
		"user_id":     loginResult.UserID,
		"username":    loginResult.Username})
}
