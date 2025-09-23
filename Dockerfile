FROM oven/bun:latest AS base

WORKDIR /app

COPY bun.lock package.json ./
RUN bun install

COPY . .

RUN mkdir -p /app/storage/images

EXPOSE 3000

CMD ["bun", "run", "index.ts"]
