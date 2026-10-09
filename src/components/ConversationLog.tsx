import { MessageLog } from "@/hooks/useConversation"

export interface MessageLogProps {
  logs: Record<string, MessageLog>
}

export function ConversationLog({ logs }: MessageLogProps) {
  const entries = Object.entries(logs)
  
  return <div className="grid gap-1">
    {
      entries.length > 0 ?
      entries.map(([_, log]) => {
        return <div key={log.timestamp} className={`p-2.5 rounded-lg max-w-[80%] ${log.self ? "ml-auto bg-blue-600": "mr-auto bg-neutral-800"}`}>
          <span className={`px-4 text-xs ${log.self ? "text-blue-100" : "text-muted"} block`}>{log.self ? "You" : "Them"}</span>
          <span className="px-4 text-white block break-all">{log.message}</span>
        </div>
      })
      :
      <p className="w-full text-center text-muted text-xs">No messages.</p>
    }
  </div>
}