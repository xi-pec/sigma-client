import {
  Check,
  CheckDouble,
  ShieldCheck,
  ShieldExclamation
} from "@gravity-ui/icons"

import { MessageLog, SentMessageLogState } from "@/hooks/useConversation"
import { Timestamp } from "@/components/Timestamp"

export interface MessageLogProps {
  logs: Record<string, MessageLog>
}

export function ConversationLog({ logs }: MessageLogProps) {
  const entries = Object.entries(logs)
  
  return <div className="mx-2 flex flex-col mb-2">
    {
      entries.length > 0 ?
      entries.map(([_, log]) => {
        return (
          <div key={log.timestamp} className={`flex flex-col mb-2 ${log.self ? "items-end" : "items-start"}`}>
            <div className={`p-2.5 rounded-lg max-w-[80%] w-fit ${log.self ? "bg-blue-600" : "bg-neutral-800"}`}>
              <span className={`px-4 text-xs ${log.self ? "text-blue-100" : "text-neutral-400"} block mb-0.5`}>
                {log.self ? "You" : "Them"}
              </span>

              <span className="px-4 text-white block break-words">
                {log.message}
              </span>
            </div>

            <div className={`flex items-center gap-1 mt-1 text-xs text-neutral-400 ${log.self ? "text-right flex-row-reverse" : "text-left"}`}>
              <Timestamp timestamp={log.timestamp} />
              {(() => {
                if (log.self) {
                  switch(log.state) {
                    case SentMessageLogState.SENT:
                      return <Check />

                    case SentMessageLogState.DELIVERED:
                      return <CheckDouble />
                  }
                } else {
                  if (log.verified) {
                    return <ShieldCheck />
                  } else {
                    return <ShieldExclamation />
                  }
                }
              })()}
            </div>
          </div>
        )
      })
      :
      <p className="w-full text-center text-muted text-xs">No messages.</p>
    }
  </div>
}