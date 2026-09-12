/**
 * Bridge to the Electron main process (native notification + sound), with a
 * browser fallback so `npm run dev` also works outside Electron while
 * building the UI.
 */

declare global {
  interface Window {
    wellnessLodge?: {
      notify: (title: string, body: string) => void;
      playAlert: () => void;
      startAlertLoop: () => void;
      stopAlertLoop: () => void;
      appVersion: () => Promise<string>;
    };
  }
}

let audio: HTMLAudioElement | null = null;

export function notifyStaff(title: string, body: string): void {
  if (window.wellnessLodge) {
    window.wellnessLodge.notify(title, body);
    return;
  }
  if (typeof Notification !== "undefined") {
    if (Notification.permission === "granted") {
      new Notification(title, { body });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((p) => {
        if (p === "granted") new Notification(title, { body });
      });
    }
  }
}

export function playAlertSound(): void {
  if (window.wellnessLodge) {
    window.wellnessLodge.playAlert();
    return;
  }
  try {
    if (!audio) audio = new Audio("./alert.wav");
    audio.currentTime = 0;
    void audio.play();
  } catch {
    // Sound is a courtesy, never block on it.
  }
}

// Soft, repeating ring for "a new reservation is sitting unacknowledged" --
// distinct from the one-shot playAlertSound() above. alert.wav is a short
// (~0.36s) chime, so looping it back-to-back would sound like a rapid buzz
// rather than a soft ring; replaying it every 2.5s instead gives a gentle,
// spaced-out ring that keeps going until dismissed. Idempotent: calling
// startAlertLoop() while it's already running does nothing extra.
let loopTimer: ReturnType<typeof setInterval> | null = null;

function ringOnce(): void {
  try {
    const a = new Audio("./alert.wav");
    a.volume = 0.6;
    void a.play();
  } catch {
    // Sound is a courtesy, never block on it.
  }
}

export function startAlertLoop(): void {
  if (window.wellnessLodge) {
    window.wellnessLodge.startAlertLoop();
    return;
  }
  if (loopTimer) return;
  ringOnce();
  loopTimer = setInterval(ringOnce, 2500);
}

export function stopAlertLoop(): void {
  if (window.wellnessLodge) {
    window.wellnessLodge.stopAlertLoop();
    return;
  }
  if (loopTimer) {
    clearInterval(loopTimer);
    loopTimer = null;
  }
}
