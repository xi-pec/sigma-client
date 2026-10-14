import { ClientProvider } from "@/providers/ClientProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ClientProvider>{children}</ClientProvider>;
}
