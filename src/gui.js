// electron
const {
  app,
  BrowserWindow,
  shell,
  nativeTheme,
  Menu,
  globalShortcut,
  powerSaveBlocker,
  dialog,
  Notification,
} = require("electron");
const net = require("net");
const { autoUpdater } = require("electron-updater");
const { exec } = require("child_process");
const path = require("node:path");
const express = require("express");
const bodyParser = require("body-parser");
app.commandLine.appendSwitch("disable-http-cache");
app.commandLine.appendSwitch("disable-renderer-backgrounding");
// global varibles
let win;
let downloadProgress = null;
autoUpdater.setFeedURL({
  provider: "github",
  owner: "Incredibleflamer",
  repo: "Anime-batch-downloader-gui",
});
// downloading functions
const { ensureDirectoryExists } = require("./backend/utils/DirectoryMaker");
const { downloadfunction, MangaDownloadMain } = require("./backend/download");
const {
  latestMangas,
  MangaSearch,
  MangaInfo,
  latestAnime,
  animeinfo,
  animesearch,
  fetchEpisodeSources,
  MangaChapterFetch,
} = require("./backend/utils/AnimeManga");
const { ddosGuardRequest } = require("./backend/Scrappers/animepahe");
const { logger, getLogs } = require("./backend/utils/AppLogger");
const {
  settingupdate,
  settingfetch,
  SettingsLoad,
  providerFetch,
} = require("./backend/utils/settings");
const {
  getQueue,
  updateQueue,
  removeQueue,
  loadQueue,
} = require("./backend/utils/queue");
const { MalCreateUrl, MalVerifyToken } = require("./backend/utils/mal");
const { continuousExecution, getAllMetadata } = require("./backend/database");
// express
const appExpress = express();
// middle ware
appExpress.use(bodyParser.urlencoded({ extended: true }));
appExpress.use(bodyParser.json());
appExpress.use(express.static(path.join(__dirname, "gui")));
appExpress.set("views", path.join(__dirname, "gui"));
// ===================== mal routes =====================
// mal callback
appExpress.get("/mal/callback", async (req, res) => {
  code = req.query.code;
  await MalVerifyToken(code);
  res.redirect("https://myanimelist.net/");
  win.webContents.reload();
});

// mal logout
appExpress.get("/mal/logout", async (req, res) => {
  await settingupdate({ mal_on_off: "logout", status: null, malToken: null });
  res.redirect("/setting");
});
// ===================== apis =====================

// setting api
appExpress.post("/api/settings", async (req, res) => {
  const {
    // status,
    quality,
    // autotrack,
    CustomDownloadLocation,
    Animeprovider,
    Mangaprovider,
    mergeSubtitles,
    Pagination,
    concurrentDownloads,
    subtitleFormat,
    subDub,
    autoLoadNextChapter,
  } = req.body;
  try {
    // if (
    //   status !== "watching" &&
    //   status !== "dropped" &&
    //   status !== "completed" &&
    //   status !== "on_hold" &&
    //   status !== "plan_to_watch" &&
    //   status !== null
    // )
    //   return res.status(400).json({ error: "Enter a valid status." });

    if (
      quality !== "1080p" &&
      quality !== "720p" &&
      quality !== "360p"
      // && status !== null
    )
      return res.status(400).json({ error: "Enter a valid quality." });

    // if (autotrack !== "on" && autotrack !== "off" && status !== null)
    //   return res.status(400).json({ error: "Enter on / off in autotracking." });

    if (CustomDownloadLocation !== null)
      await ensureDirectoryExists(CustomDownloadLocation);

    await settingupdate({
      quality: quality,
      CustomDownloadLocation: CustomDownloadLocation,
      Animeprovider: Animeprovider,
      Mangaprovider: Mangaprovider,
      mergeSubtitles: mergeSubtitles,
      subtitleFormat: subtitleFormat,
      Pagination: Pagination,
      concurrentDownloads: concurrentDownloads,
      subDub: subDub,
      autoLoadNextChapter: autoLoadNextChapter,
    });

    const data = await settingfetch();

    // setting quality
    message = `Quality: ${data.quality}`;

    // mal on then add status and autotrack
    // if (data.mal_on_off === true) {
    //   message += `\nAuto Add To: ${data.status}\nAuto Track Ep: ${data.autotrack}`;
    // }

    // add download location
    message += `\nDownload Location: ${data.CustomDownloadLocation}\nAnime Provider : ${data.Animeprovider}`;

    // if provider is hianime add mergeSubtitles
    if (data.Animeprovider === "hianime") {
      message += `\nMerge Subtitles: ${data.mergeSubtitles}`;
      if (data.mergeSubtitles === "off") {
        message += `\nSubtitle Format: ${data.subtitleFormat}`;
      }
    }

    message += `\nManga Provider : ${data?.Mangaprovider}\nAutoload Next Chapter : ${data?.autoLoadNextChapter}`;

    // Pagination & concurrentDownloads
    message += `\nPagination : ${data.Pagination}\nConcurrent Downloads: ${data.concurrentDownloads}`;

    if (data.Animeprovider === "pahe") {
      message += `\nsubDub : ${data.subDub}`;
    }

    res.status(200).json({ message: message });
  } catch (err) {
    const errorMessage = err.message.split("\n")[0];
    console.log(err);
    // logging
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    res.status(400).json({ error: errorMessage });
  }
});

