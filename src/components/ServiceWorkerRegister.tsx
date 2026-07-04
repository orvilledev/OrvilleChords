"use client";

import { useEffect } from "react";

/**
 * Registers the service worker in production only. In development it would
 * cache Next's changing dev assets and break hot reload.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof navigator === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      return;
    }
    // The effect runs after mount (post-load), so register directly — waiting on
    // the window "load" event would miss it since load has already fired.
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* registration is best-effort */
    });
  }, []);

  return null;
}
