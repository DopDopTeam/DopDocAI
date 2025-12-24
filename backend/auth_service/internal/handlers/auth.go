package handlers

import "github.com/DopDopTeam/DopDocAI/auth-service/internal/services"

type AuthHandler struct {
	auth *services.AuthService
}

func NewAuthHandler(auth *services.AuthService) *AuthHandler {
	return &AuthHandler{auth: auth}
}
