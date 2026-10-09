import { useEffect } from "react"

import { useClient } from "@/hooks/useClient"

export interface MessageLog { 
  self: boolean,
  message: string,
  timestamp: number
}

export type IncomingData = IncomingMessageData;

interface UseConnectionProps {
  id: string
}

export type IncomingMessageData = {
  type: "message",
  id: string,
  message: string
}

function useConnection({ id }: UseConnectionProps) {
  const client = useClient()
  
  useEffect(() => {
    client.connect(id)
  }, [id])

  return { 
    logs: client.logs[id] ?? {}, 
    send: (message: string) => client.send(id, message)
  }
}

export { useConnection }