package config

import (
	"errors"
	"os"
	"strconv"
	"time"

	"github.com/DopDopTeam/DopDocAI/auth-service/internal/models"
	"github.com/joho/godotenv"
	log "github.com/sirupsen/logrus"
	"golang.org/x/crypto/bcrypt"
)

type Config struct {
	Env string

	HTTP struct {
		Addr string
	}

	DB struct {
		DSN string
	}

	JWT      models.JWT
	HashCost int
	Cookie   models.Cookie

	Logger LoggerConfig
}

type LoggerConfig struct {
	Format string // "json" | "text"
	Level  string // "debug" | "info" | "warn" | "error"
}

func Read() (Config, error) {
	var cfg Config

	_ = godotenv.Load()

	cfg.Env = getenv("ENV", "dev")
	cfg.HTTP.Addr = getenv("HTTP_ADDR", ":8080")
	cfg.DB.DSN = getenv("DB_DSN", "postgres://postgres:example@localhost:5432/doc_test")

	cfg.Cookie.Secure = getenvBool("SECURE", false)
	cfg.Cookie.Domain = getenv("DOMAIN", "test")

	accessMin, err := atoi(getenv("JWT_ACCESS_TTL_MIN", "15"))
	if err != nil {
		return cfg, err
	}
	refreshDays, err := atoi(getenv("JWT_REFRESH_TTL_DAYS", "14"))
	if err != nil {
		return cfg, err
	}

	cfg.JWT.AccessTTL = time.Duration(accessMin) * time.Minute
	cfg.JWT.RefreshTTL = time.Duration(refreshDays) * 24 * time.Hour
	cfg.JWT.Secret = []byte(mustGetenv("JWT_SECRET"))
	cfg.JWT.Pepper = []byte(mustGetenv("REFRESH_PEPPER"))
	cfg.HashCost = getenvInt("HASH_COST", bcrypt.DefaultCost)

	if cfg.JWT.AccessTTL <= 0 || cfg.JWT.RefreshTTL <= 0 {
		return cfg, errors.New("invalid TTL values")
	}

	cfg.Logger.Format = getenv("LOG_FORMAT", "text")
	cfg.Logger.Level = getenv("LOG_LEVEL", "debug")
	initLogger(cfg.Logger)

	return cfg, nil
}

func getenv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

func getenvInt(key string, def int) int {
	v := os.Getenv(key)
	if v == "" {
		return def
	}

	i, err := strconv.Atoi(v)
	if err != nil {
		return def
	}

	return i
}

func mustGetenv(k string) string {
	v := os.Getenv(k)
	if v == "" {
		panic("missing env: " + k)
	}
	return v
}

func getenvBool(k string, fallback bool) bool {
	v := os.Getenv(k)
	if v == "" {
		return fallback
	}

	b, err := strconv.ParseBool(v)
	if err != nil {
		return fallback
	}
	return b
}

func atoi(s string) (int, error) { return strconv.Atoi(s) }

func initLogger(cfg LoggerConfig) {
	switch cfg.Format {
	case "json":
		log.SetFormatter(&log.JSONFormatter{})
	default:
		log.SetFormatter(&log.TextFormatter{
			FullTimestamp: true,
		})
	}

	switch cfg.Level {
	case "debug":
		log.SetLevel(log.DebugLevel)
	case "info":
		log.SetLevel(log.InfoLevel)
	case "warn":
		log.SetLevel(log.WarnLevel)
	case "error":
		log.SetLevel(log.ErrorLevel)
	default:
		log.SetLevel(log.InfoLevel)
	}
}
