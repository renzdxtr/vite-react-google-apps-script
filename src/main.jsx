import React from "react";
import ReactDOM from "react-dom/client"; // Update import
import App from "./App";
import "./index.css";

const container = document.getElementById('root'); // Get the container element
const root = ReactDOM.createRoot(container); // Create a root
root.render( // Render the app
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
