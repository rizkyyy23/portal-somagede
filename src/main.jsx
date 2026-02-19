import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ToastProvider } from "./contexts/ToastContext";
import "./styles/global.css";
import App from "./App.jsx";

// Prevent two-finger horizontal drag (trackpad navigation/panning)
document.addEventListener(
  "wheel",
  (e) => {
    // Block horizontal scroll at document level (prevents page drag/navigation)
    if (Math.abs(e.deltaX) > 0) {
      e.preventDefault();
    }
  },
  { passive: false },
);

// Prevent drag events on the page
document.addEventListener("dragstart", (e) => {
  if (e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
    e.preventDefault();
  }
});

// Prevent touchmove from causing page drag
document.addEventListener(
  "touchmove",
  (e) => {
    // Allow scroll inside scrollable containers
    const isScrollable = e.target.closest(
      ".admin-layout-content, .modal-body, .modal-container, .table-container, [style*='overflow']",
    );
    if (!isScrollable) {
      e.preventDefault();
    }
  },
  { passive: false },
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
);
