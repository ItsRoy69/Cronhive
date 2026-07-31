package api

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

func (h *Handler) ListAPIKeys(w http.ResponseWriter, r *http.Request) {
	tenantID := r.Context().Value(tenantKey).(string)

	rows, err := h.db.Query(r.Context(), `
		SELECT id, label, last_used, created_at
		FROM api_keys
		WHERE tenant_id = $1
		ORDER BY created_at DESC
	`, tenantID)
	if err != nil {
		jsonError(w, "failed to list api keys", 500)
		return
	}
	defer rows.Close()

	type keyRow struct {
		ID        string     `json:"id"`
		Label     string     `json:"label"`
		LastUsed  *time.Time `json:"last_used"`
		CreatedAt time.Time  `json:"created_at"`
	}

	var keys []keyRow
	for rows.Next() {
		var k keyRow
		if err := rows.Scan(&k.ID, &k.Label, &k.LastUsed, &k.CreatedAt); err != nil {
			continue
		}
		keys = append(keys, k)
	}
	if keys == nil {
		keys = []keyRow{}
	}
	jsonOK(w, keys)
}

func (h *Handler) CreateAPIKey(w http.ResponseWriter, r *http.Request) {
	tenantID := r.Context().Value(tenantKey).(string)

	var body struct {
		Label string `json:"label"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		jsonError(w, "invalid request body", 400)
		return
	}
	if body.Label == "" {
		body.Label = "api key"
	}

	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		jsonError(w, "failed to generate key", 500)
		return
	}

	plaintext := "ch_" + hex.EncodeToString(raw)
	hash := hex.EncodeToString(func() []byte {
		h := sha256.Sum256([]byte(plaintext))
		return h[:]
	}())

	id := uuid.New().String()
	_, err := h.db.Exec(r.Context(), `
		INSERT INTO api_keys (id, tenant_id, key_hash, label)
		VALUES ($1, $2, $3, $4)
	`, id, tenantID, hash, body.Label)
	if err != nil {
		jsonError(w, "failed to create api key", 500)
		return
	}

	w.WriteHeader(http.StatusCreated)
	jsonOK(w, map[string]string{
		"id":  id,
		"key": plaintext,
	})
}

func (h *Handler) RevokeAPIKey(w http.ResponseWriter, r *http.Request) {
	tenantID := r.Context().Value(tenantKey).(string)
	keyID := chi.URLParam(r, "keyID")

	tag, err := h.db.Exec(r.Context(),
		"DELETE FROM api_keys WHERE id = $1 AND tenant_id = $2",
		keyID, tenantID)
	if err != nil {
		jsonError(w, "failed to revoke api key", 500)
		return
	}
	if tag.RowsAffected() == 0 {
		jsonError(w, "api key not found", 404)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
