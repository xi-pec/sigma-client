import { useState } from "react"
import { DataConnection } from "peerjs"
import { Card, Chip, CloseButton, Input, Button } from "@heroui/react"
import { CircleFill, PaperPlane } from "@gravity-ui/icons"

import { useConnection } from "@/hooks/useConnection"

export interface MessageLogProps {
    connection: DataConnection
}

export function MessageLog({ connection }: MessageLogProps) {
    const { logs, send } = useConnection({ connection })

    const [message, setMessage] = useState("")

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
            <span>{connection.peer}</span>
        </Card.Header>

        <Card.Content>
            <span className="text-muted text-sm">MESSAGES</span>
            {
                logs.length ?
                logs.map((log) => {
                    return <div key={log.timestamp} className={`p-2.5 rounded-lg max-w-[80%] w-fit ${log.self ? "ml-auto bg-blue-600": "mr-auto bg-neutral-800"}`}>
                        <span className={`px-4 text-xs ${log.self ? "text-blue-100" : "text-muted"} block`}>{log.self ? "You" : "Them"}</span>
                        <span className="px-4 text-white block">{log.message}</span>
                    </div>
                })
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