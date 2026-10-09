import { useState } from "react";

import {
  Avatar,
  Button,
  Input,
} from "@heroui/react"

import {
  PaperPlane,
  Person
} from "@gravity-ui/icons"

import { useParams } from "react-router-dom";

import DefaultLayout from "@/layouts/default";

import { ConversationLog } from "@/components/ConversationLog";

import { useConnection } from "@/hooks/useConversation";

export default function ConversationPage() {
  const { peer } = useParams()

  const { logs, send } = useConnection({ id: peer ?? "" })

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
        <Input fullWidth variant="secondary" value={message} onChange={(e) => setMessage(e.target.value)}/>
        <Button isIconOnly onPress={() => send(message)}>
            <PaperPlane />
        </Button>
      </div>
    </DefaultLayout>
  );
}
