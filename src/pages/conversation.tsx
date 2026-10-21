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
import { getLatestMessage } from "@/utils/messages";

export default function ConversationPage() {
  const { peer } = useParams()
  const navigate = useNavigate()

  const connection = useConnection({ id: peer ?? "" })

  const [message, setMessage] = useState<string>("")
  const [read, setRead] = useState<boolean>(false)

  const end = useRef<HTMLDivElement | null>(null)
  const list = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!end.current) return

    end.current.scrollIntoView({ behavior: "instant" })
    
    if (!list.current) return

    const observer = new IntersectionObserver(
      ([entry]) => { setRead(entry.isIntersecting) },
      { root: list.current, threshold: 0.5 }
    )

    observer.observe(end.current)
    return () => { observer.disconnect() }
  }, [])

  useEffect(() => {
    
  }, [read, connection.logs])

  useEffect(() => {
    if (end.current && read) {
      end.current.scrollIntoView({ behavior: "instant" })
    }

    const latest = getLatestMessage(connection.logs)
    
    if (read && latest) {
      connection.read(latest[0])
    }
  }, [connection.logs, read])

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

        <span className="text-lg text-zinc-900 dark:text-zinc-100">{peer}</span>
      </div>

      <div ref={list} className="h-full rounded-lg overflow-y-auto scrollbar-thin my-4">
        <ConversationLog logs={connection.logs} seen={connection.seen}/>
        <div ref={end} className="h-px"></div>
      </div>

      <div className="w-full grid grid-cols-[1fr_auto] gap-2">
        <Input 
          className="indent-[.5rem]" 
          fullWidth variant="secondary" 
          placeholder={connection.connected ? "Aa" : `${peer} is unavailable.`} 
          value={connection.connected ? message : `${peer} is unavailable.`} 
          onChange={(e) => setMessage(e.target.value)}
          disabled={!connection.connected}
        />

        <Button 
          isIconOnly 
          onPress={() => {
            if (connection.connected) {
              connection.send(message)
              setMessage("")
            } else connection.reconnect()
          }}
        >
          {
            connection.connected ? <PaperPlane /> : <ArrowRotateLeft />
          }
        </Button>
      </div>
    </DefaultLayout>
  );
}
