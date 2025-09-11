import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MysteryGenerator from "./components/MysteryGenerator";
import MysteryLoader from "./components/MysteryLoader";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MysteryGenerator />} />
        <Route path="/case/:id" element={<MysteryLoader />} />
      </Routes>
    </Router>
  );
}
