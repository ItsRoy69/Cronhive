# CronHive

Multi-tenant cron job scheduling platform built with Go and a Next.js dashboard.

## Architecture

```
cmd/
  server/       – HTTP API + migrations + seed (subcommands: serve|migrate|seed)
  scheduler/    – Standalone scheduler process (leader-elected via pg advisory lock)
  worker/       – Standalone job execution worker
dashboard/      – Next.js admin dashboard
internal/
  api/          – HTTP handlers, auth middleware, rate limiting
  alerter/      – PostgreSQL LISTEN/NOTIFY alert dispatcher
  config/       – Environment config loading
  metrics/      – Prometheus metrics + queue depth poller
  scheduler/    – Cron scheduling logic
  storage/      – S3-compatible log uploader
  store/        – pgx database pool, migrations, seed
  worker/       – Job execution engine with retry/backoff
migrations/     – PostgreSQL migrations (golang-migrate)
deploy/         – Docker Compose infrastructure
```

## Prerequisites

- Go 1.25+
- Node.js 22+
- Docker & Docker Compose
- (Optional) [golangci-lint](https://golangci-lint.run/) for linting

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/ItsRoy69/cronhive.git
cd cronhive
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Only `DATABASE_URL` is required. All other variables are optional — see `.env.example` for full documentation.

### 3. Start infrastructure

```bash
# Postgres only (default dev)
docker compose -f deploy/docker-compose.yml up -d postgres

# Postgres + MinIO (for S3 log offload)
docker compose -f deploy/docker-compose.yml up -d postgres minio
```

### 4. Run the API server

```bash
go run ./cmd/server serve
```

Migrations run automatically on startup. Server listens on `PORT` (default `8080`).

```
GET  /health    → {"status":"ok"} or 503 if DB unreachable
GET  /metrics   → Prometheus metrics
```

### 5. Run the dashboard

```bash
cd dashboard
npm install
npm run dev
```

Dashboard starts at `http://localhost:3000`.

Default dev API key (seeded automatically): `ch_dev_key_cronhive_local`

Set in `dashboard/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_API_KEY=ch_dev_key_cronhive_local
```

## Makefile Commands

| Command          | Description                                            |
| ---------------- | ------------------------------------------------------ |
| `make dev`       | Start Postgres and run the API server                  |
| `make dev-full`  | Start Postgres + MinIO and run server with S3 enabled  |
| `make migrate`   | Run database migrations only                           |
| `make seed`      | Seed database with dev tenant and sample job           |
| `make build`     | Build server binary to `bin/server`                    |
| `make build-all` | Build server + scheduler + worker binaries             |
| `make test`      | Run all Go tests                                       |
| `make lint`      | Run golangci-lint                                      |
| `make docker-up` | Build and start full stack via Docker Compose          |

## Subcommand Reference

The server binary accepts a subcommand:

```bash
./bin/server serve    # default — run API server
./bin/server migrate  # run migrations and exit
./bin/server seed     # seed database and exit
```

## Running with Docker Compose (full stack)

```bash
make docker-up
```

Builds and starts all services: API server, scheduler, worker, Postgres. MinIO is available separately in the compose file for S3 log offload.

## API Overview

All endpoints require `Authorization: Bearer <api-key>` header.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/jobs` | List jobs (`?limit=50&offset=0`) |
| POST | `/api/v1/jobs` | Create job |
| GET | `/api/v1/jobs/:id` | Get job |
| PUT | `/api/v1/jobs/:id` | Update job |
| DELETE | `/api/v1/jobs/:id` | Delete job |
| POST | `/api/v1/jobs/:id/pause` | Pause job |
| POST | `/api/v1/jobs/:id/resume` | Resume job |
| POST | `/api/v1/jobs/:id/trigger` | Trigger job immediately |
| GET | `/api/v1/jobs/:id/runs` | List runs (`?limit=50&offset=0`) |
| GET | `/api/v1/runs/:id` | Get run |
| GET | `/api/v1/runs/:id/logs` | Get run logs (inline text or `{"log_url":"..."}`) |
| GET | `/api/v1/alerts` | List alert configs |
| POST | `/api/v1/alerts` | Create alert config |
| PUT | `/api/v1/alerts/:id` | Update alert config |
| DELETE | `/api/v1/alerts/:id` | Delete alert config |
| GET | `/api/v1/keys` | List API keys |
| POST | `/api/v1/keys` | Create API key |
| DELETE | `/api/v1/keys/:id` | Revoke API key |

## Alert Configuration

Alerts dispatch to Slack, webhook, and/or email when jobs change state.

```json
{
  "job_id": null,
  "on_failure": true,
  "on_dead": true,
  "on_recovery": true,
  "on_success": false,
  "slack_url": "https://hooks.slack.com/...",
  "webhook_url": "https://example.com/hook",
  "email": "alerts@example.com"
}
```

- `job_id: null` — applies to all jobs for the tenant
- **Recovery detection**: `run.success` after a previous `failed`/`dead` run is automatically promoted to `run.recovery`
- **Webhook signing**: set `WEBHOOK_SECRET` env var — all webhook payloads include `X-Cronhive-Signature: sha256=<hmac>` for verification

## Log Offload (S3 / MinIO)

When `S3_ENDPOINT` is set, run response bodies > 10 KB are uploaded to S3 and `runs.log_url` is populated. Smaller responses are stored inline in the database.

For local testing with MinIO:
```bash
make dev-full   # starts MinIO at localhost:9000, console at localhost:9001
```

## Metrics

Prometheus metrics at `GET /metrics`:

| Metric | Type | Description |
|--------|------|-------------|
| `cronhive_runs_total` | Counter | Runs by status (success/retry/dead) |
| `cronhive_run_duration_ms` | Histogram | Execution duration |
| `cronhive_queue_depth` | Gauge | Current run_queue depth (polled every 15s) |

## Tech Stack

**Backend:** Go, Chi, pgx, golang-migrate, Prometheus  
**Dashboard:** Next.js, React, Tailwind CSS, shadcn/ui, Recharts  
**Infrastructure:** PostgreSQL 16, Docker Compose, MinIO (optional)
