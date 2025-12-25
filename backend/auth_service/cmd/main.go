package main

import (
	"context"
	"time"

	"github.com/DopDopTeam/DopDocAI/auth-service/internal/conifg"
	"github.com/DopDopTeam/DopDocAI/auth-service/internal/handlers"
	"github.com/DopDopTeam/DopDocAI/auth-service/internal/repository"
	"github.com/DopDopTeam/DopDocAI/auth-service/internal/server"
	"github.com/DopDopTeam/DopDocAI/auth-service/internal/services"
	"github.com/jackc/pgx/v5/pgxpool"
	log "github.com/sirupsen/logrus"
)

func main() {
	cfg, err := conifg.Read()
	if err != nil {
		log.WithError(err).Fatal("Unbale to read config")
	}

	// postgres
	dbpool, err := pgxpool.New(context.Background(), cfg.DB.DSN)
	if err != nil {
		log.WithError(err).Fatal("Unbale to create DB pool")
	}
	defer dbpool.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	log.Debug("Checking DB pool...")
	if err := dbpool.Ping(ctx); err != nil {
		log.WithError(err).Fatal("DB ping failed, it's likely no any connection to DB")
	}

	log.Info("Database connection pool is up and running")

	log.Debug("Creating user repository...")
	userRepo := repository.NewPGXUserRepository(dbpool)
	authSvc := services.NewAuthService(userRepo, cfg.JWT.Secret)
	authH := handlers.NewAuthHandler(authSvc)

	log.Debug("Starting server...")
	// start a server
	s := server.StartServer(authH, cfg.HTTP.Addr)
	if err := s.Run(); err != nil {
		log.Fatalf("Could not start server: %v", err)
	}
}
