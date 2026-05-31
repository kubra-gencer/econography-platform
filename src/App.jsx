import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import Navbar from "./components/layout/Navbar";
import LoadingScreen from "./components/layout/LoadingScreen";

import BTCPage from "./pages/BTCPage";
import ArtSpacePage from "./pages/ArtSpacePage";
import ResearchPage from "./pages/ResearchPage";

export default function App() {
  return (
    <BrowserRouter>
      <LoadingScreen />
      <Navbar />
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -18, filter: "blur(10px)" }}
        transition={{ duration: 0.82, ease: [0.76, 0, 0.24, 1] }}
        className="site-main"
      >
        <Routes location={location}>
          <Route path="/" element={<BTCPage />} />
          <Route path="/btc" element={<BTCPage />} />
          <Route path="/art-space" element={<ArtSpacePage />} />
          <Route path="/research" element={<ResearchPage />} />
          <Route path="*" element={<BTCPage />} />
        </Routes>
      </motion.main>
    </AnimatePresence>
  );
}