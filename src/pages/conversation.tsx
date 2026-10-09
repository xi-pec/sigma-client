import { useState } from "react";

import {
  Avatar,
  Button,
  Input,
} from "@heroui/react"

import {
  ArrowRotateLeft,
  PaperPlane,
  Person
} from "@gravity-ui/icons"

import { useParams } from "react-router-dom";

import DefaultLayout from "@/layouts/default";

import { ConversationLog } from "@/components/ConversationLog";

import { useConnection } from "@/hooks/useConversation";

export default function ConversationPage() {
  const { peer } = useParams()

  const { connected, logs, reconnect, send } = useConnection({ id: peer ?? "" })

  const [message, setMessage] = useState<string>("")

  return (
    <DefaultLayout>
      <div className="flex flex-row items-center gap-4">
        <Avatar>
          <Avatar.Fallback>
            <Person />
          </Avatar.Fallback>
        </Avatar>

        <span className="text-lg">{peer}</span>
      </div>

      <div className="h-full rounded-lg overflow-y-auto scrollbar-thin">
        <ConversationLog logs={logs}/>
      </div>

      <div className="w-full grid grid-cols-[1fr_auto] gap-2">
        <Input 
          className="indent-[.5rem]" 
          fullWidth variant="secondary" 
          placeholder={connected ? "Aa" : `${peer} is offline.`} 
          value={connected ? message : `${peer} is offline.`} 
          onChange={(e) => setMessage(e.target.value)}
          disabled={!connected}
        />

        <Button 
          isIconOnly 
          onPress={() => connected? send(message) : reconnect() }
        >
          {
            connected ? <PaperPlane /> : <ArrowRotateLeft />
          }
        </Button>
      </div>
    </DefaultLayout>
  );
}
