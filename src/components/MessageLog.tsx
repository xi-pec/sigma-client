import { useState, useEffect } from "react"
import { DataConnection } from "peerjs"

import { Card, Chip, CloseButton, Input, Button } from "@heroui/react"

import { CircleFill, PaperPlane } from "@gravity-ui/icons"

export interface MessageLogProps {
    id: string
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

export function MessageLog({ id, connection }: MessageLogProps) {
    const [logs, setLogs] = useState<MessageLog[]>([])
    const [message, setMessage] = useState("")

    function send(message: string) {
        if (!connection) return

        let payload: IncomingData = {
            type: "message",
            message
        }

        connection.send(payload)
        setLogs((logs) => [...logs, { self: true, message, timestamp: Date.now() }])
    }
    
    useEffect(() => {
        if (!id ||!connection) return

        function handleData(raw: unknown) {
            let data = raw as IncomingData

            if (data.type == "message") {
                setLogs((logs) => [...logs, { self: false, message: data.message, timestamp: Date.now() }])
            }
        }

        connection.on("data", handleData)

        return () => {
            connection.off("data", handleData)
        }
    }, [id, connection])

    return <Card>
        <Card.Header>
            <div className="mb-2 grid grid-cols-[auto_1fr_auto]">
                <Chip color="success">
                    <CircleFill width={8}/>
                    <Chip.Label>Connected</Chip.Label>
                </Chip>

                <div />

                <CloseButton onPress={() => connection.close()}/>
            </div>

            <span className="text-muted text-sm">ID</span>
            <span>{id}</span>
        </Card.Header>

        <Card.Content>
            <span className="text-muted text-sm">MESSAGES</span>
            {
                logs.length ?
                <>
                <br />
                    {
                        logs.map((log) => {
                            if (log.self) {
                                return <div key={log.timestamp} className="p-2.5 rounded-lg bg-blue-600 max-w-[80%] ml-auto w-fit mb-2">
                                    <span className="px-4 text-xs text-blue-100 block">You</span>
                                    <span className="px-4 text-white block">{log.message}</span>
                                </div>
                            } else {
                                return <div key={log.timestamp} className="p-2.5 rounded-lg bg-neutral-800 max-w-[80%] mr-auto w-fit">
                                    <span className="px-4 text-xs text-muted block">Them</span>
                                    <span className="px-4 text-white block">{log.message}</span>
                                </div>
                            }
                        })
                    }
                </>
                :
                <span className="text-center text-muted text-xs">No messages.</span>
            }
        </Card.Content>

        <Card.Footer>
            <div className="w-full grid grid-cols-[1fr_auto] gap-2">
            <Input fullWidth variant="secondary" value={message} onChange={(e) => setMessage(e.target.value)}/>
            <Button isIconOnly onPress={() => send(message)}>
                <PaperPlane />
            </Button>
            </div>
        </Card.Footer>
    </Card>
}