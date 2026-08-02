FROM golang:1.26-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o bin/server ./cmd/server && \
    CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o bin/scheduler ./cmd/scheduler && \
    CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o bin/worker ./cmd/worker

FROM alpine:3.21

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

COPY --from=builder /app/bin/ ./bin/
COPY --from=builder /app/migrations/ ./migrations/

EXPOSE 8080

ENV PORT=8080

ENTRYPOINT ["./bin/server"]
CMD ["serve"]
