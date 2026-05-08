import { Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import PuzzleGenerator from "./components/PuzzleGenerator";
import CrosswordPuzzle from "./components/CrosswordPuzzle";
import NotFound from "./components/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/create" element={<PuzzleGenerator />} />
      <Route path="/play" element={<CrosswordPuzzle />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
