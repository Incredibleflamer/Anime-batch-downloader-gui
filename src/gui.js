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
const { continuousExecution } = require("./backend/database");
const {
  getAllMetadata,
  getMetadataById,
  getSourceById,
  MetadataAdd,
} = require("./backend/utils/Metadata");
const https = require("https");
const fs = require("fs");
const JSZip = require("jszip");

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
      quality &&
      quality !== "1080p" &&
      quality !== "720p" &&
      quality !== "360p"
      // && status !== null
    )
      return res.status(400).json({ error: "Enter a valid quality." });

    // if (autotrack !== "on" && autotrack !== "off" && status !== null)
    //   return res.status(400).json({ error: "Enter on / off in autotracking." });

    if (CustomDownloadLocation && CustomDownloadLocation !== null)
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

// local anime api
appExpress.post("/api/local/anime", async (req, res) => {
  const { page } = req.body;
  try {
    const config = await settingfetch();
    let data = await getAllMetadata(
      "Anime",
      config?.CustomDownloadLocation,
      page
    );
    res.status(200).json(data);
  } catch (err) {
    console.log(err);
    // logging
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    res.status(200).json({});
  }
});

// local manga api
appExpress.post("/api/local/manga", async (req, res) => {
  const { page } = req.body;
  try {
    const config = await settingfetch();
    let data = await getAllMetadata(
      "Manga",
      config?.CustomDownloadLocation,
      page
    );
    res.status(200).json(data);
  } catch (err) {
    console.log(err);
    // logging
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    res.status(200).json({});
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
  const { ep, epNum, Downloaded } = req.body;
  try {
    if (!ep || !epNum) throw new Error("");
    if (!Downloaded) {
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
    } else {
      const config = await settingfetch();

      let videoData = {
        sources: [],
        subtitles: [],
        intro: null,
      };

      const SourcesData = await getSourceById(
        "Anime",
        config?.CustomDownloadLocation,
        ep,
        epNum
      );

      // url
      if (SourcesData?.filepath) {
        videoData.sources.push({
          url: `/video?path=${encodeURIComponent(SourcesData?.filepath)}`,
          quality: "HD",
        });
      }

      // Subtitles : TODO
      res.status(200).json(videoData);
    }
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

// Play Video From Local Source
appExpress.get("/video", (req, res) => {
  const filePath = req.query.path;
  if (!filePath) return res.status(400).send("No file path provided");

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize) {
      res.status(416).send("Requested range not satisfiable");
      return;
    }

    const chunkSize = end - start + 1;
    const fileStream = fs.createReadStream(filePath, { start, end });

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": "video/mp4",
    });

    fileStream.pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
    });

    fs.createReadStream(filePath).pipe(res);
  }
});

// get chapter
appExpress.post("/api/read", async (req, res) => {
  const { chapterID, Downloaded = false, MangaID } = req.body;
  try {
    if (!chapterID) throw new Error("");
    if (Downloaded) {
      if (!MangaID) throw new Error("");
      const config = await settingfetch();
      const SourcesData = await getSourceById(
        "Manga",
        config?.CustomDownloadLocation,
        MangaID,
        chapterID
      );

      if (SourcesData?.filepath) {
        const zipData = fs.readFileSync(SourcesData.filepath);
        const zip = await JSZip.loadAsync(zipData);

        const pages = await Promise.all(
          Object.keys(zip.files)
            .filter((file) => file.match(/^\d+\./))
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map(async (file) => ({
              page: parseInt(file),
              img: `data:image/jpeg;base64,${await zip
                .file(file)
                .async("base64")}`,
            }))
        );
        res.json(pages);
      } else {
        throw new Error("Chapter Not Found In Downloads!");
      }
    } else {
      const provider = await providerFetch("Manga");
      const chapters = await MangaChapterFetch(provider.provider, chapterID);
      return res.status(200).json(chapters);
    }
  } catch (err) {
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    console.log(err);
    res.status(200).json([]);
  }
});

// api for syncing anime / manga
appExpress.post("/api/sync/local", async (req, res) => {
  try {
    const setting = await settingfetch();
    let { animeid, mangaid } = req.body;

    if (animeid?.trim()?.length > 0) {
      animeid = animeid.trim();
      let data = await getMetadataById(
        "Anime",
        setting?.CustomDownloadLocation,
        animeid
      );
      if (!data) throw new Error("Metadata not found!");

      let provider = await providerFetch("Anime", data?.provider);
      if (provider) {
        const animedata = await animeinfo(provider.provider, animeid);

        if (
          provider.provider_name === "animekai" ||
          provider.provider_name === "hianime"
        ) {
          await MetadataAdd(
            "Anime",
            {
              id: animeid,
              description: animedata.description ?? null,
              status: animedata.status ?? null,
              genres: animedata?.genres?.join(",") ?? null,
              totalEpisodes: parseInt(animedata?.totalEpisodes) ?? null,
              last_page: parseInt(animedata?.last_page) ?? null,
              episodes: JSON.stringify(animedata?.episodes) ?? null,
            },
            true
          );

          return res.status(200).json({ Success: true });
        } else if (provider.provider_name === "pahe") {
          await MetadataAdd(
            "Anime",
            {
              id: animeid,
              description: animedata.description ?? null,
              status: animedata.status ?? null,
              genres: animedata?.genres?.join(",") ?? null,
              totalEpisodes: parseInt(animedata?.totalEpisodes) ?? null,
              last_page: parseInt(animedata?.last_page) ?? null,
              episodes: JSON.stringify(animedata?.episodes) ?? null,
            },
            true
          );
          return res.status(200).json({ Success: true });
        }
      }
    } else if (mangaid?.trim()?.length > 0) {
      mangaid = mangaid.trim();
      let data = await getMetadataById(
        "Manga",
        setting?.CustomDownloadLocation,
        mangaid
      );

      if (!data) throw new Error("Metadata not found!");

      let provider = await providerFetch("Manga", data?.provider);

      if (provider) {
        const mangainfo = await MangaInfo(provider.provider, mangaid);
        await MetadataAdd(
          "Manga",
          {
            id: mangaid,
            description: mangainfo.description ?? null,
            genres: mangainfo?.genres?.join(",") ?? null,
            chapters: JSON.stringify(mangainfo?.chapters) ?? null,
            totalChapters: parseInt(mangainfo?.totalChapters) ?? null,
          },
          true
        );
        return res.status(200).json({ Success: true });
      }
    }
    throw new Error("Invalid type must be manga / anime");
  } catch (err) {
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    console.log(err);
    res.status(400).json({
      error: err.message,
      Success: false,
    });
  }
});

