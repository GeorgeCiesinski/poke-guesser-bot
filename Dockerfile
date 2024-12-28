# Stage 1: Build
FROM node:22.12.0-bookworm-slim AS builder
WORKDIR /usr/src/app
COPY package.json .
COPY package-lock.json .
COPY tsconfig.json .
COPY src ./src
RUN npm ci
RUN npm run build

# Stage 2: Run
FROM node:22.12.0-bookworm-slim
# Add wait script
COPY --from=ghcr.io/ufoscout/docker-compose-wait:latest /wait /wait
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/package.json .
COPY --from=builder /usr/src/app/package-lock.json .
COPY --from=builder /usr/src/app/build .
COPY --from=builder /usr/src/app/src/languages ./languages
RUN npm ci --omit=dev
ENV WAIT_COMMAND="npm start"
# comma separated list of pairs host:port for which you want to wait.
ENV WAIT_HOSTS=db:5432
# max number of seconds to wait for all the hosts to be available before failure. The default is 30 seconds.
ENV WAIT_TIMEOUT=300
# number of seconds to sleep between retries. The default is 1 second.
ENV WAIT_SLEEP_INTERVAL=5
# The timeout of a single TCP connection to a remote host before attempting a new connection. The default is 5 seconds.
ENV WAIT_HOST_CONNECT_TIMEOUT=30
ENTRYPOINT ["/wait"]
