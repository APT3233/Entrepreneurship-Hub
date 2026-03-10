# syntax=docker/dockerfile:1.7

FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY app/package.json ./app/

RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

COPY . .

ARG APP_PORT=7777
ENV PORT=${APP_PORT}
EXPOSE 7777

CMD ["node", "server.js"]