import { useState } from "react"

import {
  Avatar,
  Button,
  Input, 
  Modal,
  Separator
} from "@heroui/react";

import {
  Handset,
  Person,
  Plus
} from "@gravity-ui/icons"

import { useClient } from "@/hooks/useClient"

export function NewContactModal({ children }: { children: React.ReactNode }) {
  const client = useClient()

  const [open, setOpen] = useState<boolean>(false)
  const [peer, setPeer] = useState<string>("")

  function connect() {
    if (!peer) return setOpen(false)

    client.connect(peer)
    setPeer("")
    setOpen(false)
  }

  return (
    <Modal isOpen={open} onOpenChange={setOpen}>
      <Modal.Trigger>
        {children}
      </Modal.Trigger>

      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[360px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading className="flex flex-row items-center gap-2">
                <Handset />
                Contacts
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div className="mt-1 mb-2 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <Separator className="w-full" />
                <span className="text-xs font-medium">ADD</span>
                <Separator className="w-full" />
              </div>

              <div className="p-1 grid grid-cols-[auto_1fr_auto] gap-2">
                <Avatar variant="soft">
                  <Person />
                </Avatar>

                <Input 
                  variant="secondary"
                  placeholder="0912 345 6789"
                  value={peer}
                  onChange={(e) => setPeer(e.target.value)}
                />

                <Button isIconOnly className="aspect-square rounded-xl" variant="primary" onPress={connect}>
                  <Plus />  
                </Button>
              </div>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}