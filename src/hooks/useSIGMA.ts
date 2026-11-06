import { useContext } from "react"

import { SIGMAContext } from "@/contexts/SIGMAContext"

function useSIGMA() {
  const context = useContext(SIGMAContext)

  if (!context) {
    throw new Error("useSIGMA must be used within a SIGMAProvider")
  }

  return context
}

export { useSIGMA }