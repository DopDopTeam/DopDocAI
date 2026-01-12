package handlers

import (
	"net/http"

	"github.com/DopDopTeam/DopDocAI/auth-service/internal/models"
	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

func (h *AuthHandler) RegisterUser(c *gin.Context) {
	var req *models.RegisterRequest
	log.Debug("Binding JSON to request...")
	if err := c.ShouldBindJSON(&req); err != nil {
		log.WithError(err).Error("Invalid registration request")
		c.JSON(http.StatusBadRequest, "")
		return
	}
	res, err := h.auth.RegisterUser(req.Email, req.Password, c.Request.Context())
	if err != nil {
		log.WithError(err).Error("Unable to create user")
		c.JSON(http.StatusInternalServerError, "")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token": res.AccessToken,
		"token_type":   "bearer",
		"expires_in":   res.AccessTTL,
		"user_id":      res.UserID,
		"email":        res.Email})
}
