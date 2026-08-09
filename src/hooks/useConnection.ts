import { v4 } from "uuid"
import { useEffect, useState } from "react"
import { DataConnection } from "peerjs"

interface UseConnectionProps {
    connection: DataConnection
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

function useConnection({ connection }: UseConnectionProps) {
    const [logs, setLogs] = useState<Record<string, MessageLog>>({})

    function log(self: boolean, id: string, message: string) {
        let timestamp = Date.now()

        setLogs((prev) => 
            ({...prev, [id]: { self, message, timestamp }})
        )
    }

    function send(message: string) {
        let id = v4()
        let payload: IncomingData = {
            type: "message",
            id, message
        }

        connection.send(payload)
        log(true, id, message)
    }

    function receive(raw: unknown) {
        let data = raw as IncomingData

        if (data.type == "message") {
            log(false, data.id, data.message)
        }
    }

    useEffect(() => {
        connection.on("data", receive)

        return () => {
            connection.off("data", receive)
        }
    }, [])

    return { logs, send }
}

export { useConnection }