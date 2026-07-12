package api

import (
	"context"
	"crypto/sha256"
	"fmt"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

type contextKey string

const tenantKey contextKey = "tenant_id"

func AuthMiddleware(db *pgxpool.Pool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				jsonError(w, "missing authorization header", 401)
				return
			}

			token := strings.TrimPrefix(authHeader, "Bearer ")
			hash := fmt.Sprintf("%x", sha256.Sum256([]byte(token)))

			var tenantID string
			err := db.QueryRow(r.Context(), `
				UPDATE api_keys SET last_used = now()
				WHERE key_hash = $1
				RETURNING tenant_id
			`, hash).Scan(&tenantID)

			if err != nil {
				jsonError(w, "invalid api key", 401)
				return
			}

			ctx := context.WithValue(r.Context(), tenantKey, tenantID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}