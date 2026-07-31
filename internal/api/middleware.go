package api

import (
	"context"
	"crypto/sha256"
	"fmt"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type contextKey string

const tenantKey contextKey = "tenant_id"

func AuthMiddleware(db *pgxpool.Pool, jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				jsonError(w, "missing authorization header", 401)
				return
			}

			bearer := strings.TrimPrefix(authHeader, "Bearer ")

			// Try JWT first
			if tenantID, ok := parseJWT(bearer, jwtSecret); ok {
				ctx := context.WithValue(r.Context(), tenantKey, tenantID)
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}

			// Fall back to API key
			hash := fmt.Sprintf("%x", sha256.Sum256([]byte(bearer)))
			var tenantID string
			err := db.QueryRow(r.Context(), `
				UPDATE api_keys SET last_used = now()
				WHERE key_hash = $1
				RETURNING tenant_id
			`, hash).Scan(&tenantID)
			if err != nil {
				jsonError(w, "invalid credentials", 401)
				return
			}

			ctx := context.WithValue(r.Context(), tenantKey, tenantID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func parseJWT(tokenStr, secret string) (string, bool) {
	token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return []byte(secret), nil
	})
	if err != nil || !token.Valid {
		return "", false
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", false
	}
	tid, ok := claims["tenant_id"].(string)
	if !ok || tid == "" {
		return "", false
	}
	return tid, true
}