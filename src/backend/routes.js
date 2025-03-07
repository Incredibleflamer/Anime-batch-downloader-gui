// Libs
const express = require("express");
const axios = require("axios");
const JSZip = require("jszip");
const https = require("https");
const fs = require("fs");
const router = express.Router();

// functions
const { ensureDirectoryExists } = require("./utils/DirectoryMaker");
const { downloadfunction, MangaDownloadMain } = require("./download");
const {
  latestMangas,
  MangaSearch,
  MangaInfo,
  latestAnime,
  animeinfo,
  animesearch,
  fetchEpisodeSources,
  MangaChapterFetch,
} = require("./utils/AnimeManga");
const { ddosGuardRequest } = require("./Scrappers/animepahe");
const { logger, getLogs } = require("./utils/AppLogger");
const {
  settingupdate,
  settingfetch,
  providerFetch,
} = require("./utils/settings");
const { getQueue, updateQueue, removeQueue } = require("./utils/queue");
const { MalCreateUrl, MalVerifyToken, MalFetchList } = require("./utils/mal");
const {
  getAllMetadata,
  getMetadataById,
  getSourceById,
  MetadataAdd,
} = require("./utils/Metadata");

// ===================== API routes =====================
// Handles Mal Login
router.get("/mal/callback", async (req, res) => {
  code = req.query.code;
  let ToUpdate = await MalVerifyToken(code);
  await settingupdate(ToUpdate);
  global.win.webContents.send("mal", {
    LoggedIn: true,
  });
  return res.send(`
      <p>Authentication successful! You can close this window.</p>
  `);
});

// Handles Mal Logout
router.get("/mal/logout", async (req, res) => {
  await settingupdate({ mal_on_off: "logout", status: null, malToken: null });

  global.win.webContents.send("mal", {
    LoggedIn: false,
  });
  return res.send("logged out!");
});

// Handles Settings update
router.post("/api/settings", async (req, res) => {
  const {
    status,
    quality,
    autotrack,
    CustomDownloadLocation,
    Animeprovider,
    Mangaprovider,
    mergeSubtitles,
    Pagination,
    subtitleFormat,
    subDub,
    autoLoadNextChapter,
  } = req.body;
  try {
    if (
      status &&
      status !== "watching" &&
      status !== "dropped" &&
      status !== "completed" &&
      status !== "on_hold" &&
      status !== "plan_to_watch"
    )
      return res.status(400).json({ error: "Enter a valid status." });

    if (
      quality &&
      quality !== "1080p" &&
      quality !== "720p" &&
      quality !== "360p"
    )
      return res.status(400).json({ error: "Enter a valid quality." });

    if (autotrack && autotrack !== "on" && autotrack !== "off")
      return res.status(400).json({ error: "Enter on / off in autotracking." });

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
      subDub: subDub,
      autoLoadNextChapter: autoLoadNextChapter,
    });

    const data = await settingfetch();

    // setting quality
    message = `Quality: ${data.quality}`;

    // mal on then add status and autotrack
    if (data.mal_on_off === true) {
      message += `\nAuto Add To: ${data.status}\nAuto Track Ep: ${data.autotrack}`;
    }

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

    // Pagination
    message += `\nPagination : ${data.Pagination}`;

    if (data.Animeprovider === "pahe") {
      message += `\nsubDub : ${data.subDub}`;
    }

    res.status(200).json({ message: message });
  } catch (err) {
    const errorMessage = err.message.split("\n")[0];
    logger.error(`Error Updating Settings: \n${err}`);
    res.status(400).json({ error: errorMessage });
  }
});

