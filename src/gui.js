// electron
const {
  app,
  BrowserWindow,
  nativeTheme,
  Menu,
  globalShortcut,
  powerSaveBlocker,
  dialog,
  Notification,
  ipcMain,
  protocol,
} = require("electron");
const { autoUpdater } = require("electron-updater");
const bodyParser = require("body-parser");
const { exec } = require("child_process");
const express = require("express");
const path = require("node:path");
const net = require("net");

app.commandLine.appendSwitch("disable-http-cache");
app.commandLine.appendSwitch("disable-renderer-backgrounding");

// global varibles
autoUpdater.setFeedURL({
  provider: "github",
  owner: "TheYogMehta",
  repo: "Anime-batch-downloader-gui",
});

//  functions
const { logger } = require("./backend/utils/AppLogger");
const {
  SettingsLoad,
  patchModulePaths,
  loadAllScrapers,
} = require("./backend/utils/settings");
const { loadQueue } = require("./backend/utils/queue");
const { continuousExecution } = require("./backend/database");
const { fetchAndUpdateMappingDatabase } = require("./backend/utils/Metadata");
const { StopDiscordRPC } = require("./backend/utils/discord");
const {
  createScrapperWindow,
  ExitScrapperWindow,
} = require("./backend/utils/scrapper");

// Express Server
const routes = require("./backend/routes");
const appExpress = express();
appExpress.use(bodyParser.urlencoded({ extended: true }));
appExpress.use(bodyParser.json());
appExpress.use(express.static(path.join(__dirname, "gui")));
appExpress.set("views", path.join(__dirname, "gui"));
appExpress.use((req, res, next) => {
  res.locals.MalLoggedIn = global.MalLoggedIn;
  next();
});
appExpress.use(routes);

getFreePort().then((PORT) => {
  global.PORT = PORT;

  appExpress.listen(PORT, () => {
    logger.info(`Listening on port ${PORT}`);
  });
});

// create window / electron
const { registerSharedStateHandlers } = require("./backend/sharedState");
registerSharedStateHandlers();

