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