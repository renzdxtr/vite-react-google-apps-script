// App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
          </Routes>
          {/* Conditionally render FullscreenMenu based on isMenuOpen */}
          {isMenuOpen && <FullscreenMenu isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />}
        </div>
      </div>
    </Router>
  );
}

export default App;