const createWindow = () => {
  global.win = new BrowserWindow({
    resizable: true,
    webPreferences: {
      nodeIntegration: true,
      backgroundThrottling: false,
      contextIsolation: true,
      webSecurity: false,
      preload: path.join(__dirname, "backend", "preload.js"),
    },
    icon: path.join(__dirname, "./assets/luffy.ico"),
    minWidth: 1000,
    minHeight: 750,
  });

  app.commandLine.appendSwitch("disable-http-cache");
  app.commandLine.appendSwitch("disable-renderer-backgrounding");
  global.win.maximize();
  nativeTheme.themeSource = "dark";
  global.win.loadURL(`http://localhost:${global.PORT}`);

  global.win.webContents.session.webRequest.onBeforeSendHeaders(
    { urls: ["*://i.animepahe.ru/*", "*://temp.compsci88.com/cover/small/*"] },
    (details, callback) => {
      const url = details.url;
      if (url.startsWith("https://i.animepahe.ru/")) {
        details.requestHeaders["Referer"] = "https://animepahe.ru/";
      } else if (url.startsWith("https://temp.compsci88.com/")) {
        details.requestHeaders["Referer"] = "https://weebcentral.com/";
      }
      callback({ requestHeaders: details.requestHeaders });
    }
  );

  global.win.webContents.on("will-navigate", (event, url) => {
    event.preventDefault();

    if (url.startsWith("https://myanimelist.net")) {
      global.Miniwindow = new BrowserWindow({
        width: 500,
        height: 650,
        resizable: false,
        minimizable: false,
        maximizable: false,
        title: "MyAnimeList",
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      global.Miniwindow.loadURL(url);

      global.Miniwindow.setMenu(null);

      ipcMain.on("mal", () => {
        if (malPopup) {
          global.Miniwindow.close();
          global.Miniwindow = null;
        }
      });

      global.Miniwindow.on("closed", () => {
        global.Miniwindow = null;
      });
    } else {
      global.win.loadURL(url);
    }
  });

  global.win.webContents.on("context-menu", (event) => {
    event.preventDefault();
  });

  global.win.webContents.on("before-input-event", (event, input) => {
    if (input.control && input.key.toLowerCase() === "i") {
      event.preventDefault();
    }
  });

  ipcMain.on("marketplace", (event, AnimeManga) => {
    if (global.marketplaceWin && !global.marketplaceWin.isDestroyed()) {
      global.marketplaceWin.focus();
      return;
    }

    global.marketplaceWin = new BrowserWindow({
      width: 900,
      height: 500,
      parent: global.win,
      modal: true,
      title: "MarketPlace",
      webPreferences: {
        preload: path.join(__dirname, "backend", "preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    global.marketplaceWin.loadURL(
      `http://localhost:${global.PORT}/marketplace?type=${AnimeManga}`
    );
  });

  global.win.on("closed", async () => {
    if (global.ScrapperWindow && !global.ScrapperWindow.isDestroyed()) {
      await ExitScrapperWindow();
    }

    if (global.Miniwindow && !global.Miniwindow.isDestroyed()) {
      global.Miniwindow.close();
      global.Miniwindow = null;
    }

    if (global.marketplaceWin && !global.marketplaceWin.isDestroyed()) {
      global.marketplaceWin.close();
      global.marketplaceWin = null;
    }

    await StopDiscordRPC();

    app.quit();
  });

  const menu = Menu.buildFromTemplate([]);
  Menu.setApplicationMenu(menu);

  // max priority
  exec(
    `powershell -Command "& {Get-Process -Id ${process.pid} | ForEach-Object { $_.PriorityClass = 'High' }}"`,
    (error, stdout, stderr) => {
      if (error) {
        console.error("Failed to set process priority:", error);
        logger.error(`Failed to set process priority : ${error.message}`);
      } else {
        logger.info("Process priority set to high.");
      }
    }
  );

  // Prevent Sleep
  let id = powerSaveBlocker.start("prevent-app-suspension");

  logger.info("Power save blocker active:", powerSaveBlocker.isStarted(id));
};

try {
  fetchAndUpdateMappingDatabase();
  continuousExecution();
} catch (err) {
  logger.error(`Error message: ${err.message}`);
  logger.error(`Stack trace: ${err.stack}`);
}

app.whenReady().then(() => {
  createWindow();
  createScrapperWindow();
  loadQueue();
  SettingsLoad();
  patchModulePaths();
  loadAllScrapers();
  globalShortcut.register("CommandOrControl+Shift+I", () => {});
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  protocol.handle("mal", async (request) => {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");

    if (code) {
      if (global.Miniwindow && !global.Miniwindow.isDestroyed()) {
        global.Miniwindow.loadURL(
          `http://localhost:${global.PORT}/mal/callback?code=${code}`
        );
      }
    }
  });

  autoUpdater.checkForUpdatesAndNotify();
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

// AutoUpdater
autoUpdater.on("checking-for-update", () => {
  logger.info("Checking for updates...");
});

autoUpdater.on("update-not-available", () => {
  logger.info("No updates available");
});

autoUpdater.on("update-available", () => {
  logger.info("Update available. Downloading...");
  if (global.win) {
    global.win.webContents.send("update-available");
  }
});

autoUpdater.on("error", (err) => {
  logger.error("Error checking for updates:", err);
});

autoUpdater.on("update-downloaded", () => {
  logger.info("Update downloaded.");
  if (global.win) {
    global.win.webContents.send("update-downloaded");
  }
  const choice = dialog.showMessageBoxSync(global.win, {
    type: "question",
    buttons: ["Restart", "Later"],
    defaultId: 0,
    cancelId: 1,
    title: "Update Ready",
    message:
      "A new version has been downloaded. Would you like to restart the app to apply the update?",
  });

  if (choice === 0) {
    autoUpdater.quitAndInstall();
  }
});

autoUpdater.on("update-installed", () => {
  const version = app.getVersion();

  const notification = new Notification({
    title: "StrawVerse",
    body: `StrawVerse ${version} has been successfully installed!`,
  });

  notification.show();
});

// Find Free Port
async function getFreePort() {
  return new Promise((resolve, reject) => {
    const tryFindPort = () => {
      const server = net.createServer();
      server.listen(0, () => {
        const port = server.address().port;
        server.close(() => resolve(port));
      });

      server.on("error", (err) => {
        tryFindPort();
      });
    };
    tryFindPort();
  });
}
