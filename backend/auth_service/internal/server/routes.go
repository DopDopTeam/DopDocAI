package server

import (
	"github.com/DopDopTeam/DopDocAI/auth-service/internal/handlers"
	"github.com/gin-gonic/gin"
)

func setupRoutes(r *gin.Engine, authHandler *handlers.AuthHandler) {

	public := r.Group("/")
	{
		public.GET("/health", handlers.HealthCheck)
		// public.POST("/login", authHandler.Login)
		// public.POST("/refresh", authHandler.Refresh)
		// public.POST("/logout", authHandler.Logout)
	}
}
