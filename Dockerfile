FROM denoland/deno:2.2.1
# Add wait script
COPY --from=ghcr.io/ufoscout/docker-compose-wait:latest /wait /wait
WORKDIR /app
USER deno
COPY deno.json .
COPY deno.lock .
RUN deno install
COPY . .
RUN deno cache src/main.ts
ENV WAIT_COMMAND="deno run -ERN src/main.ts"
# comma separated list of pairs host:port for which you want to wait.
ENV WAIT_HOSTS=db:5432
# max number of seconds to wait for all the hosts to be available before failure. The default is 30 seconds.
ENV WAIT_TIMEOUT=300
# number of seconds to sleep between retries. The default is 1 second.
ENV WAIT_SLEEP_INTERVAL=5
# The timeout of a single TCP connection to a remote host before attempting a new connection. The default is 5 seconds.
ENV WAIT_HOST_CONNECT_TIMEOUT=30
ENTRYPOINT ["/wait"]
