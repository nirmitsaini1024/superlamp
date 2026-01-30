/**
 * In-memory store for job (droplet) log lines.
 * Key: dropletId (number). Used for SSE streaming and POST from runner.
 */

type LogListener = (line: string) => void

interface JobLogsEntry {
  lines: string[]
  listeners: Set<LogListener>
}

const store = new Map<number, JobLogsEntry>()

function getOrCreate(dropletId: number): JobLogsEntry {
  let entry = store.get(dropletId)
  if (!entry) {
    entry = { lines: [], listeners: new Set() }
    store.set(dropletId, entry)
  }
  return entry
}

export function appendLog(dropletId: number, line: string): void {
  const entry = getOrCreate(dropletId)
  entry.lines.push(line)
  entry.listeners.forEach((fn) => fn(line))
}

export function getLines(dropletId: number): string[] {
  return getOrCreate(dropletId).lines
}

export function subscribe(dropletId: number, listener: LogListener): () => void {
  const entry = getOrCreate(dropletId)
  entry.listeners.add(listener)
  return () => entry.listeners.delete(listener)
}

export function hasListeners(dropletId: number): boolean {
  return (store.get(dropletId)?.listeners.size ?? 0) > 0
}
