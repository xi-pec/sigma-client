import { 
  Avatar,
  Button,
  Card,
  Input,
  Separator,
} from "@heroui/react"

import {
  Person,
  PlugConnection,
} from "@gravity-ui/icons"

import { useState } from "react"
import { useNavigate } from "react-router-dom";

import DefaultLayout from "@/layouts/default";

import { useClient } from "@/hooks/useClient"
import { MessageLog } from "@/hooks/useConversation";
import { Timestamp } from "@/components/Timestamp";

export default function ConversationsListPage() {
  const client = useClient()
  const navigate = useNavigate()

  const [peer, setPeer] = useState<string>("")

  function getLatestMessage(logs: Record<string, MessageLog>): MessageLog | null {
    const entries = Object.entries(logs)

    let recent = null
    for (const entry of entries) {
      if (!recent || !entry[1].timestamp || !recent[1].timestamp || entry[1].timestamp > recent[1].timestamp) 
        recent = entry
    }

    return recent ? recent[1] : null
  }

  return (
    <DefaultLayout>
      <Card className="w-full" variant="transparent">
        <Card.Header>
          <span className="text-muted text-sm">ID</span>
          <span>{client.id ?? "..."}</span>
        </Card.Header>

        <Card.Content>
          <span className="text-muted text-sm">CONNECT</span>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Input value={peer} onChange={(e) => setPeer(e.target.value)}/>
            <Button isIconOnly onPress={() => client.connect(peer)}>
              <PlugConnection />
            </Button>
          </div>
        </Card.Content>
      </Card>

      <Separator />

      <div className="w-full">
        {
          Object.entries(client.logs).map(([id, logs]) => (
            <div key={id} className="p-2 rounded-xl grid grid-cols-[auto_1fr] gap-4 hover:bg-default" onClick={() => navigate(`/conversations/${id}`)}>
              <Avatar size="lg">
                <Avatar.Fallback><Person /></Avatar.Fallback> 
              </Avatar>

              <div className="min-w-0">
                <span>{id}</span>

                <br />

                {(() => {
                  const log = getLatestMessage(logs);

                  if (!log) {
                    return <span className="text-sm text-muted">No messages.</span>;
                  }

                  return (
                    <div className="flex items-center justify-between text-muted text-sm gap-2">
                      <span className="truncate">
                        {log.self ? "You" : "Them"}: {log.message}
                      </span>
                      <Timestamp className="shrink-0" timestamp={log.timestamp!} />
                    </div>
                  );
                })()}
              </div>
            </div>
          ))
        }
      </div>
    </DefaultLayout>
  );
}
