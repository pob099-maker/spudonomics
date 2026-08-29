import { HashRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CalculatorPage } from "./pages/CalculatorPage";
import { SourcesPage } from "./pages/SourcesPage";
import { ContributePage } from "./pages/ContributePage";

export function App() {
  return (
    <ThemeProvider>
      {/*
        Hash routing, as in Fieldwork: a static host answers an unknown deep
        path with a 404 before any fallback runs, which makes a shared link look
        broken. Everything after the # never reaches the server.
      */}
      <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Layout>
          <Routes>
            <Route path="/" element={<CalculatorPage />} />
            <Route path="/sources" element={<SourcesPage />} />
            <Route path="/contribute" element={<ContributePage />} />
            <Route path="/survey/:regionId/:segmentId" element={<ContributePage />} />
          </Routes>
        </Layout>
      </HashRouter>
    </ThemeProvider>
  );
}
