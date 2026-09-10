const { contextBridge, ipcRenderer } = require("electron");

/**
 * Minimal, explicit bridge — the renderer never gets Node or Electron APIs
 * directly (contextIsolation + sandbox are on in main.js). Only these three
 * calls are exposed.
 */
contextBridge.exposeInMainWorld("wellnessLodge", {
  notify: (title, body) => ipcRenderer.send("notify", { title, body }),
  playAlert: () => {
    // Sound plays in the renderer (has access to <audio>); this indirection
    // exists so callers use one API regardless of platform.
    const audio = new Audio("./alert.wav");
    audio.play().catch(() => {});
  },
  appVersion: () => ipcRenderer.invoke("app-version"),
});
