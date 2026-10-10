import {
  Avatar,
  Button,
  Input,
} from "@heroui/react"

import {
  ArrowRotateLeft,
  ChevronLeft,
  PaperPlane,
  Person
} from "@gravity-ui/icons"

import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import DefaultLayout from "@/layouts/default";

import { ConversationLog } from "@/components/ConversationLog";

import { useConnection } from "@/hooks/useConversation";

export default function ConversationPage() {
  const { peer } = useParams()
  const navigate = useNavigate()

  const { connected, logs, reconnect, send } = useConnection({ id: peer ?? "" })

  const [message, setMessage] = useState<string>("")
  const end = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "instant" })
  }, [])

  return (
    <DefaultLayout>
      <div className="flex flex-row items-center gap-4">
        <Button isIconOnly variant="ghost" size="sm" onPress={() => navigate("/")}>
            <ChevronLeft />
          </Button>
        <Avatar>
          <Avatar.Fallback>
            <Person />
          </Avatar.Fallback>
        </Avatar>

        <span className="text-lg">{peer}</span>
      </div>

      <div className="h-full rounded-lg overflow-y-auto scrollbar-thin">
        <ConversationLog logs={logs}/>
        <div ref={end}></div>
      </div>

      <div className="w-full grid grid-cols-[1fr_auto] gap-2">
        <Input 
          className="indent-[.5rem]" 
          fullWidth variant="secondary" 
          placeholder={connected ? "Aa" : `${peer} is unavailable.`} 
          value={connected ? message : `${peer} is unavailable.`} 
          onChange={(e) => setMessage(e.target.value)}
          disabled={!connected}
        />

        <Button 
          isIconOnly 
          onPress={() => {
            if (connected) {
              send(message)
              setMessage("")
            } else reconnect()
          }}
        >
          {
            connected ? <PaperPlane /> : <ArrowRotateLeft />
          }
        </Button>
      </div>
    </DefaultLayout>
  );
}
