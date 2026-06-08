#!/bin/sh
set -eu

MODEL="${OLLAMA_PULL_MODEL:-gemma3:4b}"

echo "[ollama] Starting server..."
/bin/ollama serve &
SERVE_PID=$!

wait_for_server() {
  i=0
  while [ "$i" -lt 120 ]; do
    if /bin/ollama list >/dev/null 2>&1; then
      return 0
    fi
    i=$((i + 1))
    sleep 1
  done
  echo "[ollama] Server did not become ready in time."
  return 1
}

wait_for_server

if [ -n "$MODEL" ]; then
  if /bin/ollama show "$MODEL" >/dev/null 2>&1; then
    echo "[ollama] Model already present: $MODEL"
  else
    echo "[ollama] Pulling model: $MODEL"
    /bin/ollama pull "$MODEL"
    echo "[ollama] Model ready: $MODEL"
  fi
fi

wait "$SERVE_PID"
