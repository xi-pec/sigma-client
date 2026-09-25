import { MessageLog } from "@/hooks/useConnection"

export interface MessageLogProps {
  logs: Record<string, MessageLog>
}

export function ConversationLog({ logs }: MessageLogProps) {
  return <>
    {
      logs ?
      Object.entries(logs).map(([_, log]) => {
        return <div key={log.timestamp} className={`p-2.5 rounded-lg max-w-[80%] w-fit ${log.self ? "ml-auto bg-blue-600": "mr-auto bg-neutral-800"}`}>
          <span className={`px-4 text-xs ${log.self ? "text-blue-100" : "text-muted"} block`}>{log.self ? "You" : "Them"}</span>
          <span className="px-4 text-white block">{log.message}</span>
        </div>
      })
      :
      <span className="text-center text-muted text-xs">No messages.</span>
    }
  </>
}