import { useEffect, useRef, useState, createContext, ReactNode } from "react";
import  { DataConnection, Peer } from "peerjs"
import { v4 } from "uuid";

const ClientContext = createContext<{
	self: Peer | null,
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
	const [connections, setConnections] = useState<Map<string, DataConnection>>(new Map())
	const [logs, setLogs] = useState<Record<string, Record<string, MessageLog>>>(() => {
		try {
			const saved = localStorage.getItem("chat_logs")
			return saved ? JSON.parse(saved) : {}
		} catch { return {} }
	})

	const ref = useRef<Peer | null>(null)

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

	function handleConnection(connection: DataConnection) {
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
	}
	
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
			localStorage.setItem("id", id)
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
	}, [])

	useEffect(() => {
		localStorage.setItem("chat_logs", JSON.stringify(logs))
	}, [logs])

	return <ClientContext.Provider value={{self, connections, logs, connect, send}}>{children}</ClientContext.Provider>
}

export { ClientContext, ClientProvider }