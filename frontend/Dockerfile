FROM node:20-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY frontend/package.json ./frontend/package.json

RUN pnpm install --filter frontend...

COPY frontend ./frontend

WORKDIR /app

EXPOSE 5173

CMD ["pnpm", "--filter", "frontend", "dev"]