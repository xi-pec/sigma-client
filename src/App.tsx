import { Navigate, Route, Routes } from "react-router-dom";

import { useTheme } from "@heroui/react";

import { ClientProvider } from "@/contexts/client";

import ConversationsListPage from "@/pages/conversationslist";
import ConversationPage from "@/pages/conversation";

function App() {
  useTheme("dark")

  return (
    <ClientProvider>
      <Routes>
        <Route element={<Navigate to="/conversations" replace/>} path="/"/>
        <Route element={<ConversationsListPage />} path="/conversations" />
        <Route element={<ConversationPage />} path="/conversations/:peer" />
      </Routes>
    </ClientProvider>
  );
}

export default App;
