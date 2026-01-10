package server

import (
	"github.com/DopDopTeam/DopDocAI/auth-service/internal/handlers"
	"github.com/gin-gonic/gin"
)

func setupRoutes(r *gin.Engine, authH *handlers.AuthHandler, healthH *handlers.HealthHandler) {

	public := r.Group("/")
	{
		public.GET("/health", handlers.HealthCheck)
		public.GET("/ready", healthH.IsAppReady)
		public.GET("/version", healthH.Version)
		public.POST("/login", authH.Login)
		public.POST("/refresh", authH.Refresh)
		// public.POST("/logout", authHandler.Logout)
	}
}
