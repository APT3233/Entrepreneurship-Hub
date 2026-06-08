#!/bin/sh
set -eu

MODEL="${OLLAMA_PULL_MODEL:-gemma3:4b}"

/bin/ollama list >/dev/null 2>&1 || exit 1

if [ -n "$MODEL" ] && ! /bin/ollama show "$MODEL" >/dev/null 2>&1; then
  exit 1
fi

exit 0
