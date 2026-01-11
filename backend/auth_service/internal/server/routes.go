package server

import (
	"github.com/DopDopTeam/DopDocAI/auth-service/internal/handlers"
	"github.com/gin-gonic/gin"
)

func setupRoutes(r *gin.Engine, authH *handlers.AuthHandler, healthH *handlers.HealthHandler) {

	v1 := r.Group("/v1")

	health := v1.Group("/")
	{
		health.GET("/health", handlers.HealthCheck)
		health.GET("/ready", healthH.IsAppReady)
		health.GET("/version", healthH.Version)
	}

	auth := v1.Group("/auth")
	{
		auth.POST("/login", authH.Login)
		auth.POST("/refresh", authH.Refresh)
		auth.POST("/register", authH.RegisterUser)
		auth.POST("/forward", authH.Forward)
	}
}
