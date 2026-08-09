import { Route, Routes } from "react-router-dom";

import { useTheme } from "@heroui/react";

import IndexPage from "@/pages/index";

function App() {
  useTheme("dark")

  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
    </Routes>
  );
}

export default App;
