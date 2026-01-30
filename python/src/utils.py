import base64
import os

RUNNER_SCRIPT_CONTENT = r'''#!/usr/bin/env bash
# Ephemeral Job Runner (privacy-safe) - log streaming
set -euo pipefail

BACKEND_URL="{BACKEND_URL}"
JOB_ID="{JOB_ID}"

STREAM_LOGS=true
MAX_STARTUP_LINES=50
NETWORK_WAIT_SECONDS=10

log() {
  local msg="[runner] $1"
  if [ "$STREAM_LOGS" = "true" ]; then
    curl -s -X POST "$BACKEND_URL/jobs/$JOB_ID/logs" -H "Content-Type: application/json" -d "$(jq -nc --arg l "$msg" '{line: $l}')" > /dev/null || true
  fi
  echo "$msg"
}

stream_log() {
  while IFS= read -r line; do
    if [ "$STREAM_LOGS" = "true" ]; then
      curl -s -X POST "$BACKEND_URL/jobs/$JOB_ID/logs" -H "Content-Type: application/json" -d "$(jq -nc --arg l "$line" '{line: $l}')" > /dev/null || true
    fi
    echo "$line"
  done
}

fatal() {
  log "fatal error: $1"
  exit 1
}

log "runner started (JOB_ID=$JOB_ID)"
log "waiting for network (${NETWORK_WAIT_SECONDS}s)"
sleep "$NETWORK_WAIT_SECONDS"

# Check if backend is reachable from this droplet (required for log streaming to UI)
LOG_CHECK_HTTP=$(curl -sS -o /dev/null -w "%{http_code}" -X POST -m 15 "$BACKEND_URL/jobs/$JOB_ID/logs" \
  -H "Content-Type: application/json" -d '{"line":"[runner] connectivity check"}' 2>/dev/null) || echo "000"
if [ "$LOG_CHECK_HTTP" != "200" ]; then
  echo "[runner] WARNING: Backend unreachable (HTTP $LOG_CHECK_HTTP). Set NEXTJS_API_URL to a URL reachable from the internet (e.g. deployed app or public tunnel)."
fi

# Sample logs to verify SSE stream (remove or reduce in production)
log "SSE test: stream connected"
log "SSE test: line 2"
log "SSE test: line 3"

# Resolve name to droplet ID (actual job id) so config and logs use numeric id.
# If resolve fails (404, HTML, network), keep JOB_ID as name; config/logs APIs accept name too.
RESOLVED=$(curl -sS -L "$BACKEND_URL/jobs/resolve?name=$JOB_ID" 2>/dev/null) || true
if [ -n "$RESOLVED" ] && echo "$RESOLVED" | grep -q '^{'; then
  NEW_ID=$(echo "$RESOLVED" | jq -r '.jobId // empty' 2>/dev/null) || true
  if [ -n "$NEW_ID" ] && [ "$NEW_ID" != "null" ] && [[ "$NEW_ID" =~ ^[0-9]+$ ]]; then
    JOB_ID="$NEW_ID"
    log "resolved job id: $JOB_ID"
  else
    log "using job id by name: $JOB_ID"
  fi
else
  log "using job id by name: $JOB_ID"
fi

log "fetching job config"
CONFIG_JSON=$(curl -sS -L "$BACKEND_URL/jobs/$JOB_ID/config" 2>/dev/null) || true
if [ -z "$CONFIG_JSON" ] || ! echo "$CONFIG_JSON" | grep -q '^{'; then
  fatal "failed to fetch job config (no JSON response - check network or backend)"
fi

IMAGE=$(echo "$CONFIG_JSON" | jq -r '.runtime.docker.image // empty' 2>/dev/null) || true
COMMAND=$(echo "$CONFIG_JSON" | jq -r '.runtime.docker.command // empty' 2>/dev/null) || true
GPU=$(echo "$CONFIG_JSON" | jq -r '.runtime.docker.gpu // false' 2>/dev/null) || true

if [ -z "$IMAGE" ] || [ "$IMAGE" = "null" ]; then
  fatal "docker image missing in config"
fi
if [ -z "$COMMAND" ] || [ "$COMMAND" = "null" ]; then
  fatal "docker command missing in config"
fi

log "running platform setup scripts"
echo "$CONFIG_JSON" | jq -r '.bootstrap.scripts[]? // empty' 2>/dev/null | while read -r script; do
  SCRIPT_PATH="/opt/scripts/${script}.sh"
  if [ -x "$SCRIPT_PATH" ]; then
    log "executing setup script: $script"
    "$SCRIPT_PATH" 2>&1 | stream_log
  else
    fatal "setup script not found or not executable: $SCRIPT_PATH"
  fi
done

log "pulling docker image: $IMAGE"
docker pull "$IMAGE" 2>&1 | stream_log

log "starting container (startup logs only)"
if [ "$GPU" = "true" ]; then
  docker run --rm --gpus all "$IMAGE" $COMMAND 2>&1 | head -n "$MAX_STARTUP_LINES" | stream_log
else
  docker run --rm "$IMAGE" $COMMAND 2>&1 | head -n "$MAX_STARTUP_LINES" | stream_log
fi

log "log streaming disabled (privacy boundary reached)"
STREAM_LOGS=false
export STREAM_LOGS

log "executing user workload silently"
if [ "$GPU" = "true" ]; then
  docker run --rm --gpus all "$IMAGE" $COMMAND > /dev/null 2>&1
else
  docker run --rm "$IMAGE" $COMMAND > /dev/null 2>&1
fi

log "job completed"
exit 0
'''

CLOUD_INIT_TEMPLATE = """#cloud-config
package_update: true

packages:
  - ca-certificates
  - curl
  - jq

write_files:
  - path: /opt/scripts/base_setup.sh
    permissions: "0755"
    content: |
      #!/usr/bin/env bash
      set -e
      echo "[setup] CPU base setup done"

  - path: /opt/runner/runner.sh
    permissions: "0755"
    encoding: b64
    content: {RUNNER_SCRIPT_B64}

runcmd:
  - curl -fsSL https://get.docker.com | sh
  - bash /opt/runner/runner.sh
"""



def generate_user_data(backend_url: str, job_id: str = "1") -> str:
    """
    Generate user_data by replacing placeholders in the cloud-init template.
    job_id should be droplet ID (numeric) when known, otherwise droplet name.
    Runner script is base64-encoded so YAML never sees colons/hyphens that break parsing.
    """
    backend_url = os.getenv("BACKEND_URL")
    runner = RUNNER_SCRIPT_CONTENT.replace("{BACKEND_URL}", backend_url).replace("{JOB_ID}", str(job_id))
    runner_b64 = base64.b64encode(runner.encode("utf-8")).decode("ascii")
    user_data = CLOUD_INIT_TEMPLATE.replace("{RUNNER_SCRIPT_B64}", runner_b64)
    return user_data