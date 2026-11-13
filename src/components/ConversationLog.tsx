import {
  ScrollShadow,
  Separator,
  Tooltip
} from "@heroui/react"

import {
  Check,
  CheckDouble,
  ShieldCheck,
  ShieldExclamation
} from "@gravity-ui/icons"

import { MessageLog, MessageSIGMAState, SentMessageLogState } from "@/hooks/useConversation"
import { Timestamp } from "@/components/Timestamp"

export interface MessageLogProps {
  logs: Record<string, MessageLog>
  seen: string | null
}

export function ConversationLog({ logs, seen }: MessageLogProps) {
  const entries = Object.entries(logs)
  
  return <ScrollShadow className="h-[99%] overflow-y-scroll">
    <div className="mx-2 flex flex-col mb-2">
      {
        entries.length > 0 ?
        entries.map(([id, log]) => {
          return <div key={log.timestamp}>
            <div className={`flex flex-col mb-2 ${log.self ? "items-end" : "items-start"}`}>
              <div className={`p-2.5 rounded-lg max-w-[80%] w-fit ${log.self ? "bg-blue-600" : "bg-zinc-200 dark:bg-zinc-800"}`}>
                <span className={`px-4 text-xs ${log.self ? "text-blue-100" : "text-zinc-500 dark:text-zinc-400"} block mb-0.5`}>
                  {log.self ? "You" : "Them"}
                </span>

                <span className={`px-4 text-sm block break-words ${log.self ? "text-white" : "text-zinc-900 dark:text-zinc-100"}`}>
                  {log.message}
                </span>
              </div>

              <div className={`flex items-center gap-1 mt-1 text-xs text-zinc-500 dark:text-zinc-400 ${log.self ? "text-right flex-row-reverse" : "text-left"}`}>
                { log.timestamp ? <Timestamp timestamp={log.timestamp} /> : "Sending" }
                {(() => {
                  if (log.self) {
                    switch(log.state) {
                      case SentMessageLogState.SENT:
                        return <Tooltip>
                        <Tooltip.Trigger>
                          <Check />
                        </Tooltip.Trigger>

                        <Tooltip.Content>
                          Message has been sent.
                        </Tooltip.Content>
                      </Tooltip>

                      case SentMessageLogState.DELIVERED:
                        return <Tooltip>
                        <Tooltip.Trigger>
                          <CheckDouble />
                        </Tooltip.Trigger>

                        <Tooltip.Content>
                          Message has been delivered.
                        </Tooltip.Content>
                      </Tooltip>
                    }
                  } else {
                    if (log.sigma == MessageSIGMAState.VALID) {
                      return <Tooltip>
                        <Tooltip.Trigger>
                          <ShieldCheck className="text-success"/>
                        </Tooltip.Trigger>

                        <Tooltip.Content>
                          This message contains a valid signature.
                        </Tooltip.Content>
                      </Tooltip>
                    } else if (log.sigma == MessageSIGMAState.INVALID) {
                      return <Tooltip>
                        <Tooltip.Trigger>
                          <ShieldExclamation className="text-danger"/>
                        </Tooltip.Trigger>

                        <Tooltip.Content>
                          This message contains an invalid signature!
                        </Tooltip.Content>
                      </Tooltip>
                    } else if (log.sigma == MessageSIGMAState.MISSING) {
                      return <Tooltip>
                        <Tooltip.Trigger>
                          <ShieldExclamation className="text-warning"/>
                        </Tooltip.Trigger>

                        <Tooltip.Content>
                          This message does not provide a signature!
                        </Tooltip.Content>
                      </Tooltip>
                    }
                  }
                })()}
              </div>
            </div>
            
            {
              !log.self && id == seen && entries.at(-1)![0] != seen ? <div className="mt-2 mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <Separator className="w-full bg-blue-500" />
                <span className="text-default-400 text-xs text-blue-500 font-medium">UNREAD</span>
                <Separator className="w-full bg-blue-500" />
              </div> : <></>
            }
          </div>
        })
        :
        <p className="w-full text-center text-muted text-xs">No messages.</p>
      }
    </div>
  </ScrollShadow>
}