.PHONY: dev migrate test lint build docker-up seed

dev:
	docker compose -f deploy/docker-compose.yml up -d postgres redis
	go run ./cmd/server

migrate:
	go run ./cmd/server migrate

build:
	go build -ldflags="-s -w" -o bin/cronhive ./cmd/server

docker-up:
	docker compose -f deploy/docker-compose.yml up --build

lint:
	golangci-lint run ./...

test:
	go test ./... -v

seed:
	go run ./cmd/server seed