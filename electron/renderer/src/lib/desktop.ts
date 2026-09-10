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
