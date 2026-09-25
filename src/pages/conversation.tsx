import { useState } from "react";

import {
  Input,
  Button
} from "@heroui/react"

import {
  PaperPlane
} from "@gravity-ui/icons"

import { useParams } from "react-router-dom";

import { 
  Avatar
} from "@heroui/react"


import DefaultLayout from "@/layouts/default";

import { ConversationLog } from "@/components/ConversationLog";

import { useConnection } from "@/hooks/useConnection";

export default function ConversationPage() {
  const { peer } = useParams()

  const { logs, send } = useConnection({ id: peer ?? "" })

  const [message, setMessage] = useState<string>("")

  return (
    <DefaultLayout>
      <div className="flex flex-row items-center gap-4">
        <Avatar>
          <Avatar.Image src=""/>
          <Avatar.Fallback>
            <span className="text-lg text-muted font-black">R</span>
          </Avatar.Fallback>
        </Avatar>

        <span className="text-lg">Rice Shower</span>
      </div>

      <ConversationLog logs={logs}/>

      <div className="w-full grid grid-cols-[1fr_auto] gap-2">
        <Input fullWidth variant="secondary" value={message} onChange={(e) => setMessage(e.target.value)}/>
        <Button isIconOnly onPress={() => send(message)}>
            <PaperPlane />
        </Button>
      </div>
    </DefaultLayout>
  );
}
