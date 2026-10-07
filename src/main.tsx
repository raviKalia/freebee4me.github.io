import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import './styles.css';
// Mount the app inside the root element from index.html.
const root = document.getElementById("root");

if (!root) {
  throw new Error("The root element is missing from index.html.");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
