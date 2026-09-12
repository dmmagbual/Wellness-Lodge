const { contextBridge, ipcRenderer } = require("electron");

/**
 * Minimal, explicit bridge — the renderer never gets Node or Electron APIs
 * directly (contextIsolation + sandbox are on in main.js). Only these calls
 * are exposed.
 */

// A soft, repeating ring for "a new reservation needs attention and nobody
// has looked yet" -- distinct from the one-shot playAlert() chime below.
// alert.wav itself is a short (~0.36s) chime, so looping it back-to-back
// (audio.loop = true) would sound like a rapid buzz, not a soft ring;
// replaying it on a relaxed interval instead gives a gentle, spaced-out
// ring that keeps going until the front desk acknowledges it.
let alertLoopTimer = null;

function ringOnce() {
  const audio = new Audio("./alert.wav");
  audio.volume = 0.6;
  audio.play().catch(() => {});
}

contextBridge.exposeInMainWorld("wellnessLodge", {
  notify: (title, body) => ipcRenderer.send("notify", { title, body }),
  playAlert: () => {
    // Sound plays in the renderer (has access to <audio>); this indirection
    // exists so callers use one API regardless of platform.
    const audio = new Audio("./alert.wav");
    audio.play().catch(() => {});
  },
  startAlertLoop: () => {
    ipcRenderer.send("flash-start");
    if (alertLoopTimer) return; // already ringing -- idempotent
    ringOnce();
    alertLoopTimer = setInterval(ringOnce, 2500);
  },
  stopAlertLoop: () => {
    ipcRenderer.send("flash-stop");
    if (alertLoopTimer) {
      clearInterval(alertLoopTimer);
      alertLoopTimer = null;
    }
  },
  appVersion: () => ipcRenderer.invoke("app-version"),
});
