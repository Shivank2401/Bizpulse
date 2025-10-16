import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Suppress ResizeObserver errors
const resizeObserverLoopErrRe = /^[^(ResizeObserver loop limit exceeded)]/;
const resizeObserverLoopErr = /^[^(ResizeObserver loop completed with undelivered notifications)]/;
window.addEventListener('error', e => {
  if (resizeObserverLoopErrRe.test(e.message) || resizeObserverLoopErr.test(e.message)) {
    const resizeObserverErr = document.getElementById('webpack-dev-server-client-overlay');
    if (resizeObserverErr) {
      resizeObserverErr.style.display = 'none';
    }
    e.stopImmediatePropagation();
  }
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
