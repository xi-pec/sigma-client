import { ClientProvider } from "@/providers/ClientProvider";
import { SIGMAProvider } from "@/providers/SIGMAProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <>
    <SIGMAProvider>
      <ClientProvider>
        {children}
      </ClientProvider>
    </SIGMAProvider>
  </>
}
