const { app, BrowserWindow, Notification, ipcMain, Menu } = require("electron");
const path = require("node:path");

const isDev = !app.isPackaged;

// Tracked so the ipcMain handlers below can flash this specific window's
// taskbar entry -- the OS-level equivalent of the in-app banner for when
// the window is minimized and the banner literally can't be seen.
let mainWindow = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: "#fafaf9", // stone-50
    title: "Wellness Lodge — Front Desk",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      // Chromium throttles timers (setInterval/setTimeout) in a minimized or
      // fully-occluded window to save power. The new-reservation ring runs
      // on exactly that kind of timer, and the front desk may well minimize
      // this window while doing something else -- it still needs to ring.
      // Keeping it un-throttled is what makes "rings no matter what" true
      // even then, not just while the window is visible on some tab.
      backgroundThrottling: false,
    },
  });

  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL);
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "renderer", "dist", "index.html"));
  }

  mainWindow = win;
  win.on("closed", () => {
    if (mainWindow === win) mainWindow = null;
  });

  return win;
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ---------------------------------------------------------------------------
// Native notification bridge — the renderer calls this (via preload) the
// moment a new reservation request or receipt lands in the queue. This is
// the "native Windows wrapper" the architecture doc flags as the upgrade
// path when a browser-only PWA can't guarantee alerts: a packaged desktop
// app can show a system notification even when the window isn't focused.
// ---------------------------------------------------------------------------
ipcMain.on("notify", (_event, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
  }
});

// Flashes the taskbar entry for this window -- Windows keeps flashing it
// until the window is focused, regardless of minimized state, which is
// exactly the "still get my attention even minimized" behavior the in-app
// banner can't provide on its own (a minimized window renders nothing
// visible). Paired 1:1 with the ring starting/stopping in preload.js.
ipcMain.on("flash-start", () => {
  mainWindow?.flashFrame(true);
});
ipcMain.on("flash-stop", () => {
  mainWindow?.flashFrame(false);
});

ipcMain.handle("app-version", () => app.getVersion());
