import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import  { DataConnection, Peer } from "peerjs"
import {
  SMSPacket, SMSAcknowledgementPacket, SMSMessagePacket,
  SignatureAlgorithm, SignatureAlgorithmKey,
  SignatureAlgorithmSecretKey, SignatureAlgorithmSharedKey,
  keygen,
  SMSKeyPacket,
} from "sigma-protocol"

export type KeyPair<A extends SignatureAlgorithm> = { 
  secret: SignatureAlgorithmSecretKey<A>,
  shared: SignatureAlgorithmSharedKey<A>
}

export type KeyPairs = { 
  ECDSA: KeyPair<SignatureAlgorithm.ECDSA>
  Ed25519: KeyPair<SignatureAlgorithm.ED25519>
}

export type Keys = {
  ECDSA: SignatureAlgorithmSharedKey<SignatureAlgorithm.ECDSA>
  Ed25519: SignatureAlgorithmSharedKey<SignatureAlgorithm.ED25519>
}

import { MessageLog, ReceivedMessageLog, SentMessageLog, SentMessageLogState } from "@/hooks/useConversation"
import { ClientContext } from "@/contexts/ClientContext";

interface ClientProviderProps {
  children: ReactNode
}

function ClientProvider({ children }: ClientProviderProps) {
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
  const keypair = useRef<KeyPairs | null>(null)
  const keys = useRef(new Map<string, Keys>())
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
            verified: false
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

  function verify(peer: string, id: string, verified: boolean) {
    setLogs((prev) => {
      const messages = prev[peer]
      if (!messages) return prev

      const message = messages[id]
      if (!message || message.self || message.verified) return prev

      return {
        ...prev, // keep existing message log entries
        [peer]: { // overwrite peer logs
          ...(prev[peer] || {}), // keep existing message log entries of peer
          [id]: { 
            ...message,
            verified
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

  function addKeys(id: string, shared: Keys) {
    keys.current.set(id, shared)
  }

  const handleConnection = useCallback((connection: DataConnection) => {
    connection.on("open", () => {
      addConnection(connection)

      const ecdsa = keypair.current?.ECDSA.shared
      const ed25519 = keypair.current?.Ed25519.shared

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

        const sigma = message.elements.find(e => e.identifier == 0x43)

        // handle sigma
        if (sigma) {
          const shared = keys.current.get(connection.peer)

          const key = {
            [SignatureAlgorithm.ECDSA]: shared?.ECDSA,
            [SignatureAlgorithm.ED25519]: shared?.Ed25519
          }[sigma.value[0]]

          if (key) {
            const verified = message.verify(key)
            verified && verify(connection.peer, message.id, true)
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

        addKeys(connection.peer, keys)
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

  function send(peer: string, message: string) {
    if (!message) return

    let connection = connect(peer)

    const master = new SMSMessagePacket(message)
    keypair.current && master.sign(SignatureAlgorithm.ECDSA, keypair.current.ECDSA.secret)

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
    function generate() {
      const ECDSA = keygen(SignatureAlgorithm.ECDSA) as KeyPair<SignatureAlgorithm.ECDSA>
      const Ed25519 = keygen(SignatureAlgorithm.ED25519) as KeyPair<SignatureAlgorithm.ED25519>
      const keys: KeyPairs = { ECDSA, Ed25519 }

      keypair.current = keys
      
      const serialized = JSON.stringify({
        ecdsa: {
          secret: ECDSA.secret.toHex(),
          shared: ECDSA.shared.toHex()
        },

        ed25519: {
          secret: Ed25519.secret.toHex(),
          shared: Ed25519.shared.toHex()
        }
      })

      localStorage.setItem("keypairs", serialized)
    }

    const saved = localStorage.getItem("keypairs")
    if (saved) {
      try {
        const deserialized: {
          ecdsa: { secret: string, shared: string },
          ed25519: { secret: string, shared: string }
        } = JSON.parse(saved)
        
        if (
          !deserialized.ecdsa || !deserialized.ed25519 ||
          !deserialized.ecdsa.secret || !deserialized.ecdsa.shared ||
          !deserialized.ed25519.secret || !deserialized.ed25519.shared
        ) { generate() } else {
          const keys: KeyPairs = {
            ECDSA: {
              secret: SignatureAlgorithmKey.fromHex(deserialized.ecdsa.secret, "secret", SignatureAlgorithm.ECDSA),
              shared: SignatureAlgorithmKey.fromHex(deserialized.ecdsa.shared, "shared", SignatureAlgorithm.ECDSA)
            },

            Ed25519: {
              secret: SignatureAlgorithmKey.fromHex(deserialized.ed25519.secret, "secret", SignatureAlgorithm.ED25519),
              shared: SignatureAlgorithmKey.fromHex(deserialized.ed25519.shared, "shared", SignatureAlgorithm.ED25519)
            },
          }

          keypair.current = keys
        }
      } catch { generate() }
    } else generate()
  }, [id])

  useEffect(() => {
    const ecdsa = keypair.current?.ECDSA.shared
    const ed25519 = keypair.current?.Ed25519.shared

    if (ecdsa && ed25519) {
      const packet = new SMSKeyPacket(ecdsa, ed25519).serialize()

      for (const [_, connection] of connections) {
        connection.send(packet)
      }
    }
  }, [keypair])

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
          }, 3000 * (0 + 1))
          break;

        case "peer-unavailable":
          break;

        default:
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