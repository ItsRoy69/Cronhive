CREATE TABLE jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  cron_expr     TEXT NOT NULL,
  timezone      TEXT NOT NULL DEFAULT 'UTC',
  http_url      TEXT NOT NULL,
  http_method   TEXT NOT NULL DEFAULT 'POST',
  http_headers  JSONB NOT NULL DEFAULT '{}',
  http_body     TEXT,
  timeout_secs  INT NOT NULL DEFAULT 30,
  max_retries   INT NOT NULL DEFAULT 3,
  retry_backoff TEXT NOT NULL DEFAULT 'exponential',
  status        TEXT NOT NULL DEFAULT 'active',
  next_run_at   TIMESTAMPTZ,
  last_run_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_jobs_next_run
  ON jobs (next_run_at)
  WHERE status = 'active';

CREATE INDEX idx_jobs_tenant
  ON jobs (tenant_id);