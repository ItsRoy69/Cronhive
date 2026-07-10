CREATE TABLE runs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id       UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'queued',
  attempt      INT NOT NULL DEFAULT 1,
  http_status  INT,
  duration_ms  INT,
  scheduled_at TIMESTAMPTZ,
  started_at   TIMESTAMPTZ,
  finished_at  TIMESTAMPTZ,
  log_url      TEXT,
  log_inline   BYTEA,
  error_msg    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE run_queue (
  run_id     UUID PRIMARY KEY REFERENCES runs(id) ON DELETE CASCADE,
  priority   INT NOT NULL DEFAULT 0,
  visible_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_runs_job ON runs (job_id);
CREATE INDEX idx_runs_tenant ON runs (tenant_id);
CREATE INDEX idx_runs_status ON runs (status);
CREATE INDEX idx_run_queue_claim ON run_queue (priority DESC, visible_at);