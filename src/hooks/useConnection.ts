import { v4 } from "uuid"
import { useEffect, useRef, useState } from "react"
import { DataConnection } from "peerjs"

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
    const connection = useRef<DataConnection | null>(null);
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

        connection.current?.send(payload)
        log(true, id, message)
    }

    function receive(raw: unknown) {
        let data = raw as IncomingData

        if (data.type == "message") {
            log(false, data.id, data.message)
        }
    }

    useEffect(() => {
        const instance = client?.connect(id)
        if (instance) {
            connection.current = instance
        }

        instance?.once("open", () => {
            console.log(`Connection to ${id} open`)
        })

        instance?.once("close", () => {
            console.log(`Connection to ${id} closed`)
        })

        instance?.on("data", receive)

        return () => {
            instance?.off("data", receive)
        }
    }, [])

    return { logs, send }
}

export { useConnection }