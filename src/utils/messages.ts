import { MessageLog } from "@/hooks/useConversation"

export function getLatestMessage(logs: Record<string, MessageLog>): [string, MessageLog] | null {
  const entries = Object.entries(logs)

  let recent = null
  for (const entry of entries) {
    if (!recent || !entry[1].timestamp || !recent[1].timestamp || entry[1].timestamp > recent[1].timestamp) 
      recent = entry
  }

  return recent
}

export function getUnread(logs: Record<string, Record<string, MessageLog>>, seen: Record<string, string>): number {
  return Object.entries(logs)
    .map(([id, logs]) => getLatestMessage(logs)?.[0] != seen[id] ? 1 : 0 as number)
    .reduce((a, b) => a + b, 0)
}