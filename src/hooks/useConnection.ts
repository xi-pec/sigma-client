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
    message: string
}

function useConnection({ connection }: UseConnectionProps) {
    const [logs, setLogs] = useState<MessageLog[]>([])

    function log(self: boolean, message: string) {
        let timestamp = Date.now()

        setLogs((logs) => 
            [...logs, { self, message, timestamp }]
        )
    }

    function send(message: string) {
        let payload: IncomingData = {
            type: "message",
            message
        }

        connection.send(payload)
        log(true, message)
    }

    useEffect(() => {
        function handleData(raw: unknown) {
            let data = raw as IncomingData

            if (data.type == "message") {
                log(false, data.message)
            }
        }

        connection.on("data", handleData)

        return () => {
            connection.off("data", handleData)
        }
    }, [])

    return { logs, send }
}

export { useConnection }