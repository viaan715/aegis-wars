#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

LOG_FILE=".paving-plan-ai.log"
PID_FILE=".paving-plan-ai.pid"

if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "Paving Plan AI is already running (PID $(cat "$PID_FILE"))."
  exit 0
fi

nohup uvicorn app:app --host 0.0.0.0 --port "${PORT:-8000}" > "$LOG_FILE" 2>&1 &
echo $! > "$PID_FILE"
sleep 1

if kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "Paving Plan AI started (PID $(cat "$PID_FILE")). Logs: $LOG_FILE"
else
  echo "Paving Plan AI failed to start. Check $LOG_FILE for details."
  exit 1
fi