// Handles Download Progress & Sends To FrontEnd
router.post("/api/logger", async (req, res) => {
  const { caption, totalSegments, currentSegments, epid } = req.body;
  try {
    let queue = await updateQueue(epid, totalSegments, currentSegments);
    queue = queue.filter(
      (item) => !item?.totalSegments || item?.totalSegments <= 0
    );

    if (totalSegments !== currentSegments) {
      global.win.webContents.send("download-logger", {
        caption,
        totalSegments,
        currentSegments,
        epid,
        queue,
      });
    } else {
      global.win.webContents.send("download-logger", {
        caption: "Nothing in progress",
        queue,
      });
    }

    res.status(200).json({ message: "Download progress received" });
  } catch (err) {
    logger.error(`Error Logging Download Segment: \n${err}`);
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// download api for anime & manga
router.post("/api/download/:type", async (req, res) => {
  const { type } = req.params;
  const { ep, start, end } = req.body;
  try {
    let queue = await getQueue();
    queue = queue.filter((item) => item.totalSegments <= 0);

    let errors = [],
      info = [],
      Success = [];
    let responseMessage = "";

    if (type === "Anime") {
      ({ errors, info, Success } = await downloadfunction(ep, start, end));
    } else if (type === "Manga") {
      ({ errors, info, Success } = await MangaDownloadMain(ep, start, end));
    } else {
      return res.status(400).json({
        message: "Not a valid type! Please provide 'Anime' or 'Manga'.",
      });
    }

    if (errors.length > 0) {
      responseMessage = `Error: \n${errors.join("\n")}\nInfo: \n${info.join(
        "\n"
      )}\nLogs: \n${Success.join("\n")}`;
      return res
        .status(400)
        .json({ message: responseMessage, queue: queue.length ?? 0 });
    } else {
      responseMessage = `INFO: \n${info.join("\n")}\nLogs: \n${Success.join(
        "\n"
      )}`;
      return res
        .status(200)
        .json({ message: responseMessage, queue: queue.length ?? 0 });
    }
  } catch (err) {
    console.error(err);
    logger.error(`Error Updating Download Queue: \n${err}`);
    return res
      .status(500)
      .json({ message: `Internal server error: ${err.message}` });
  }
});

// Handles Latest , Local , Search Anime & Manga
router.post("/api/discover/:type", async (req, res) => {
  const { type } = req.params;
  const { page, title, local } = req.body;
  try {
    let data = null;
    if (type === "Anime") {
      if (title && title.length > 0) {
        title = title.replace("Results For", "");
        const provider = await providerFetch("Anime");
        data = await animesearch(provider.provider, title, page);
      } else if (!local) {
        const provider = await providerFetch("Anime");
        data = await latestAnime(provider.provider, page);
      } else {
        const config = await settingfetch();
        data = await getAllMetadata(
          "Anime",
          config?.CustomDownloadLocation,
          page
        );
      }
    } else if (type === "Manga") {
      if (title && title.length > 0) {
        title = title.replace("Results For", "");
        const provider = await providerFetch("Manga");
        data = await MangaSearch(provider.provider, title, page);
      } else if (!local) {
        const provider = await providerFetch("Manga");
        data = await latestMangas(provider.provider, page);
      } else {
        const config = await settingfetch();
        data = await getAllMetadata(
          "Manga",
          config?.CustomDownloadLocation,
          page
        );
      }
    }

    if (!data) throw new Error(`No data found for ${type} | ${page}`);
    res.status(200).json(resentep);
  } catch (err) {
    console.log(err);
    logger.error(`Error Fetching ${type} page : ${page ?? 0}: \n${err}`);
    res.status(200).json([]);
  }
});

// remove from queue or remove all
router.get("/api/download/remove", async (req, res) => {
  try {
    const { AnimeEpId } = req.query;

    if (AnimeEpId) {
      let queue = await removeQueue(AnimeEpId);

      if (queue.length > 0) {
        const itemWithSegments = queue.find((item) => item.totalSegments > 0);
        if (itemWithSegments) {
          global.win.webContents.send("download-logger", {
            caption: itemWithSegments.caption,
            totalSegments: itemWithSegments.totalSegments,
            currentSegments: itemWithSegments.currentSegments,
            epid: itemWithSegments.epid,
            queue,
          });
        } else {
          global.win.webContents.send("download-logger", {
            queue,
            message: "No items with totalSegments > 0 in the queue",
          });
        }
      } else {
        global.win.webContents.send("download-logger", {
          queue,
          message: "Queue is empty",
        });
      }

      return res.json({ message: `Item with ID ${AnimeEpId} removed` });
    }

    let queue = await getQueue();
    queue = queue.filter((item) => item.totalSegments <= 0);

    for (const anime of queue) {
      await removeQueue(anime.epid);
    }

    global.win.webContents.send("download-logger", {
      queue,
    });

    res.json({ message: "All items removed" });
  } catch (err) {
    logger.error(
      `Error Removing ${req?.query?.AnimeEpId ? "Ep" : "Ep(s)"} : \n${err}`
    );
    console.log(err);
    res.status(500).json({
      message: `Error Removing ${req?.query?.AnimeEpId ? "Ep" : "Ep(s)"}`,
      err,
    });
  }
});

// Play Video From m3u8 url
router.post("/api/watch", async (req, res) => {
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
router.get("/video", (req, res) => {
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
router.post("/api/read", async (req, res) => {
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
router.post("/api/sync/local", async (req, res) => {
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
router.get(["/", "/local/anime"], async (req, res) => {
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
router.get("/local/manga", async (req, res) => {
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
router.get("/anime", async (req, res) => {
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
router.get("/manga", async (req, res) => {
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
router.get("/setting", async (req, res) => {
  const setting = await settingfetch();
  url = null;
  if (!setting.mal_on_off || setting.mal_on_off === null) {
    const url = await MalCreateUrl();
    return res.render("settings.ejs", { settings: setting, url: url });
  }
  res.render("settings.ejs", { settings: setting, url: url });
});

// search anime
router.get("/search", async (req, res) => {
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

// log page
router.get("/log", async (req, res) => {
  const logs = await getLogs();
  res.render("logs.ejs", { logs });
});

// info page
router.get("/info", async (req, res) => {
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
router.get("/mangainfo", async (req, res) => {
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
router.get("/downloads", async (req, res) => {
  let caption = "Nothing in progress";
  let queue = await getQueue();

  if (queue.length > 0) {
    let itemWithSegments = queue.find((item) => item.totalSegments > 0);
    if (queue.length === 1) itemWithSegments = queue[0];

    if (itemWithSegments) {
      return res.render("downloads.ejs", {
        caption: itemWithSegments.caption,
        queue: queue,
        totalSegments: itemWithSegments.totalSegments,
        currentSegments: itemWithSegments.currentSegments,
      });
    }
  }

  return res.render("downloads.ejs", {
    caption: caption,
    queue: queue,
    totalSegments: 0,
    currentSegments: 0,
  });
});

// proxy for images
router.get("/proxy/image", async (req, res) => {
  const PaheImageUrl = req?.query?.pahe
    ? decodeURIComponent(req?.query?.pahe)
    : null;

  try {
    if (PaheImageUrl) {
      const response = await ddosGuardRequest(PaheImageUrl, {
        responseType: "arraybuffer",
      });
      res.set("Content-Type", response.headers["content-type"]);
      return res.send(response.data);
    } else {
      const imageUrl = req.query.url ? decodeURIComponent(req.query.url) : null;
      if (!imageUrl) {
        return res.status(400).send("Missing 'url' query parameter.");
      }
      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
      });
      res.set("Content-Type", response.headers["content-type"]);
      return res.send(response.data);
    }
    throw new Error("");
  } catch (error) {
    console.error("Error fetching image:", error);
    res.status(500).send("Internal server error.");
  }
});

// Proxy for m3u8
router.get("/proxy", async (req, res) => {
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

async function hasInternet() {
  return new Promise((resolve) => {
    const req = https.get("https://www.google.com", (res) => {
      resolve(res.statusCode === 200);
    });

    req.on("error", () => resolve(false));
    req.end();
  });
}

module.exports = router;
