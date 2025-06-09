// App.js
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { routes } from "@/routes";
import "./App.css";
import { useState } from "react";
import { FullscreenMenu } from "@/components/fullscreen-menu";

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Router>
      <div className="app-container">
        {/* Pass setIsMenuOpen down to Navbar */}
        <Navbar setIsMenuOpen={setIsMenuOpen} />
        <div className="content">
          <Routes>
            {routes.map((route) => (
              <Route path={route.url} element={<route.component />} key={route.title} />
            ))}
            {/* Fallback route for undefined paths */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          {/* Conditionally render FullscreenMenu based on isMenuOpen */}
          {isMenuOpen && (
            <div className="fixed inset-0 z-50">
              <FullscreenMenu isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
            </div>
          )}
        </div>
      </div>
    </Router>
  );
}

export default App;
