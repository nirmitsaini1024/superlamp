/**
 * Generates the shell script that runs on the droplet.
 * Supports multiple workloads (e.g. nodejs and bun) - loops over each and runs them in sequence.
 * The script expects BACKEND_URL and JOB_ID to be set in the environment
 * (by the cloud-init runner before fetching and executing this script).
 */
export function generateWorkloadScript(params: {
  workloads: { image: string; command: string }[]
  gpu: boolean
}): string {
  const { workloads, gpu } = params
  const gpuArg = gpu ? '--gpus all' : ''

  // Build the loop body for each workload
  const workloadBlocks = workloads.map((w) => {
    const imageEsc = w.image.replace(/'/g, "'\\''")
    const cmdEsc = w.command.replace(/\\/g, '\\\\').replace(/'/g, "'\\''")
    return `
log "--- workload: ${imageEsc} ---"
IMAGE='${imageEsc}'
CMD='${cmdEsc}'

log "pulling docker image: \$IMAGE"
docker pull "\$IMAGE" 2>&1 | stream_log

log "starting container (startup logs only)"
if [ "${String(gpu)}" = "true" ]; then
  docker run --rm ${gpuArg} "\$IMAGE" sh -c "\$CMD" 2>&1 | head -n "\$MAX_STARTUP_LINES" | stream_log
else
  docker run --rm "\$IMAGE" sh -c "\$CMD" 2>&1 | head -n "\$MAX_STARTUP_LINES" | stream_log
fi

log "executing workload silently"
if [ "${String(gpu)}" = "true" ]; then
  docker run --rm ${gpuArg} "\$IMAGE" sh -c "\$CMD" > /dev/null 2>&1
else
  docker run --rm "\$IMAGE" sh -c "\$CMD" > /dev/null 2>&1
fi
`
  }).join('\n')

  return `#!/usr/bin/env bash
# Workload script (generated from job config) - ${workloads.length} workload(s)
set -euo pipefail

# BACKEND_URL and JOB_ID are set by the runner before executing this script
log() {
  local msg="[runner] $1"
  if [ "\${STREAM_LOGS:-true}" = "true" ]; then
    curl -s -X POST "\$BACKEND_URL/jobs/\$JOB_ID/logs" -H "Content-Type: application/json" -d "\$(jq -nc --arg l "\$msg" '{line: \$l}')" > /dev/null || true
  fi
  echo "\$msg"
}

stream_log() {
  while IFS= read -r line; do
    if [ "\${STREAM_LOGS:-true}" = "true" ]; then
      curl -s -X POST "\$BACKEND_URL/jobs/\$JOB_ID/logs" -H "Content-Type: application/json" -d "\$(jq -nc --arg l "\$line" '{line: \$l}')" > /dev/null || true
    fi
    echo "\$line"
  done
}

fatal() {
  log "fatal error: $1"
  exit 1
}

MAX_STARTUP_LINES=50

log "running platform setup"
if [ -x /opt/scripts/base_setup.sh ]; then
  /opt/scripts/base_setup.sh 2>&1 | stream_log
fi

# Run each workload in sequence
${workloadBlocks}

log "log streaming disabled (privacy boundary reached)"
export STREAM_LOGS=false

log "job completed (${workloads.length} workload(s) finished)"
exit 0
`
}
