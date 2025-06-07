const { app, BrowserWindow } = require("electron");
const fs = require("fs");
const path = require("path");

let ScrapperWindow;
let isBusy = false;
const queue = [];
const COOKIE_FILE = path.join(app.getPath("userData"), "cookies.json");

// Create Scrapping Window
function createScrapperWindow() {
  ScrapperWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      partition: "persist:scrapper",
    },
  });

  ScrapperWindow.webContents.session.webRequest.onBeforeRequest(
    { urls: ["*://*/*"] },
    (details, callback) => {
      if (
        details.resourceType === "mainFrame" ||
        details.url.includes("ddos-guard") ||
        details.url.includes("apdoesnthavelogotheysaidapistooplaintheysaid")
      ) {
        callback({ cancel: false });
      } else {
        callback({ cancel: true });
      }
    }
  );

  ScrapperWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription, validatedURL) => {
      console.error(
        `Failed to load ${validatedURL}: ${errorCode} - ${errorDescription}`
      );
    }
  );

  ScrapperWindow.on("closed", () => {
    ScrapperWindow = null;
  });

  loadCookies();

  ScrapperWindow.webContents.session.cookies.on(
    "changed",
    (event, cookie, cause, removed) => {
      saveCookies();
    }
  );
}

// Save Cookies to disk
async function saveCookies() {
  if (!ScrapperWindow) return;
  try {
    const cookies = await ScrapperWindow.webContents.session.cookies.get({});
    fs.writeFileSync(COOKIE_FILE, JSON.stringify(cookies, null, 2));
  } catch (err) {
    // ignore errors
  }
}

// Load Cookies from disk
async function loadCookies() {
  if (!ScrapperWindow) return;
  if (!fs.existsSync(COOKIE_FILE)) return;

  try {
    const cookies = JSON.parse(fs.readFileSync(COOKIE_FILE, "utf8"));
    for (const cookie of cookies) {
      await ScrapperWindow.webContents.session.cookies.set(cookie);
    }
  } catch (err) {
    // ignore
  }
}

// Public scrapeURL function, queues requests
global.scrapeURL = async (url, type = null) => {
  return new Promise((resolve, reject) => {
    queue.push({ url, type, resolve, reject });
    processQueue();
  });
};

async function processQueue() {
  if (isBusy || queue.length === 0 || !ScrapperWindow) return;

  const { url, type, resolve, reject } = queue.shift();
  isBusy = true;

  try {
    await ScrapperWindow.loadURL(url);

    await new Promise((resolve) => {
      ScrapperWindow.webContents.once("did-stop-loading", resolve);
    });

    await new Promise((r) => setTimeout(r, 1500));

    const bodyText = await ScrapperWindow.webContents.executeJavaScript(
      "document.body.innerText"
    );

    try {
      const json = JSON.parse(bodyText);
      resolve(json);
    } catch {
      const html = await ScrapperWindow.webContents.executeJavaScript(
        "document.documentElement.outerHTML"
      );
      resolve(html);
    }
  } catch (err) {
    if (err.message.includes("ERR_ABORTED")) {
    } else {
      reject(err);
    }
  } finally {
    isBusy = false;
    processQueue();
  }
}

module.exports = {
  createScrapperWindow,
};
