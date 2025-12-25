package server

import (
	"log"

	"github.com/DopDopTeam/DopDocAI/auth-service/internal/handlers"
	"github.com/gin-gonic/gin"
)

type Server struct {
	router *gin.Engine
	addr   string
}

func StartServer(authH *handlers.AuthHandler, addr string) *Server {
	r := gin.Default()
	setupRoutes(r, authH)
	return &Server{
		router: r,
		addr:   addr,
	}
}

func (s *Server) Run() error {
	log.Printf("Starting server on %v", s.addr)
	return s.router.Run(s.addr)
}
