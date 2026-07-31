package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL    string
	JWTSecret      string
	Port           string
	S3Endpoint     string
	S3Bucket       string
	S3AccessKey    string
	S3SecretKey    string
	SMTPHost       string
	SMTPPort       string
	SMTPUser       string
	SMTPPass       string
	SMTPFrom       string
	Environment    string
	AllowedOrigins string
	WebhookSecret  string
	RateLimitRPS   int
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("no .env file found, using environment variables")
	}

	rps, _ := strconv.Atoi(getEnv("RATE_LIMIT_RPS", "60"))

	return &Config{
		DatabaseURL:    getEnv("DATABASE_URL", "postgres://postgres:dev@localhost:5432/cronhive?sslmode=disable"),
		JWTSecret:      getEnv("JWT_SECRET", "dev-secret-change-in-production"),
		Port:           getEnv("PORT", "8080"),
		S3Endpoint:     getEnv("S3_ENDPOINT", ""),
		S3Bucket:       getEnv("S3_BUCKET", "cronhive-logs"),
		S3AccessKey:    getEnv("S3_ACCESS_KEY", "minioadmin"),
		S3SecretKey:    getEnv("S3_SECRET_KEY", "minioadmin"),
		SMTPHost:       getEnv("SMTP_HOST", ""),
		SMTPPort:       getEnv("SMTP_PORT", "587"),
		SMTPUser:       getEnv("SMTP_USER", ""),
		SMTPPass:       getEnv("SMTP_PASS", ""),
		SMTPFrom:       getEnv("SMTP_FROM", ""),
		Environment:    getEnv("ENVIRONMENT", "development"),
		AllowedOrigins: getEnv("ALLOWED_ORIGINS", "http://localhost:3000"),
		WebhookSecret:  getEnv("WEBHOOK_SECRET", ""),
		RateLimitRPS:   rps,
	}
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
