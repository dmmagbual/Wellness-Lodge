const { app, BrowserWindow, Notification, ipcMain, Menu } = require("electron");
const path = require("node:path");

const isDev = !app.isPackaged;

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
    },
  });

  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL);
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "renderer", "dist", "index.html"));
  }

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

ipcMain.handle("app-version", () => app.getVersion());
