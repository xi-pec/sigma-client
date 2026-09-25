import { Route, Routes } from "react-router-dom";

import { useTheme } from "@heroui/react";

import { ClientProvider } from "@/contexts/client";

import IndexPage from "@/pages/index";
import ConversationPage from "@/pages/conversation";

function App() {
  useTheme("dark")

  return (
    <ClientProvider>
      <Routes>
        <Route element={<IndexPage />} path="/" />
        <Route element={<ConversationPage />} path="/conversation/:peer" />
      </Routes>
    </ClientProvider>
  );
}

export default App;
