import { ClientProvider } from "@/contexts/client";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ClientProvider>{children}</ClientProvider>;
}
