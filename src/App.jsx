import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LandingPage from "./components/LandingPage";
import PuzzleGenerator from "./components/PuzzleGenerator";
import CrosswordPuzzle from "./components/CrosswordPuzzle";
import AdminDashboard from "./components/AdminDashboard";
import TermsPage from "./components/TermsPage";
import NotFound from "./components/NotFound";
import ClassicTest from "./pages/ClassicTest";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/create" element={<PuzzleGenerator />} />
        <Route path="/play" element={<CrosswordPuzzle />} />
        <Route path="/play/:slug" element={<CrosswordPuzzle />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/classic-test" element={<ClassicTest />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}
