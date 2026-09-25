import { useContext } from "react"

import { ClientContext } from "@/contexts/client"

function useClient() {
    return useContext(ClientContext)
}

export { useClient }