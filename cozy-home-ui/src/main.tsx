import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

window.onerror = function (msg, url, line, col, error) {
  console.log("GLOBAL ERROR:", msg, url, line, col, error);
};

createRoot(document.getElementById("root")!).render(<App />);
