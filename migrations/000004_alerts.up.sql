CREATE TABLE alert_configs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_id      UUID REFERENCES jobs(id) ON DELETE CASCADE,
  on_failure  BOOL NOT NULL DEFAULT true,
  on_dead     BOOL NOT NULL DEFAULT true,
  on_recovery BOOL NOT NULL DEFAULT false,
  slack_url   TEXT,
  email       TEXT,
  webhook_url TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);