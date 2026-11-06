import { useEffect, useState } from "react"

import {
  Description,
  Input,
  Modal,
  Separator,
  Switch,
  SwitchGroup,
  useTheme
} from "@heroui/react";

import {
  Gear
} from "@gravity-ui/icons"

import { useClient } from "@/hooks/useClient"

export function SettingsModal({ children }: { children: React.ReactNode }) {
  const client = useClient()
  const theme = useTheme() 

  const [open, setOpen] = useState<boolean>(false)
  const [id, setId] = useState<string>(client.id ?? "...")

  useEffect(() => {
    setId(client.id ?? "...")
  }, [client.id])

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
                <Gear />
                Settings
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="p-1">
              <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <Separator className="w-full" />
                <span className="text-xs font-medium">TOGGLES</span>
                <Separator className="w-full" />
              </div>

              <SwitchGroup>
                <Switch name="theme" isSelected={theme.theme == "dark"} onChange={(selected) => theme.setTheme(selected ? "dark" : "light")}>
                  <Switch.Content className="w-full grid grid-cols-[1fr_auto] gap-2">
                    Dark Mode
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch.Content>
                </Switch>
              </SwitchGroup>

              <div className="my-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <Separator className="w-full" />
                <span className="text-xs font-medium">FIELDS</span>
                <Separator className="w-full" />
              </div>

              <div className="grid grid-cols-[1fr_auto] items-center">
                ID
                <Input
                  variant="secondary"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  onBlur={(e) => localStorage.setItem("id", e.target.value)}
                />
                
                <br />

                <Description>
                  <span className="text-danger">*</span> changes will take effect upon reload.
                </Description>
              </div>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}