package handlers

import (
	"net/http"
	"sync/atomic"

	"github.com/DopDopTeam/DopDocAI/auth-service/internal/models"
	"github.com/gin-gonic/gin"
)

type HealthHandler struct {
	ready *atomic.Bool
	env   string
	build models.BuildInfo
}

func NewHealthHandler(ready *atomic.Bool, env string, build models.BuildInfo) *HealthHandler {
	return &HealthHandler{
		ready: ready,
		env:   env,
		build: build,
	}
}

func HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "healthy"})
}

func (h *HealthHandler) Version(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"env": h.env,
		"build": h.build})
}

func (h *HealthHandler) IsAppReady(c *gin.Context) {
	if h.ready.Load() {
		c.JSON(http.StatusOK, gin.H{"ready": "true"})
	} else {
		c.JSON(http.StatusServiceUnavailable, gin.H{"ready": "false"})
	}
}
