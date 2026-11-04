import { 
  Avatar,
  Button
} from "@heroui/react"

import {
  Gear,
  Person,
  Plus,
} from "@gravity-ui/icons"

import { useNavigate } from "react-router-dom";

import DefaultLayout from "@/layouts/default";
import { useClient } from "@/hooks/useClient"
import { Timestamp } from "@/components/Timestamp";
import { NewContactModal } from "@/modals/NewContact";
import { SettingsModal }from "@/modals/Settings";
import { getLatestMessage, getUnread } from "@/utils/messages";

export default function ConversationsListPage() {
  const client = useClient()
  const navigate = useNavigate()

  return (
    <DefaultLayout>
      <div className="grid grid-cols-[1fr_auto]">
        <div>
          <h1 className="text-3xl font-bold">Messaging</h1>
          <h2 className="text-lg font-light text-accent">{getUnread(client.logs, client.seen)} unread</h2>
        </div>

        <div>
          <NewContactModal>
            <Button variant="ghost" isIconOnly={true}>
              <Plus />
            </Button>
          </NewContactModal>
          
          <SettingsModal>
            <Button variant="ghost" isIconOnly={true}>
              <Gear />
            </Button>
          </SettingsModal>
        </div>
      </div>

      <div className="w-full overflow-y-scroll scrollbar-thin">
        {
          Object.entries(client.logs).map(([id, logs]) => (
            <div key={id} className="m-1 p-2 rounded-xl grid grid-cols-[auto_1fr] gap-4 hover:bg-zinc-200 dark:hover:bg-zinc-800 duration-200 ease-in-out" onClick={() => navigate(`/conversations/${id}`)}>
              <Avatar size="lg">
                <Avatar.Fallback><Person /></Avatar.Fallback> 
              </Avatar>

              <div className="min-w-0">
                <span>{id}</span>

                <br />

                {(() => {
                  const log = getLatestMessage(logs);

                  if (!log) {
                    return <span className="text-sm text-neutral-500">No messages.</span>;
                  }

                  return (
                    <div className="pr-2 flex items-center justify-between text-neutral-500 text-sm gap-2">
                      <span className={`truncate ${client.seen[id] != log[0] ? "font-semibold text-foreground" : ""}`}>
                        {log[1].self ? "You" : "Them"}: {log[1].message}
                      </span>
                      <Timestamp className="shrink-0" timestamp={log[1].timestamp!} />
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
