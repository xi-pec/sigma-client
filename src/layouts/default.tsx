// import { Navbar } from "@/components/navbar";
import { ThemeSwitch } from "@/components/ThemeSwitch";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col h-screen">
      {/* <Navbar /> */}
      
      <div className="fixed right-[1rem] top-[1rem]">
        <ThemeSwitch />
      </div>

      <main className="container mx-auto max-w-7xl flex-grow h-full grid flex flex-col items-center justify-center">
        <div className="h-full aspect-[1/2] flex flex-col gap-4 overflow-hidden min-w-0 p-6">
          {children}
        </div>
      </main>
      {/* <footer className="w-full flex items-center justify-center py-3">
        <a
          className="flex items-center gap-1 text-current no-underline"
          href="https://heroui.com?utm_source=vite-template"
          rel="noopener noreferrer"
          target="_blank"
        >
          <span className="text-muted">Powered by</span>
          <p className="text-accent">HeroUI</p>
        </a>
      </footer> */}
    </div>
  );
}
