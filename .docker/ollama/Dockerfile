FROM ollama/ollama:latest

COPY entrypoint.sh /entrypoint.sh
COPY healthcheck.sh /healthcheck.sh
RUN chmod +x /entrypoint.sh /healthcheck.sh

ENV OLLAMA_PULL_MODEL=gemma3:4b

ENTRYPOINT ["/entrypoint.sh"]
