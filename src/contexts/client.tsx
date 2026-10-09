import { useCallback, useEffect, useRef, useState, createContext, ReactNode } from "react";
import  { DataConnection, Peer } from "peerjs"
import { v4 } from "uuid";

import {
	SignatureAlgorithm, SignatureAlgorithmKey,
	SignatureAlgorithmSecretKey, SignatureAlgorithmSharedKey,
	keygen,
} from "sigma-protocol"

export type KeyPair<A extends SignatureAlgorithm> = { 
	secret: SignatureAlgorithmSecretKey<A>,
	shared: SignatureAlgorithmSharedKey<A>
}

export type Keys = { 
	ECDSA: KeyPair<SignatureAlgorithm.ECDSA>
	Ed25519: KeyPair<SignatureAlgorithm.ED25519>
}

const ClientContext = createContext<{
	self: Peer | null
	id: string | null
	keys: Keys | null
	connections: Map<string, DataConnection>
	logs: Record<string, Record<string, MessageLog>>
	connect: (peer: string) => DataConnection | null
	send: (peer: string, message: string) => void
} | null>(null)

interface ClientProviderProps {
	children: ReactNode
}

export interface MessageLog { 
	self: boolean,
	message: string,
	timestamp: number
}

export type IncomingData = IncomingMessageData;

export type IncomingMessageData = {
	type: "message",
	id: string,
	message: string
}

function ClientProvider({ children }: ClientProviderProps) {
	const [self, setSelf] = useState<Peer | null>(null)
	const [id, setId] = useState<string | null>(null)
	const [keys, setKeys] = useState<Keys | null>(null)
	const [connections, setConnections] = useState<Map<string, DataConnection>>(new Map())
	const [logs, setLogs] = useState<Record<string, Record<string, MessageLog>>>(() => {
		try {
			const saved = localStorage.getItem("chat_logs")
			return saved ? JSON.parse(saved) : {}
		} catch { return {} }
	})

	const ref = useRef<Peer | null>(null)
	const [retries, setRetries] = useState(0)

	// if needed for UI in future
	// const retry = useCallback(() => {
	// 	setRetries((prev) => prev + 1)
	// }, [])

	function log(peer: string, id: string, self: boolean, message: string) {
		const timestamp = Date.now()

		setLogs((prev) => {
			return {
				...prev, // keep existing message log entries
				[peer]: { // overwrite peer logs
					...(prev[peer] || {}), // keep existing message log entries of peer
					[id]: { self, message, timestamp } // append new message data
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
		})
		
		connection.on("error", () => {
			removeConnection(connection.peer)
		})
		
		connection.on("close", () => {
			removeConnection(connection.peer)
		})
		
		connection.on("data", (raw: unknown) => {
			const data = raw as IncomingData

			if (data.type == "message") {
				log(connection.peer, data.id, false, data.message)
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
			return {...prev, [peer]: logs[peer] ?? {}}
		})

		return connection
	}

	function send(peer: string, message: string) {
		let connection = connect(peer)

		const id = v4()
		const payload: IncomingMessageData = {
			type: "message",
			id, message
		}

		if (connection?.open) {
			connection.send(payload)
			log(peer, id, true, message)
		} else {
			connection?.once("open", () => {
				connection.send(payload)
				log(peer, id, true, message)
			})
		}
	}

	useEffect(() => {
		function generate() {
			const ECDSA = keygen(SignatureAlgorithm.ECDSA) as KeyPair<SignatureAlgorithm.ECDSA>
			const Ed25519 = keygen(SignatureAlgorithm.ED25519) as KeyPair<SignatureAlgorithm.ED25519>
			const keys: Keys = { ECDSA, Ed25519 }

			setKeys(keys)
			
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
					const keys: Keys = {
						ECDSA: {
							secret: SignatureAlgorithmKey.fromHex(deserialized.ecdsa.secret, "secret", SignatureAlgorithm.ECDSA),
							shared: SignatureAlgorithmKey.fromHex(deserialized.ecdsa.shared, "shared", SignatureAlgorithm.ECDSA)
						},

						Ed25519: {
							secret: SignatureAlgorithmKey.fromHex(deserialized.ed25519.secret, "secret", SignatureAlgorithm.ED25519),
							shared: SignatureAlgorithmKey.fromHex(deserialized.ed25519.shared, "shared", SignatureAlgorithm.ED25519)
						},
					}

					setKeys(keys)
				}
			} catch { generate() }
		} else generate()
	}, [])

	useEffect(() => {
		if (ref.current && !ref.current.destroyed) {
			setSelf(ref.current)

			return
		}

		let saved = localStorage.getItem("id") ?? ""

		let instance = new Peer(saved, {
			host: "localhost",
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

	return <ClientContext.Provider value={{self, id, keys, connections, logs, connect, send}}>{children}</ClientContext.Provider>
}

export { ClientContext, ClientProvider }