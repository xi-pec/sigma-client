import { SIGMAContext } from "@/contexts/SIGMAContext";
import { ReactNode, useState, useRef, useEffect } from "react";

import {
  SignatureAlgorithm, SignatureAlgorithmKey,
  SignatureAlgorithmSecretKey, SignatureAlgorithmSharedKey,
  keygen
} from "sigma-protocol"

export type KeyPair<A extends SignatureAlgorithm> = { 
  secret: SignatureAlgorithmSecretKey<A>,
  shared: SignatureAlgorithmSharedKey<A>
}

export type KeyPairs = { 
  ECDSA: KeyPair<SignatureAlgorithm.ECDSA>
  Ed25519: KeyPair<SignatureAlgorithm.ED25519>
}

export type Keys = {
  ECDSA: SignatureAlgorithmSharedKey<SignatureAlgorithm.ECDSA>
  Ed25519: SignatureAlgorithmSharedKey<SignatureAlgorithm.ED25519>
}

interface SIGMAProviderProps {
  children: ReactNode
}

function SIGMAProvider({ children }: SIGMAProviderProps) {
  let [enabled, setEnabled] = useState<boolean>(false)
  let [algorithm, setAlgorithm] = useState<"ecdsa" | "ed25519" | null>(null)
  const keypair = useRef<KeyPairs | null>(null)
  const keys = useRef(new Map<string, Keys>())

  function toggle(enabled?: boolean) {
    enabled == null ? setEnabled((prev) => !prev) : setEnabled(enabled)
  }

  function use(algorithm: "ecdsa" | "ed25519" | null) {
    setAlgorithm(algorithm)
  }

  function register(id: string, shared: Keys) {
    keys.current.set(id, shared)
  }

  useEffect(() => {
    function generate() {
      const ECDSA = keygen(SignatureAlgorithm.ECDSA) as KeyPair<SignatureAlgorithm.ECDSA>
      const Ed25519 = keygen(SignatureAlgorithm.ED25519) as KeyPair<SignatureAlgorithm.ED25519>
      const keys: KeyPairs = { ECDSA, Ed25519 }

      keypair.current = keys
      
      const serialized = JSON.stringify({
        ecdsa: {
          secret: ECDSA.secret.toHex(),
          shared: ECDSA.shared.toHex()
        },

        ed25519: {
          secret: Ed25519.secret.toHex(),
          shared: Ed25519.shared.toHex()
        }
      })

      localStorage.setItem("keypairs", serialized)
    }

    const saved = localStorage.getItem("keypairs")
    if (saved) {
      try {
        const deserialized: {
          ecdsa: { secret: string, shared: string },
          ed25519: { secret: string, shared: string }
        } = JSON.parse(saved)
        
        if (
          !deserialized.ecdsa || !deserialized.ed25519 ||
          !deserialized.ecdsa.secret || !deserialized.ecdsa.shared ||
          !deserialized.ed25519.secret || !deserialized.ed25519.shared
        ) { generate() } else {
          const keys: KeyPairs = {
            ECDSA: {
              secret: SignatureAlgorithmKey.fromHex(deserialized.ecdsa.secret, "secret", SignatureAlgorithm.ECDSA),
              shared: SignatureAlgorithmKey.fromHex(deserialized.ecdsa.shared, "shared", SignatureAlgorithm.ECDSA)
            },

            Ed25519: {
              secret: SignatureAlgorithmKey.fromHex(deserialized.ed25519.secret, "secret", SignatureAlgorithm.ED25519),
              shared: SignatureAlgorithmKey.fromHex(deserialized.ed25519.shared, "shared", SignatureAlgorithm.ED25519)
            },
          }

          keypair.current = keys
        }
      } catch { generate() }
    } else generate()
  }, [])

  return <SIGMAContext.Provider value={{enabled, algorithm, keypair, keys, toggle, use, register}}>{children}</SIGMAContext.Provider>
}

export { SIGMAProvider }