// latest api
appExpress.post("/api/latest", async (req, res) => {
  const { page } = req.body;
  try {
    const provider = await providerFetch("Anime");
    const resentep = await latestAnime(provider.provider, page);
    res.status(200).json(resentep);
  } catch (err) {
    console.log(err);
    // logging
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    res.status(200).json([]);
  }
});

// latest manga api
appExpress.post("/api/manga/latest", async (req, res) => {
  const { page } = req.body;
  try {
    const provider = await providerFetch("Manga");
    const resentep = await latestMangas(provider.provider, page);
    res.status(200).json(resentep);
  } catch (err) {
    console.log(err);
    // logging
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    res.status(200).json([]);
  }
});

// find anime api
appExpress.post("/api/findanime", async (req, res) => {
  let { page, title } = req.body;
  title = title.replace("Results For", "");
  try {
    const provider = await providerFetch("Anime");
    const animefound = await animesearch(provider.provider, title, page);
    res.status(200).json(animefound);
  } catch (err) {
    console.log(err);
    // logging
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    res.status(200).json([]);
  }
});

// find manga api
appExpress.post("/api/findmanga", async (req, res) => {
  let { page, title } = req.body;
  title = title.replace("Results For", "");
  try {
    const provider = await providerFetch("Manga");
    const Mangafound = await MangaSearch(provider.provider, title, page);
    res.status(200).json(Mangafound);
  } catch (err) {
    console.log(err);
    // logging
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    res.status(200).json([]);
  }
});

// download api [ for downloading anime / adding to queue ]
appExpress.post("/api/download", async (req, res) => {
  const { ep, start, end } = req.body;
  try {
    const { errors, info, Success } = await downloadfunction(ep, start, end);
    if (downloadProgress) {
      dataqueue = await getQueue(downloadProgress.epid);
    } else {
      dataqueue = await getQueue();
    }
    if (errors.length > 0) {
      res.status(400).json({
        message: `Error : \n${errors.join("\n")}\nInfo: \n${info.join(
          "\n"
        )}\nLogs: \n${Success.join("\n")}`,
        queue: dataqueue.length,
      });
    } else {
      res.status(200).json({
        message: `INFO: \n${info.join("\n")}\nLogs: \n${Success.join("\n")}`,
        queue: dataqueue.length,
      });
    }
  } catch (err) {
    console.log(err);
    // logging
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    res.status(500).json({ message: "Internal server error" });
  }
});

// download api [ for downloading manga / adding to queue ]
appExpress.post("/api/mangadownload", async (req, res) => {
  const { ep, start, end } = req.body;
  try {
    let queue;
    const { errors, info, Success } = await MangaDownloadMain(ep, start, end);
    if (downloadProgress) {
      dataqueue = await getQueue(downloadProgress.epid);
      queue = dataqueue.length;
    } else {
      dataqueue = await getQueue();
      queue = dataqueue.length;
    }
    if (errors.length > 0) {
      res.status(400).json({
        message: `Error : \n${errors.join("\n")}\nInfo: \n${info.join(
          "\n"
        )}\nLogs: \n${Success.join("\n")}`,
        queue: queue,
      });
    } else {
      res.status(200).json({
        message: `INFO: \n${info.join("\n")}\nLogs: \n${Success.join("\n")}`,
        queue: queue,
      });
    }
  } catch (err) {
    console.log(err);
    // logging
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    res.status(500).json({ message: "Internal server error" });
    // Handle other errors
  }
});

