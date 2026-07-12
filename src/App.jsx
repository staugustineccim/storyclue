import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LandingPage from "./components/LandingPage";
import PuzzleGenerator from "./components/PuzzleGenerator";
import CrosswordPuzzle from "./components/CrosswordPuzzle";
import AdminDashboard from "./components/AdminDashboard";
import ChurchMode from "./components/ChurchMode";
import ChurchSignup from "./components/ChurchSignup";
import NotFound from "./components/NotFound";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/create" element={<PuzzleGenerator />} />
        <Route path="/play" element={<CrosswordPuzzle />} />
        <Route path="/play/:slug" element={<CrosswordPuzzle />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/church" element={<ChurchMode />} />
        <Route path="/church/setup" element={<ChurchSignup />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}
