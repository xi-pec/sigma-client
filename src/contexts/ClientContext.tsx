import { createContext } from "react";
import { DataConnection, Peer } from "peerjs"
import { MessageLog } from "@/hooks/useConversation"

const ClientContext = createContext<{
  self: Peer | null
  id: string | null
  connections: Map<string, DataConnection>
  logs: Record<string, Record<string, MessageLog>>
    seen: Record<string, string>
    read: (peer: string, id: string) => void
  connect: (peer: string) => DataConnection | null
  send: (peer: string, message: string) => void
} | null>(null)

export { ClientContext }