FROM oven/bun:latest AS base

# Install curl for Docker healthchecks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY bun.lock package.json ./
RUN bun install

COPY . .

RUN mkdir -p /app/storage/images
RUN mkdir -p /app/storage/covers

EXPOSE 3000

CMD ["bun", "run", "index.ts"]
