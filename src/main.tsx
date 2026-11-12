import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app.tsx";
import "./styles.css";

createRoot(document.getElementById("root")!).render(<StrictMode><App/></StrictMode>);

// Installierbar und offline nutzbar (nur über https bzw. localhost).
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
  window.addEventListener("load", () => { navigator.serviceWorker.register("./sw.js").catch(() => { /* ohne Vorrat weiter */ }); });
}
