import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ToastProvider } from "./contexts/ToastContext";
import "./styles/global.css";
import App from "./App.jsx";

// Scrollable selectors — elements that ARE allowed to scroll
const SCROLLABLE_SELECTORS = [
  ".content-area",
  ".admin-main",
  ".sidebar",
  ".modal-body",
  ".modal-container",
  ".table-container",
  ".broadcast-history-list",
  ".admin-sidebar",
  ".profile-page",
  "[data-scrollable]",
].join(",");

// Helper: check if an element or its ancestors can scroll
const canScrollInside = (el) => {
  let node = el;
  while (node && node !== document.body) {
    if (node.matches && node.matches(SCROLLABLE_SELECTORS)) return true;
    // Also allow if the element itself has overflow scroll/auto and actual scrollable content
    const style = window.getComputedStyle(node);
    const overflowY = style.overflowY;
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      node.scrollHeight > node.clientHeight
    ) {
      return true;
    }
    node = node.parentElement;
  }
  return false;
};

// Prevent ALL wheel scroll at document level, except inside scrollable containers
document.addEventListener(
  "wheel",
  (e) => {
    // Always block horizontal trackpad drag
    if (Math.abs(e.deltaX) > 0) {
      e.preventDefault();
      return;
    }
    // Block vertical scroll unless inside a scrollable area
    if (!canScrollInside(e.target)) {
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
    if (!canScrollInside(e.target)) {
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
