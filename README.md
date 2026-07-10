# Cronhive

A multi-tenant cron job scheduling platform built with Go and a Next.js dashboard.

## Architecture

```
cmd/
  server/       – HTTP API server (chi router)
  scheduler/    – Job scheduler process
  worker/       – Job execution worker
dashboard/      – Next.js admin dashboard
internal/       – Core business logic
migrations/     – PostgreSQL migrations
deploy/         – Docker Compose infrastructure
```

## Prerequisites

- Go 1.25+
- Node.js 20+
- Docker & Docker Compose
- (Optional) [golangci-lint](https://golangci-lint.run/) for linting

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/ItsRoy69/cronhive.git
cd cronhive
```

### 2. Set up environment variables

Copy the example and adjust values as needed:

```bash
cp .env.example .env
```

Default `.env` values:

```env
DATABASE_URL=postgres://postgres:dev@localhost:5432/cronhive?sslmode=disable
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-secret-change-in-production
PORT=8081
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=cronhive-logs
ENVIRONMENT=development
```

### 3. Start infrastructure (Postgres + Redis)

```bash
docker compose -f deploy/docker-compose.yml up -d postgres redis
```

### 4. Run the API server

```bash
go run ./cmd/server
```

The server runs migrations automatically on startup and listens on the configured `PORT` (default `8081`).

Health check: `GET http://localhost:8081/health`

### 5. Run the dashboard

```bash
cd dashboard
npm install
npm run dev
```

The dashboard starts at `http://localhost:3000`.

## Makefile Commands

| Command        | Description                                |
| -------------- | ------------------------------------------ |
| `make dev`     | Start Postgres/Redis and run the API server |
| `make build`   | Build the server binary to `bin/cronhive`  |
| `make migrate` | Run database migrations                    |
| `make seed`    | Seed the database with sample data         |
| `make test`    | Run all Go tests                           |
| `make lint`    | Run golangci-lint                          |
| `make docker-up` | Start all services via Docker Compose    |

## Running with Docker Compose (full stack)

```bash
make docker-up
```

This builds and starts all services (API, Postgres, Redis) together.

## Project Structure

| Directory      | Purpose                              |
| -------------- | ------------------------------------ |
| `internal/api` | HTTP handlers and routing            |
| `internal/store` | Database access layer (pgx)        |
| `internal/config` | Environment/config loading        |
| `internal/scheduler` | Cron scheduling logic           |
| `internal/worker` | Job execution engine              |
| `internal/alerter` | Alert/notification dispatch      |
| `migrations/`  | SQL migration files (golang-migrate) |

## Tech Stack

**Backend:** Go, Chi, pgx, golang-migrate, Redis  
**Dashboard:** Next.js 16, React 19, Tailwind CSS 4, shadcn/ui  
**Infrastructure:** PostgreSQL 16, Redis 7, Docker Compose
