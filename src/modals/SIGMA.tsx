import { useEffect, useState } from "react"

import {
  Button,
  Description,
  Input,
  InputGroup,
  Key as Algorithm,
  Label,
  ListBox,
  Modal,
  Select,
  Separator,
  Switch,
  SwitchGroup,
  TextArea,
  TextField
} from "@heroui/react"

import {
  ArrowRotateLeft,
  Dice5,
  Key,
  Lock,
  Shield
} from "@gravity-ui/icons"

import { bytesToHex, hexToBytes } from "@noble/curves/utils.js"
import { keygen, SignatureAlgorithm, SignatureAlgorithmSecretKey, SignatureAlgorithmSharedKey } from "sigma-protocol"
import { useParams } from "react-router-dom"

import { useSIGMA } from "@/hooks/useSIGMA"
import { p256 } from "@noble/curves/nist.js"
import { ed25519 } from "@noble/curves/ed25519.js"
import { useClient } from "@/hooks/useClient"

const encoder = new TextEncoder()

export function SignatureEditor({ children }: { children: React.ReactNode }) {
  const algorithms = [
    { id: "ecdsa", name: "ECDSA" },
    { id: "ed25519", name: "ED25519" },
  ] as const

  const { peer } = useParams()

  const client = useClient()
  const sigma = useSIGMA()

  const [enabled, setEnabled] = useState<boolean>(false)
  const [algorithm, setAlgorithm] = useState<Algorithm | null>(null)
  const [shared, setShared] = useState<SignatureAlgorithmSharedKey | null>(null)
  const [secret, setSecret] = useState<SignatureAlgorithmSecretKey | null>(null)
  const [message, setMessage] = useState<string>("")
  const [signature, setSignature] = useState<string>("")

  function generate() {
    let selected = algorithms.find((s) => s.id == algorithm)?.id
    if (!selected || !sigma.keypair.current) return

    let algo = {
      "ecdsa": SignatureAlgorithm.ECDSA,
      "ed25519": SignatureAlgorithm.ED25519
    }[selected]

    let keypair = keygen(algo)
    setShared(keypair.shared as SignatureAlgorithmSharedKey)
    setSecret(keypair.secret as SignatureAlgorithmSecretKey)
  }

  function reset() {
    let selected = algorithms.find((s) => s.id == algorithm)?.id
    if (!selected || !sigma.keypair.current) return

    let keypair = {
      "ecdsa": sigma.keypair.current?.ECDSA,
      "ed25519": sigma.keypair.current?.Ed25519
    }[selected]
    if (!keypair) return 

    setShared(keypair.shared)
    setSecret(keypair.secret)
  }

  function send() {
    if (!peer) return

    client.send(peer, message, hexToBytes(signature))
  }

  useEffect(() => {
    sigma.toggle(enabled)
  }, [enabled])

  useEffect(() => {
    let selected = algorithms.find((s) => s.id == algorithm)?.id
    if (!selected || !sigma.keypair.current) return

    sigma.use(selected)

    let keypair = {
      "ecdsa": sigma.keypair.current.ECDSA,
      "ed25519": sigma.keypair.current.Ed25519
    }[selected]

    setShared(keypair.shared)
    setSecret(keypair.secret)
  }, [algorithm])

  useEffect(() => {
    let selected = algorithms.find((s) => s.id == algorithm)?.id
    if (!selected || !secret) return

    let algo = {
      "ecdsa": p256,
      "ed25519": ed25519
    }[selected]

    const payload = encoder.encode(message)
    const signature = algo.sign(payload, secret.key)

    setSignature(bytesToHex(signature))
  }, [message])

  return (
    <Modal>
      <Modal.Trigger>
        {children}
      </Modal.Trigger>

      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[40vh]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading className="flex flex-row items-center gap-2">
                <Shield />
                SIGMA
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="p-1">
              <div className="mt-1 mb-2 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <Separator className="w-full" />
                <span className="text-xs font-medium">TOGGLES</span>
                <Separator className="w-full" />
              </div>

              <SwitchGroup className="mb-2">
                <Switch isSelected={enabled} onChange={setEnabled}>
                  <Switch.Content className="w-full grid grid-cols-[1fr_auto] gap-2">
                    Enable SIGMA
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch.Content>
                </Switch>
              </SwitchGroup>

              <div className="grid grid-cols-[1fr_auto] items-center">
                Signing Algorithm

                <Select
                  placeholder="Select one"
                  variant="secondary"
                  value={algorithm}
                  onChange={(value) => setAlgorithm(value)}
                  isDisabled={!enabled}
                >
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {algorithms.map((algorithm) => (
                        <ListBox.Item key={algorithm.id} id={algorithm.id} textValue={algorithm.name}>
                          {algorithm.name}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              </div>

              <div className="my-2 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <Separator className="w-full" />
                <span className="text-xs font-medium">ATTACKER MODE</span>
                <Separator className="w-full" />
              </div>
                
              <div className="grid gap-2">
                <TextField>
                  <Label className="text-xs text-muted">PUBLIC</Label>
                  <InputGroup fullWidth variant="secondary" isDisabled={!enabled || !algorithm}>
                    <InputGroup.Prefix>
                      <Lock />
                    </InputGroup.Prefix>

                    <InputGroup.Input
                      disabled
                      value={shared ? bytesToHex(shared.key) : ""}
                    />
                  </InputGroup>
                </TextField>

                <TextField>
                  <Label className="text-xs text-muted">PRIVATE</Label>
                  <InputGroup fullWidth variant="secondary" isDisabled={!enabled || !algorithm}>
                    <InputGroup.Prefix>
                      <Key />
                    </InputGroup.Prefix>

                    <InputGroup.Input
                      disabled
                      value={secret ? bytesToHex(secret.key) : ""}
                    />
                  </InputGroup>
                </TextField>

                <div className="grid grid-cols-[1fr_auto_auto]">
                  <Description className="mb-2 grid grid-cols-[auto_1fr] gap-1">
                    <span className="text-danger">*</span>
                    <span>edits made here are temporary.</span>
                  </Description>

                  <Button 
                    className="rounded-xl aspect-square"
                    fullWidth
                    isIconOnly
                    variant="ghost"
                    isDisabled={!enabled || !algorithm}
                    onPress={generate}
                  >
                    <Dice5 />
                  </Button>

                  <Button 
                    className="rounded-xl aspect-square"
                    fullWidth
                    isIconOnly
                    variant="ghost"
                    isDisabled={!enabled || !algorithm}
                    onPress={reset}
                  >
                    <ArrowRotateLeft />
                  </Button>
                </div>
             
              </div>

              <div className="grid gap-2">
                <TextField>
                  <Label className="text-xs text-muted">MESSAGE</Label>
                  <Input 
                    className="indent-[.5rem]" 
                    fullWidth variant="secondary" 
                    placeholder="Aa"
                    disabled={!enabled || !algorithm}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </TextField>

                <TextField>
                  <Label className="text-xs text-muted">SIGNATURE</Label>
                  <TextArea 
                    fullWidth
                    variant="secondary"
                    wrap="soft"
                    style={{resize: "none"}}
                    rows={3}
                    disabled={!enabled || !algorithm}
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    onBlur={() => signature.length % 2 && setSignature((prev) => prev + "0")}
                  />
                </TextField>
                
                <Button 
                  className="mt-2 rounded-xl"
                  fullWidth
                  isDisabled={!enabled || !algorithm}
                  onPress={() => send()}
                >Send</Button>
              </div>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}