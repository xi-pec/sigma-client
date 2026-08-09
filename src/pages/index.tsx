import { 
  Card,
  Separator,
  Input,
  Button,
} from "@heroui/react"

import {
  PlugConnection,
} from "@gravity-ui/icons"

import { useEffect, useState } from "react";
import { DataConnection } from "peerjs";

import DefaultLayout from "@/layouts/default";

import { useClient } from "@/hooks/useClient"

import { MessageLog } from "@/components/MessageLog";

export default function IndexPage() {
  const { self, id } = useClient()

  const [connections, setConnections] = useState<Record<string, DataConnection>>({})
  const [peer, setPeer] = useState("")

  useEffect(() => {
    if (!self) return

    function handleConnection(connection: DataConnection) {
      let id = connection.peer
      setConnections((prev) => ({ ...prev, [id]: connection }))

      connection.on("open", () => {
        console.log(`Connection to ${id} open`)
        setConnections((prev) => ({ ...prev, [id]: connection }))
      })

      connection.on("close", () => {
        console.log(`Connection to ${id} closed`)
        setConnections((prev) => {
          const next = { ...prev }
          delete next[id]
          return next
        })
      })
    }

    self.on("connection", handleConnection)

    return () => {
      self.off("connection", handleConnection)
    }
  }, [self])

  function connect(id: string) {
    id = id.trim()
    if (!self || connections[id] || self.id == id) return

    const connection = self.connect(id)

    connection.on("open", () => {
      console.log(`Connection to ${id} open`)
      setConnections((prev) => ({ ...prev, [id]: connection }))
    })

    connection.on("close", () => {
      console.log(`Connection to ${id} closed`)
      setConnections((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    })
  }

  return (
    <DefaultLayout>
      <div className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <Card className="w-full" variant="transparent">
          <Card.Header>
            <span className="text-muted text-sm">ID</span>
            <span>{id}</span>
          </Card.Header>

          <Card.Content>
            <span className="text-muted text-sm">CONNECT</span>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Input value={peer} onChange={(e) => setPeer(e.target.value)}/>
              <Button isIconOnly onPress={() => connect(peer)}>
                <PlugConnection />
              </Button>
            </div>
          </Card.Content>
        </Card>

        <Separator />

        <div className="w-full">
          {
            Object.entries(connections).map(([id, connection]) => (
              <MessageLog key={id} id={id} connection={connection}/>
            ))
          }
        </div>
      </div>
    </DefaultLayout>
  );
}
