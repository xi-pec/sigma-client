import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import  { DataConnection, Peer } from "peerjs"

import { MessageLog, MessageSIGMAState, ReceivedMessageLog, SentMessageLog, SentMessageLogState } from "@/hooks/useConversation"
import { useSIGMA } from "@/hooks/useSIGMA";
import { ClientContext } from "@/contexts/ClientContext";
import { Keys } from "@/providers/SIGMAProvider";
import {
  SMSPacket, SMSAcknowledgementPacket, SMSMessagePacket,
  SignatureAlgorithm, SMSKeyPacket,
} from "sigma-protocol"

interface ClientProviderProps {
  children: ReactNode
}

function ClientProvider({ children }: ClientProviderProps) {
  const sigma = useSIGMA()

  const [self, setSelf] = useState<Peer | null>(null)
  const [id, setId] = useState<string | null>(null)
  const [connections, setConnections] = useState<Map<string, DataConnection>>(new Map())
  const [logs, setLogs] = useState<Record<string, Record<string, MessageLog>>>(() => {
    try {
      const saved = localStorage.getItem("chat_logs")
      return saved ? JSON.parse(saved) : {}
    } catch { return {} }
  })
  const [seen, setSeen] = useState<Record<string, string>>((() => {
    try {
      const saved = localStorage.getItem("seen")
      return saved ? JSON.parse(saved) : {}
    } catch { return {} }
  }))
  const ref = useRef<Peer | null>(null)
  const assembly = useRef(new Map<string, SMSMessagePacket[]>)
  const [retries, setRetries] = useState(0)

  // if needed for UI in future
  // const retry = useCallback(() => {
  // 	setRetries((prev) => prev + 1)
  // }, [])

  function log(peer: string, id: string, self: boolean, message: string) {
    setLogs((prev) => {
      return {
        ...prev, // keep existing message log entries
        [peer]: { // overwrite peer logs
          ...(prev[peer] || {}), // keep existing message log entries of peer
          
          // append new message data
          [id]: self ? { 
            self, message,
            state: SentMessageLogState.SENDING
          } as SentMessageLog : {
            self, message,
            sigma: MessageSIGMAState.MISSING
          } as ReceivedMessageLog
        }
      }
    })
  }

  function mark(peer: string, id: string, state: SentMessageLogState) {
    setLogs((prev) => {
      const messages = prev[peer]
      if (!messages) return prev
      
      const message = messages[id]
      if (!message || !message.self || message.state >= state) return prev

      return {
        ...prev, // keep existing message log entries
        [peer]: { // overwrite peer logs
          ...(prev[peer] || {}), // keep existing message log entries of peer
          [id]: { 
            ...message,
            state
          } as SentMessageLog // append new message data
        }
      }
    })
  }

  function read(peer: string, id: string) {
    setSeen((prev) => {
      return {
        ...prev,
        [peer]: id
      }
    })
  }

  function verify(peer: string, id: string, sigma: MessageSIGMAState) {
    setLogs((prev) => {
      const messages = prev[peer]
      if (!messages) return prev

      const message = messages[id]
      if (!message || message.self || message.sigma) return prev

      return {
        ...prev, // keep existing message log entries
        [peer]: { // overwrite peer logs
          ...(prev[peer] || {}), // keep existing message log entries of peer
          [id]: { 
            ...message,
            sigma
          } as ReceivedMessageLog // append new message data
        }
      }
    })
  }

  function timestamp(peer: string, id: string, timestamp: number) {
    setLogs((prev) => {
    const messages = prev[peer]
    if (!messages) return prev
    
    const message = messages[id]
    if (!message) return prev

        return {
          ...prev, // keep existing message log entries
          [peer]: { // overwrite peer logs
            ...(prev[peer] || {}), // keep existing message log entries of peer
            [id]: { 
              ...message,
              timestamp
            } // append new message data
          }
        }
      })
  }

  function addConnection(connection: DataConnection) {
    setConnections((prev) => {
      const next = new Map(prev)
      next.set(connection.peer, connection)
      return next
    })
  }

  function removeConnection(peer: string) {
    setConnections((prev) => {
      const next = new Map(prev)
      next.delete(peer)
      return next
    })
  }

  const handleConnection = useCallback((connection: DataConnection) => {
    connection.on("open", () => {
      addConnection(connection)

      const ecdsa = sigma.keypair.current?.ECDSA.shared
      const ed25519 = sigma.keypair.current?.Ed25519.shared

      if (ecdsa && ed25519) {
        const packet = new SMSKeyPacket(ecdsa, ed25519).serialize()
        connection.send(packet)
      }
    })
    
    connection.on("error", () => {
      removeConnection(connection.peer)
    })
    
    connection.on("close", () => {
      removeConnection(connection.peer)
    })
    
    connection.on("data", (raw: unknown) => {
      if (!(raw instanceof Uint8Array || raw instanceof ArrayBuffer)) return
      const packet = SMSPacket.deserialize(new Uint8Array(raw))

      if (packet instanceof SMSAcknowledgementPacket) {
        mark(connection.peer, packet.id, SentMessageLogState.DELIVERED)
        timestamp(connection.peer, packet.id, packet.timestamp)
      } else if (packet instanceof SMSMessagePacket) {
        const concatenation = packet.elements.find(e => e.identifier == 0x00 || e.identifier == 0x08)

        let message = packet

        // handle concatenation
        if (concatenation) {
          const extended = concatenation.identifier == 0x08
          const offset = extended ? 2 : 1
          const reference = extended ? 
            (concatenation.value[0] << 8) | concatenation.value[1] 
            : concatenation.value[0];
          
          const total = concatenation.value[offset]
          const index = concatenation.value[offset + 1]
          const key = `${connection.peer}_${reference}`

          const map = assembly.current
          if (!map.has(key)) map.set(key, [])

          const parts = map.get(key)!
          parts[index - 1] = packet

          const count = parts.filter(Boolean).length
          if (count < total) return

          // parts are complete
          message = SMSMessagePacket.concatenate(parts)
          map.delete(key)
        }

        log(connection.peer, message.id, false, message.decode())

        const signature = message.elements.find(e => e.identifier == 0x43)

        // handle sigma
        if (signature) {
          const shared = sigma.keys.current.get(connection.peer)

          const key = {
            [SignatureAlgorithm.ECDSA]: shared?.ECDSA,
            [SignatureAlgorithm.ED25519]: shared?.Ed25519
          }[signature.value[0]]

          if (key) {
            const verified = message.verify(key)
            
            verify(
              connection.peer,
              message.id,
              verified ? MessageSIGMAState.VALID : MessageSIGMAState.INVALID
            )
          }
        }

        const acknowledgement = new SMSAcknowledgementPacket(message.id)
        timestamp(connection.peer, message.id, acknowledgement.timestamp)

        connection.send(acknowledgement.serialize())
      } else if (packet instanceof SMSKeyPacket) {
        const keys: Keys = {
          ECDSA: packet.ecdsa,
          Ed25519: packet.ed25519
        }

        sigma.register(connection.peer, keys)
      }
    })
  }, [])
  
  function connect(peer: string): DataConnection | null {
    if (!self) return null

    if (connections.has(peer)) {
      return connections.get(peer) ?? null
    }

    const connection = self.connect(peer)
    handleConnection(connection)

    setLogs((prev) => {
      return {...prev, [peer]: prev[peer] ?? {}}
    })

    return connection
  }

  function send(peer: string, message: string, signature?: Uint8Array) {
    if (!message) return

    let connection = connect(peer)

    const master = new SMSMessagePacket(message)

    if (sigma.enabled && sigma.algorithm) {
      let algorithm = {
        "ecdsa": SignatureAlgorithm.ECDSA,
        "ed25519": SignatureAlgorithm.ED25519
      }[sigma.algorithm]

      let secret = {
        "ecdsa": sigma.keypair.current?.ECDSA.secret,
        "ed25519": sigma.keypair.current?.Ed25519.secret
      }[sigma.algorithm]

      secret && master.sign(algorithm, secret)

      if (signature) {
        let ie = master.elements.find(e => e.identifier == 0x43)
        ie && ie.value.set(signature, 1)
      }
    }

    const packets = master.split()

    function _send() {
      log(peer, master.id, true, message)

      for (const packet of packets) {
        const payload = packet.serialize()
        connection?.send(payload)
      }

      mark(peer, master.id, SentMessageLogState.SENT)
    }


    if (connection?.open) _send()
    else connection?.once("open", _send)
  }

  useEffect(() => {
    const ecdsa = sigma.keypair.current?.ECDSA.shared
    const ed25519 = sigma.keypair.current?.Ed25519.shared

    if (ecdsa && ed25519) {
      const packet = new SMSKeyPacket(ecdsa, ed25519).serialize()

      for (const [_, connection] of connections) {
        connection.send(packet)
      }
    }
  }, [sigma.keypair])

  useEffect(() => {
    if (ref.current && !ref.current.destroyed) {
      setSelf(ref.current)

      return
    }

    let saved = localStorage.getItem("id") ?? ""

    let instance = new Peer(saved, {
      host: window.location.hostname,
      port: 9000,
      path: "/peer/",
      debug: 3
    })

    ref.current = instance

    instance.on("open", (id: string) => {
      setId(id)
      localStorage.setItem("id", id)

      setRetries(0)
    })

    instance.on("error", (e) => {
      switch(e.type) {
        case "network":
        case "disconnected":
        case "unavailable-id":
        case "webrtc":
          setId(null)

          if (ref.current) {
            ref.current.destroy()
            ref.current = null
          }

          setTimeout(() => {
            setRetries((prev) => prev + 1)
          }, 3000 * (retries + 1))
          break;

        case "peer-unavailable":
          break;

        default:
          setRetries(0)
          setId(null)
          break;
      }
    })

    instance.on("disconnected", () => {
      setId(null)
    })

    instance.on("close", () => {
      setId(null)
    })

    instance.on("connection", handleConnection)

    setSelf(instance)

    function handleUnload() {
      if (ref.current) {
        ref.current.destroy()
      }
    }

    window.addEventListener("beforeunload", handleUnload)
    return () => {
      window.removeEventListener("beforeunload", handleUnload)

      instance.destroy()
      ref.current = null
    }
  }, [retries, handleConnection])

  useEffect(() => {
    localStorage.setItem("chat_logs", JSON.stringify(logs))
  }, [logs])

  useEffect(() => {
    localStorage.setItem("seen", JSON.stringify(seen))
  }, [seen])

  return <ClientContext.Provider value={{self, id, connections, logs, seen, read, connect, send}}>{children}</ClientContext.Provider>
}

export { ClientProvider }