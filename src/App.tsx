import { Navigate, Route, Routes } from "react-router-dom";

import ConversationsListPage from "@/pages/conversationslist";
import ConversationPage from "@/pages/conversation";

function App() {
  return (
    <Routes>
      <Route element={<Navigate to="/conversations" replace/>} path="/"/>
      <Route element={<ConversationsListPage />} path="/conversations" />
      <Route element={<ConversationPage />} path="/conversations/:peer" />
    </Routes>
  );
}

export default App;
