import { useEffect, useState } from "react"

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

  const [connected, setConnected] = useState<boolean>(false)

  useEffect(() => {
    client.connect(id)
  }, [id])

  useEffect(() => {
    const connection = client.connections.get(id)
    if (!connection || !connection.open) setConnected(false)
    else setConnected(true)
  }, [client.connections])

  return {
    connected,
    logs: client.logs[id] ?? {},
    reconnect: () => client.connect(id),
    send: (message: string) => client.send(id, message)
  }
}

export { useConnection }