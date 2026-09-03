import { useEffect, useRef, useState } from "react"
import  { Peer } from "peerjs"

function useClient() {
    const [self, setSelf] = useState<Peer | null>(null)
    const [id, setId] = useState<string | null>(null)

    const ref = useRef<Peer | null>(null)

    useEffect(() => {
        if (ref.current && !ref.current.destroyed) {
            setSelf(ref.current)
            if (ref.current.id) setId(ref.current.id)
            
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
            setId(id)

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

    return { self, id }
}

export { useClient }