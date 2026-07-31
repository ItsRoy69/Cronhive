package api

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type signupRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type authResponse struct {
	Token    string `json:"token"`
	TenantID string `json:"tenant_id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
}

func (h *Handler) Signup(w http.ResponseWriter, r *http.Request) {
	var body signupRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		jsonError(w, "invalid request body", 400)
		return
	}

	body.Email = strings.TrimSpace(strings.ToLower(body.Email))
	body.Name = strings.TrimSpace(body.Name)

	if body.Email == "" || body.Password == "" || body.Name == "" {
		jsonError(w, "name, email and password are required", 400)
		return
	}
	if len(body.Password) < 8 {
		jsonError(w, "password must be at least 8 characters", 400)
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(body.Password), bcrypt.DefaultCost)
	if err != nil {
		jsonError(w, "internal error", 500)
		return
	}

	tenantID := uuid.New().String()

	_, err = h.db.Exec(r.Context(), `
		INSERT INTO tenants (id, name, email, password_hash, plan)
		VALUES ($1, $2, $3, $4, 'free')
	`, tenantID, body.Name, body.Email, string(hash))
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "unique") {
			jsonError(w, "email already registered", 409)
			return
		}
		jsonError(w, "failed to create account", 500)
		return
	}

	// Create a default API key for the new tenant
	raw := make([]byte, 32)
	rand.Read(raw)
	plaintext := "ch_" + hex.EncodeToString(raw)
	keyHash := fmt.Sprintf("%x", sha256.Sum256([]byte(plaintext)))

	h.db.Exec(r.Context(), `
		INSERT INTO api_keys (tenant_id, key_hash, label)
		VALUES ($1, $2, 'default')
	`, tenantID, keyHash)

	token, err := h.generateJWT(tenantID, body.Email)
	if err != nil {
		jsonError(w, "failed to generate token", 500)
		return
	}

	w.WriteHeader(http.StatusCreated)
	jsonOK(w, authResponse{
		Token:    token,
		TenantID: tenantID,
		Name:     body.Name,
		Email:    body.Email,
	})
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var body loginRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		jsonError(w, "invalid request body", 400)
		return
	}

	body.Email = strings.TrimSpace(strings.ToLower(body.Email))

	if body.Email == "" || body.Password == "" {
		jsonError(w, "email and password are required", 400)
		return
	}

	var tenantID, name, storedHash string
	err := h.db.QueryRow(r.Context(), `
		SELECT id, name, password_hash FROM tenants
		WHERE email = $1 AND password_hash IS NOT NULL
	`, body.Email).Scan(&tenantID, &name, &storedHash)
	if err != nil {
		jsonError(w, "invalid email or password", 401)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(body.Password)); err != nil {
		jsonError(w, "invalid email or password", 401)
		return
	}

	token, err := h.generateJWT(tenantID, body.Email)
	if err != nil {
		jsonError(w, "failed to generate token", 500)
		return
	}

	jsonOK(w, authResponse{
		Token:    token,
		TenantID: tenantID,
		Name:     name,
		Email:    body.Email,
	})
}

func (h *Handler) generateJWT(tenantID, email string) (string, error) {
	claims := jwt.MapClaims{
		"tenant_id": tenantID,
		"email":     email,
		"exp":       time.Now().Add(7 * 24 * time.Hour).Unix(),
		"iat":       time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(h.jwtSecret))
}
