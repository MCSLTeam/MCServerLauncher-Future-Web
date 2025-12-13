# 构建阶段 - 前端构建
FROM node:18-alpine AS frontend-builder

RUN npm install -g pnpm

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile

WORKDIR apps/web

RUN pnpm frontend:build

# 构建阶段 - Rust后端构建
FROM rust:alpine AS backend-builder

# 使用apk安装构建依赖
RUN apk add --no-cache \
    pkgconfig \
    openssl-dev \
    musl-dev

WORKDIR /app

COPY --from=frontend-builder /app /app

WORKDIR apps/web

RUN cargo build --release --package mcsl_future_web

# 运行时阶段
FROM alpine:3.18

RUN apk add --no-cache \
    ca-certificates \
    curl

RUN addgroup -S appuser && adduser -S appuser -G appuser

WORKDIR /app

COPY --from=backend-builder /app/target/release/mcsl_future_web /app/mcsl_future_web

RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 11451

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:11451/api/ || exit 1

CMD ["/app/mcsl_future_web"]