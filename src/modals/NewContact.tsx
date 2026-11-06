import { useState } from "react"

import {
  Button,
  InputGroup, 
  Modal,
  Separator
} from "@heroui/react";

import {
  Handset,
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
          <Modal.Dialog className="sm:max-w-[40vh]">
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

              <div className="p-1">
                <InputGroup fullWidth variant="secondary">
                  <InputGroup.Input
                    placeholder="0912 345 6789"
                    value={peer}
                    onChange={(e) => setPeer(e.target.value)}
                  >
                  
                  </InputGroup.Input>

                  <InputGroup.Suffix className="pr-0">
                    <Button isIconOnly size="sm" className="aspect-square rounded-xl" variant="secondary" onPress={connect}>
                      <Plus />  
                    </Button>
                  </InputGroup.Suffix>
                </InputGroup>
              </div>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}