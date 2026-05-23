FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++

RUN corepack enable

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY backend/package.json ./backend/package.json

RUN pnpm install --filter backend...

COPY backend ./backend

WORKDIR /app

EXPOSE 3000

CMD ["pnpm", "--filter", "backend", "dev"]