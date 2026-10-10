import { useEffect, useState } from "react"

import { useClient } from "@/hooks/useClient"

export type BaseMessageLog<S extends boolean = boolean> = {
  self: S
  message: string,
  timestamp?: number
}

export enum SentMessageLogState {
  SENDING = 0,
  SENT = 1,
  DELIVERED = 2
}

export type SentMessageLog = BaseMessageLog<true> & {
  self: true
  state: SentMessageLogState
}

export type ReceivedMessageLog = BaseMessageLog<false> & {
  self: false
  verified: boolean
}

export type MessageLog = SentMessageLog | ReceivedMessageLog

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