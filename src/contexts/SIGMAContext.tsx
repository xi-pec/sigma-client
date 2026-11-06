import { createContext, RefObject } from "react";

import { Keys, KeyPairs } from "@/providers/SIGMAProvider";

const SIGMAContext = createContext<{
  enabled: boolean
  algorithm: "ecdsa" | "ed25519" | null
  keypair: RefObject<KeyPairs | null>
  keys: RefObject<Map<string, Keys>>
  toggle: (enabled?: boolean) => void
  use: (algorithm: "ecdsa" | "ed25519" | null) => void
  register: (id: string, shared: Keys) => void
} | null>(null)

export { SIGMAContext }