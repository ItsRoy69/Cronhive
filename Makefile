.PHONY: dev dev-full migrate seed serve test lint build build-all docker-up

dev:
	docker compose -f deploy/docker-compose.yml up -d postgres
	go run ./cmd/server serve

dev-full:
	docker compose -f deploy/docker-compose.yml up -d postgres minio
	S3_ENDPOINT=http://localhost:9000 go run ./cmd/server serve

migrate:
	go run ./cmd/server migrate

seed:
	go run ./cmd/server seed

serve:
	go run ./cmd/server serve

build:
	go build -ldflags="-s -w" -o bin/server ./cmd/server

build-all:
	go build -ldflags="-s -w" -o bin/server ./cmd/server
	go build -ldflags="-s -w" -o bin/scheduler ./cmd/scheduler
	go build -ldflags="-s -w" -o bin/worker ./cmd/worker

docker-up:
	docker compose -f deploy/docker-compose.yml up --build

lint:
	golangci-lint run ./...

test:
	go test ./... -v -race -timeout 60s