// logger [ bassically we are tracking how much we have downloaded ]
appExpress.post("/api/logger", async (req, res) => {
  const { caption, totalSegments, currentSegments, epid } = req.body;
  try {
    downloadProgress = { caption, totalSegments, currentSegments, epid };
    await updateQueue(epid, totalSegments, currentSegments);
    res.status(200).json({ message: "Download progress received" });
  } catch (err) {
    // logging
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// sends progress data to front end
appExpress.get("/api/download/progress", async (req, res) => {
  let caption = "Nothing in progress";
  let queue, totalSegments, currentSegments;
  if (downloadProgress) {
    caption = downloadProgress.caption;
    currentSegments = downloadProgress.currentSegments;
    totalSegments = downloadProgress.totalSegments;
    if (currentSegments <= 0) currentSegments = 1;
    queue = await getQueue(downloadProgress.epid);
  } else {
    queue = await getQueue();
  }

  res.json({
    caption: caption,
    queue: queue,
    totalSegments: totalSegments,
    currentSegments: currentSegments,
  });
});

// remove from queue
appExpress.get("/api/download/remove/", async (req, res) => {
  try {
    await removeQueue(req.query.AnimeEpId);
    res.json({ message: "Item removed" });
  } catch (err) {
    // logging
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    console.log(err);
    res.status(500).json({ message: "Error removing item", err });
  }
});

// remove all from queue
appExpress.get("/api/download/remove/all", async (req, res) => {
  try {
    let queue;
    if (downloadProgress) {
      queue = await getQueue(downloadProgress.epid);
    } else {
      queue = await getQueue();
    }
    for (const anime of queue) {
      await removeQueue(anime.epid);
    }
    res.json({ message: "All items removed" });
  } catch (err) {
    // logging
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    console.log(err);
    // Error handling
    res.status(500).json({ message: "Error removing all items", err });
  }
});

// get ep url
appExpress.post("/api/watch", async (req, res) => {
  const { ep, epNum } = req.body;
  try {
    if (!ep || !epNum) throw new Error("");
    const provider = await providerFetch("Anime");
    let animedata = null;

    if (provider?.provider_name === "pahe") {
      let currentPage = Math.ceil(epNum / 30);
      animedata = await animeinfo(provider.provider, ep, {
        page: currentPage,
        fetch_info: false,
      });
    } else {
      animedata = await animeinfo(provider.provider, ep);
    }

    let AnimeEpId = animedata.episodes.find(
      (item) => item.number === parseInt(epNum)
    );
    if (!AnimeEpId?.id) throw new Error("Episode Not Found");
    const sourcesArray = await fetchEpisodeSources(
      provider.provider,
      AnimeEpId?.id
    );
    res.status(200).json(sourcesArray);
  } catch (err) {
    // logging
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    console.log(err);
    res.status(200).json({
      sources: [],
    });
  }
});

// get chapter
appExpress.post("/api/read", async (req, res) => {
  const { chapterID } = req.body;
  try {
    if (!chapterID) throw new Error("");
    const provider = await providerFetch("Manga");
    const chapters = await MangaChapterFetch(provider.provider, chapterID);
    res.status(200).json(chapters);
  } catch (err) {
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    console.log(err);
    res.status(200).json([]);
  }
});

// ===================== routes =====================

// home page anime
appExpress.get(["/", "/anime"], async (req, res) => {
  const provider = await providerFetch("Anime");
  const resentep = await latestAnime(provider.provider, 1);
  const config = await settingfetch();
  res.render("index.ejs", {
    data: resentep,
    catagorie: "Recent Episodes",
    Pagination: config?.Pagination || "off",
  });
});

// home page manga
appExpress.get("/manga", async (req, res) => {
  const provider = await providerFetch("Manga");
  const config = await settingfetch();
  const data = await latestMangas(provider.provider, 1);

  res.render("manga.ejs", {
    data: data,
    catagorie: "Latest Updated",
    Pagination: data?.hasNextPage ? config?.Pagination || "off" : "off",
  });
});

// Local Anime Page
appExpress.get("/local/anime", async (req, res) => {
  const config = await settingfetch();
  let data = await getAllMetadata(config?.CustomDownloadLocation, "Anime", 1);
  res.render("index.ejs", {
    data: data,
    catagorie: "Local Anime Library",
    Pagination: "off",
  });
});

// Local Manga Page
appExpress.get("/local/manga", async (req, res) => {
  const config = await settingfetch();
  let data = await getAllMetadata(config?.CustomDownloadLocation, "Manga", 1);
  res.render("manga.ejs", {
    data: data,
    catagorie: "Local Manga Library",
    Pagination: "off",
  });
});

// settings
appExpress.get("/setting", async (req, res) => {
  const setting = await settingfetch();
  // url = null;
  // if (!setting.mal_on_off || setting.mal_on_off === null) {
  //   const url = await MalCreateUrl();
  //   return res.render("settings.ejs", { settings: setting, url: url });
  // }
  res.render("settings.ejs", { settings: setting });
});

// search anime
appExpress.get("/search", async (req, res) => {
  const animeToSearch = req?.query?.animetosearch;
  const mangaToSearch = req?.query?.mangatosearch;
  const config = await settingfetch();

  if (mangaToSearch) {
    const mangaToSearch = req.query.mangatosearch;
    try {
      const provider = await providerFetch("Manga");
      const data = await MangaSearch(provider.provider, mangaToSearch);
      res.render("manga.ejs", {
        data: data,
        catagorie: `Results For ${mangaToSearch}`,
        Pagination: config?.Pagination || "off",
      });
    } catch (err) {
      // logging
      logger.error(`Error message: ${err.message}`);
      logger.error(`Stack trace: ${err.stack}`);
      console.log(err);
      res.render("manga.ejs", {
        catagorie: "no results found..",
        data: null,
        Pagination: "off",
      });
    }
  } else if (animeToSearch) {
    try {
      const provider = await providerFetch("Anime");
      const data = await animesearch(provider.provider, animeToSearch);
      res.render("index.ejs", {
        data: data,
        catagorie: `Results For ${animeToSearch}`,
        Pagination: config?.Pagination || "off",
      });
    } catch (err) {
      // logging
      logger.error(`Error message: ${err.message}`);
      logger.error(`Stack trace: ${err.stack}`);
      console.log(err);
      res.render("index.ejs", {
        catagorie: "no results found..",
        data: null,
        Pagination: "off",
      });
    }
  }
});

// logs
appExpress.get("/log", async (req, res) => {
  const logs = await getLogs();
  res.render("logs.ejs", { logs });
});

// info page
appExpress.get("/info", async (req, res) => {
  const animeId = req.query.animeid.trim();
  if (animeId) {
    const provider = await providerFetch("Anime");
    const data = await animeinfo(provider.provider, animeId);
    const setting = await settingfetch();
    res.render("info.ejs", { data: data, subDub: setting?.subDub ?? "sub" });
  } else {
    const localanimeid = req.query.localanimeid.trim();
    const folderName = req.query.folder.trim();
    console.log(localanimeid);
    console.log(folderName);
  }
});

// manga info page
appExpress.get("/mangainfo", async (req, res) => {
  const mangaid = req.query.mangaid.trim();
  const provider = await providerFetch("Manga");
  const data = await MangaInfo(provider.provider, mangaid);
  const setting = await settingfetch();
  res.render("mangainfo.ejs", {
    data: data,
    autoLoadNextChapter: setting?.autoLoadNextChapter ?? "on",
  });
});

// downloads page
appExpress.get("/downloads", async (req, res) => {
  let caption = "Nothing in progress";
  let queue, totalSegments, currentSegments;
  if (downloadProgress) {
    caption = downloadProgress.caption;
    currentSegments = downloadProgress.currentSegments;
    totalSegments = downloadProgress.totalSegments;
    queue = await getQueue(downloadProgress.epid);

    if (currentSegments <= 0) currentSegments = 1;
  } else {
    queue = await getQueue();
  }

  res.render("downloads.ejs", {
    caption: caption,
    queue: queue,
    totalSegments: totalSegments,
    currentSegments: currentSegments,
  });
});

// proxy for images
appExpress.get("/proxy/image", async (req, res) => {
  const imageUrl = req.query.url;

  if (!imageUrl) {
    return res.status(400).send("Missing 'url' query parameter.");
  }

  try {
    const response = await ddosGuardRequest(imageUrl, {
      responseType: "arraybuffer",
    });
    res.set("Content-Type", response.headers["content-type"]);
    res.send(response.data);
  } catch (error) {
    console.error("Error fetching image:", error);
    res.status(500).send("Internal server error.");
  }
});

// Proxy for m3u8
appExpress.get("/proxy", async (req, res) => {
  try {
    const videoUrl = req.query.url;
    if (!videoUrl) return res.status(400).json({ error: "No URL provided" });

    const response = await ddosGuardRequest(videoUrl, {
      responseType: "arraybuffer",
    });

    const contentType = response.headers["content-type"];
    res.setHeader("Content-Type", contentType);

    if (contentType.includes("application/vnd.apple.mpegurl")) {
      let m3u8Data = response.data.toString("utf-8");

      m3u8Data = m3u8Data.replace(
        /^https?:\/\/.*$/gm,
        (match) => `/proxy?url=${encodeURIComponent(match)}`
      );

      return res.send(m3u8Data);
    }

    res.send(response.data);
  } catch (error) {
    console.error("Error fetching video:", error.message);
    res.status(500).json({ error: "Failed to fetch video" });
  }
});

// start server
getFreePort().then((PORT) => {
  global.PORT = PORT;

  appExpress.listen(PORT, () => {
    logger.info(`Listening on port ${PORT}`);
  });
});

// create window / electron
const createWindow = () => {
  win = new BrowserWindow({
    resizable: true,
    webPreferences: {
      nodeIntegration: true,
      backgroundThrottling: false,
    },
    icon: path.join(__dirname, "./assets/luffy.ico"),
    minWidth: 1000,
    minHeight: 750,
  });
  app.commandLine.appendSwitch("disable-http-cache");
  app.commandLine.appendSwitch("disable-renderer-backgrounding");
  win.maximize();
  nativeTheme.themeSource = "dark";
  win.loadURL(`http://localhost:${global.PORT}`);
  win.webContents.on("will-navigate", (event, url) => {
    event.preventDefault();
    if (url.startsWith("https://myanimelist.net")) {
      shell.openExternal(url);
    } else {
      win.loadURL(`${url}`);
    }
  });

  win.webContents.on("context-menu", (event) => {
    event.preventDefault();
  });

  win.webContents.on("before-input-event", (event, input) => {
    if (input.control && input.key.toLowerCase() === "i") {
      event.preventDefault();
    }
  });
  const menu = Menu.buildFromTemplate([]);
  Menu.setApplicationMenu(menu);

  // max priority
  exec(
    `wmic process where processid=${process.pid} CALL setpriority 128`,
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
  loadQueue();
  SettingsLoad();
  continuousExecution();
} catch (err) {
  console.log(err);
  logger.error(`Error message: ${err.message}`);
  logger.error(`Stack trace: ${err.stack}`);
}

app.whenReady().then(() => {
  createWindow();
  globalShortcut.register("CommandOrControl+Shift+I", () => {
    console.log("Dev tools disabled");
  });
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
  autoUpdater.checkForUpdatesAndNotify();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

autoUpdater.on("checking-for-update", () => {
  logger.info("Checking for updates...");
});

autoUpdater.on("update-not-available", () => {
  logger.info("No updates available");
});

autoUpdater.on("update-available", () => {
  logger.info("Update available. Downloading...");
  if (win) {
    win.webContents.send("update-available");
  }
});

autoUpdater.on("error", (err) => {
  logger.error("Error checking for updates:", err);
});

autoUpdater.on("update-downloaded", () => {
  logger.info("Update downloaded.");
  if (win) {
    win.webContents.send("update-downloaded");
  }
  // Notify user about the update
  const choice = dialog.showMessageBoxSync(win, {
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
    title: "Anime Batch Downloader",
    body: `AnimeDownloader ${version} has been successfully installed!`,
  });

  notification.show();
});

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
