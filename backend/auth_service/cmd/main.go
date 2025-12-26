package main

import (
	"context"
	"sync/atomic"
	"time"

	"github.com/DopDopTeam/DopDocAI/auth-service/internal/config"
	"github.com/DopDopTeam/DopDocAI/auth-service/internal/handlers"
	"github.com/DopDopTeam/DopDocAI/auth-service/internal/models"
	"github.com/DopDopTeam/DopDocAI/auth-service/internal/repository"
	"github.com/DopDopTeam/DopDocAI/auth-service/internal/server"
	"github.com/DopDopTeam/DopDocAI/auth-service/internal/services"
	"github.com/jackc/pgx/v5/pgxpool"
	log "github.com/sirupsen/logrus"
)

type AppState struct {
	Ready atomic.Bool
	Cfg   config.Config
	Build models.BuildInfo
}

var (
	version   = "dev"
	commit    = "none"
	buildTime = "unknown"
)

func main() {
	cfg, err := config.Read()
	if err != nil {
		log.WithError(err).Fatal("Unable to read config")
	}

	state := &AppState{
		Cfg: cfg,
		Build: models.BuildInfo{
			Version:   version,
			Commit:    commit,
			BuildTime: buildTime,
		},
	}
	state.Ready.Store(false)

	// postgres
	dbpool, err := pgxpool.New(context.Background(), cfg.DB.DSN)
	if err != nil {
		log.WithError(err).Fatal("Unable to create DB pool")
	}
	defer dbpool.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	log.Debug("Checking DB pool...")
	if err := dbpool.Ping(ctx); err != nil {
		log.WithError(err).Fatal("DB ping failed, no connection to DB")
	}

	log.Info("Database connection pool is up and running")

	log.Debug("Creating user repository...")
	userRepo := repository.NewPGXUserRepository(dbpool)
	authSvc := services.NewAuthService(userRepo, cfg.JWT)
	authH := handlers.NewAuthHandler(authSvc)
	healthH := handlers.NewHealthHandler(&state.Ready, state.Cfg.Env, state.Build)

	// если все запустилось удачно
	state.Ready.Store(true)

	log.Debug("Starting server...")
	// start a server
	s := server.StartServer(authH, healthH, cfg.HTTP.Addr)
	if err := s.Run(); err != nil {
		log.Fatalf("Could not start server: %v", err)
	}
}