// ===================== routes =====================

// Local Anime Page
appExpress.get(["/", "/local/anime"], async (req, res) => {
  try {
    const config = await settingfetch();
    let data = await getAllMetadata("Anime", config?.CustomDownloadLocation, 1);
    res.render("index.ejs", {
      data: data,
      catagorie: "Local Anime Library",
      Pagination: config?.Pagination || "off",
    });
  } catch (err) {
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    console.log(err);
    res.render("index.ejs", {
      data: {
        totalPages: 0,
        currentPage: 1,
        hasNextPage: false,
        totalItems: 0,
        results: [],
      },
      catagorie: "Local Anime Library",
      Pagination: "off",
    });
  }
});

// Local Manga Page
appExpress.get("/local/manga", async (req, res) => {
  try {
    const config = await settingfetch();
    let data = await getAllMetadata("Manga", config?.CustomDownloadLocation, 1);
    res.render("manga.ejs", {
      data: data,
      catagorie: "Local Manga Library",
      Pagination: config?.Pagination || "off",
    });
  } catch (err) {
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    console.log(err);
    res.render("manga.ejs", {
      data: {
        totalPages: 0,
        currentPage: 1,
        hasNextPage: false,
        totalItems: 0,
        results: [],
      },
      catagorie: "Local Manga Library",
      Pagination: "off",
    });
  }
});

// home page anime
appExpress.get("/anime", async (req, res) => {
  try {
    const provider = await providerFetch("Anime");
    const resentep = await latestAnime(provider.provider, 1);
    const config = await settingfetch();
    res.render("index.ejs", {
      data: resentep,
      catagorie: "Recent Episodes",
      Pagination: config?.Pagination || "off",
    });
  } catch (err) {
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    console.log(err);
    res.render("error.ejs");
  }
});

// home page manga
appExpress.get("/manga", async (req, res) => {
  try {
    const provider = await providerFetch("Manga");
    const config = await settingfetch();
    const data = await latestMangas(provider.provider, 1);

    res.render("manga.ejs", {
      data: data,
      catagorie: "Latest Updated",
      Pagination: data?.hasNextPage ? config?.Pagination || "off" : "off",
    });
  } catch (error) {
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    console.log(err);
    res.render("error.ejs");
  }
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
  try {
    const setting = await settingfetch();

    if (req.query.animeid) {
      const animeId = req.query.animeid.trim();
      const provider = await providerFetch("Anime");
      const data = await animeinfo(provider.provider, animeId);
      return res.render("info.ejs", {
        data: data,
        subDub: setting?.subDub ?? "sub",
      });
    } else if (req.query.localanimeid) {
      const Internet = await hasInternet();
      const localanimeid = req.query.localanimeid.trim();
      let data = await getMetadataById(
        "Anime",
        setting?.CustomDownloadLocation,
        localanimeid
      );
      if (!data) throw new Error("Local Anime Not Found");
      return res.render("info.ejs", {
        data: data,
        subDub: setting?.subDub ?? "sub",
        Internet: Internet,
      });
    }
    throw new Error("Something is missing in request /info");
  } catch (err) {
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    console.log(err);
    res.render("error.ejs");
  }
});

// manga info page
appExpress.get("/mangainfo", async (req, res) => {
  try {
    const setting = await settingfetch();
    if (req.query.mangaid) {
      const mangaid = req.query.mangaid.trim();
      const provider = await providerFetch("Manga");
      const data = await MangaInfo(provider.provider, mangaid);
      return res.render("mangainfo.ejs", {
        data: data,
        autoLoadNextChapter: setting?.autoLoadNextChapter ?? "on",
      });
    } else if (req.query.localmangaid) {
      const Internet = await hasInternet();
      const localanimeid = req.query.localmangaid.trim();
      let data = await getMetadataById(
        "Manga",
        setting?.CustomDownloadLocation,
        localanimeid
      );
      if (!data) throw new Error("Local Anime Not Found");
      return res.render("mangainfo.ejs", {
        data: data,
        autoLoadNextChapter: setting?.autoLoadNextChapter ?? "on",
        Internet: Internet,
      });
    }
    throw new Error("Something is missing in request /mangainfo");
  } catch (err) {
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    console.log(err);
    res.render("error.ejs");
  }
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

async function hasInternet() {
  return new Promise((resolve) => {
    const req = https.get("https://www.google.com", (res) => {
      resolve(res.statusCode === 200);
    });

    req.on("error", () => resolve(false));
    req.end();
  });
}
