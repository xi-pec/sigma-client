import { useEffect, useRef, useState, createContext, ReactNode } from "react";
import  { Peer } from "peerjs"

const ClientContext = createContext<Peer | null>(null)

interface ClientProviderProps {
    children: ReactNode
}

function ClientProvider({ children }: ClientProviderProps) {
    const [self, setSelf] = useState<Peer | null>(null)

    const ref = useRef<Peer | null>(null)

    useEffect(() => {
        if (ref.current && !ref.current.destroyed) {
            setSelf(ref.current)

            return
        }

        let saved = localStorage.getItem("id") ?? ""

        let instance = new Peer(saved, {
            host: "localhost",
            port: 9000,
            path: "/peer/",
            debug: 3
        })

        ref.current = instance

        instance.on("open", (id: string) => {
            localStorage.setItem("id", id)
        })

        setSelf(instance)

        const handleUnload = () => {
            if (ref.current) {
                ref.current.destroy()
            }
        }

        window.addEventListener("beforeunload", handleUnload)
        return () => {
            window.removeEventListener("beforeunload", handleUnload)

            instance.destroy()
            ref.current = null
        }
    }, [])

    return <ClientContext.Provider value={self}>{children}</ClientContext.Provider>
}

export { ClientContext, ClientProvider }