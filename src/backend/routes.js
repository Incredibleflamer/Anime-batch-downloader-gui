// Libs
const express = require("express");
const axios = require("axios");
const JSZip = require("jszip");
const https = require("https");
const fs = require("fs");
const router = express.Router();

// functions
const { ensureDirectoryExists } = require("./utils/DirectoryMaker");
const {
  downloadAnimeSingle,
  downloadAnimeMulti,
  downloadMangaSingle,
  downloadMangaMulti,
} = require("./download");
const {
  latestMangas,
  MangaSearch,
  MangaInfo,
  latestAnime,
  animeinfo,
  animesearch,
  fetchEpisode,
  fetchEpisodeSources,
  MangaChapterFetch,
  fetchChapters,
} = require("./utils/AnimeManga");
const { ddosGuardRequest } = require("./Scrappers/animepahe");
const { logger, getLogs } = require("./utils/AppLogger");
const {
  settingupdate,
  settingfetch,
  providerFetch,
} = require("./utils/settings");
const { getQueue, updateQueue, removeQueue } = require("./utils/queue");
const { MalCreateUrl, MalVerifyToken } = require("./utils/mal");
const {
  getAllMetadata,
  getMetadataById,
  getSourceById,
  MetadataAdd,
  MalPage,
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
    logger.error(`Error Logging Download Segment`);
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// download api for anime & manga
router.post("/api/download/:AnimeManga/:singleMulti", async (req, res) => {
  const { AnimeManga, singleMulti } = req.params;

  try {
    let MessageData = null;

    if (AnimeManga === "Anime") {
      if (singleMulti === "Single") {
        let { id, ep, Title, number } = req.body;
        MessageData = await downloadAnimeSingle(id, ep, number, Title, true);
      } else if (singleMulti === "Multi") {
        let { id, Episodes, Title } = req.body;
        MessageData = await downloadAnimeMulti(id, Episodes, Title);
      }
    } else if (AnimeManga === "Manga") {
      if (singleMulti === "Single") {
        let { id, ep, Title, number } = req.body;
        MessageData = await downloadMangaSingle(id, ep, number, Title, true);
      } else if (singleMulti === "Multi") {
        let { id, Chapters, Title } = req.body;
        MessageData = await downloadMangaMulti(id, Chapters, Title);
      }
    }

    if (!MessageData || MessageData?.message?.length <= 0)
      throw new Error("No Response Found From Functions");

    const queue = (await getQueue()) ?? [];
    return res.json({
      error: MessageData?.error,
      message: MessageData.message,
      queue: queue.length ?? 0,
    });
  } catch (err) {
    logger.error(`Error Updating Download Queue`);
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    return res.json({
      error: true,
      message: `Internal server error: ${err.message}`,
    });
  }
});

// Fetchs Lists : Latest , Local , Search Anime & Manga
router.post("/api/list/:AnimeManga/:provider/", async (req, res) => {
  const { AnimeManga, provider } = req.params;
  let { page } = req.query;
  page = parseInt(page) || 1;
  try {
    if (!AnimeManga || !provider) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    const config = await settingfetch();
    data = null;

    if (AnimeManga === "Anime") {
      if (provider === "local") {
        data = await getAllMetadata(
          "Anime",
          config?.CustomDownloadLocation,
          page
        );
      } else if (provider === "mal") {
        data = await MalPage(config.Animeprovider);
      } else if (provider === "provider") {
        const provider = await providerFetch("Anime");
        data = await latestAnime(provider, page);
      } else if (provider === "search") {
        const provider = await providerFetch("Anime");
        data = await animesearch(provider, req?.query?.query);
      }
    } else if (AnimeManga === "Manga") {
      if (provider === "local") {
        data = await getAllMetadata(
          "Manga",
          config?.CustomDownloadLocation,
          page
        );
      } else if (provider === "provider") {
        const provider = await providerFetch("Manga");
        data = await latestMangas(provider, page);
      } else if (provider === "search") {
        const provider = await providerFetch("Manga");
        data = await MangaSearch(provider, req?.query?.query);
      }
    }

    if (!data) throw new Error(`No ${AnimeManga} Found in ${provider}`);
    return res.json(data);
  } catch (err) {
    logger.error(`Failed To Fetch ${provider} ${AnimeManga} page ${page}`);
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    res.json({
      data: {
        totalPages: 0,
        currentPage: 1,
        hasNextPage: false,
        totalItems: 0,
        results: [],
      },
    });
  }
});

// Fetches Anime / Manga Info
router.post("/api/info/:AnimeManga/:LocalMalProvider", async (req, res) => {
  const { AnimeManga, LocalMalProvider } = req.params;
  const { id } = req.body;

  try {
    if (!id) throw new Error("ID IS Missing");

    let data = null;
    if (AnimeManga === "Anime") {
      if (LocalMalProvider === "local") {
        const setting = await settingfetch();
        data = await getMetadataById(
          "Anime",
          setting?.CustomDownloadLocation,
          id
        );
      } else if (LocalMalProvider === "provider") {
        let provider = await providerFetch("Anime");
        data = await animeinfo(provider, id);
      }
    } else if (AnimeManga === "Manga") {
      if (LocalMalProvider === "local") {
        const setting = await settingfetch();
        data = await getMetadataById(
          "Manga",
          setting?.CustomDownloadLocation,
          id
        );
      } else if (LocalMalProvider === "provider") {
        let provider = await providerFetch("Manga");
        data = await MangaInfo(provider, id);
      }
    }
    if (!data) throw new Error(`No ${AnimeManga} Found with id '${id}'`);
    return res.json(data);
  } catch (err) {
    logger.error(
      `Failed To Fetch ${LocalMalProvider} ${AnimeManga} with AnimeID : '${id}'`
    );
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    return res.json({ error: true, message: err?.message });
  }
});

// Fetches Anime Episodes
router.post("/api/episodes", async (req, res) => {
  let { id, page } = req.body;
  page = parseInt(page ?? 1);
  try {
    if (isNaN(page)) throw new Error(`invalid Page '${page}'`);
    if (!id) throw new Error("ID is Missing");

    const provider = await providerFetch("Anime");

    const data = await fetchEpisode(provider, id, page);
    if (!data) throw new Error("No Episodes Found");

    return res.json(data);
  } catch (err) {
    logger.error(`Error Fetching '${id}' Episodes page : ${page}:`);
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    return res.json({ error: true, message: err?.message });
  }
});

// Fetches Manga Chapters
router.post("/api/chapters", async (req, res) => {
  let { id } = req.body;
  try {
    if (!id) throw new Error("ID is Missing");

    const provider = await providerFetch("Manga");
    const data = await fetchChapters(provider, id);
    if (!data) throw new Error("No Episodes Found");

    return res.json(data);
  } catch (err) {
    logger.error(`Error Fetching '${id}' Manga Chapters`);
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    return res.json({ error: true, message: err?.message });
  }
});

router.post("/downloads", async (req, res) => {
  let caption = "Nothing in progress";
  let queue = (await getQueue()) ?? [];

  if (queue.length > 0) {
    let itemWithSegments = queue.find((item) => item.totalSegments > 0);
    if (queue.length === 1) itemWithSegments = queue[0];

    if (itemWithSegments) {
      return res.json({
        caption: itemWithSegments.caption,
        queue: queue,
        totalSegments: itemWithSegments.totalSegments,
        currentSegments: itemWithSegments.currentSegments,
      });
    }
  }

  return res.json({
    caption: caption,
    queue: queue,
    totalSegments: 0,
    currentSegments: 0,
  });
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
            message: "Queue is empty",
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
    logger.error(`Error Removing ${req?.query?.AnimeEpId ? "Ep" : "Ep(s)"} `);
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
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
        animedata = await animeinfo(provider, ep, {
          page: currentPage,
          fetch_info: false,
        });
      } else {
        animedata = await animeinfo(provider, ep);
      }

      let AnimeEpId = animedata.episodes.find(
        (item) => item.number === parseInt(epNum)
      );
      if (!AnimeEpId?.id) throw new Error("Episode Not Found");
      const sourcesArray = await fetchEpisodeSources(provider, AnimeEpId?.id);
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
    logger.error(`Error Fetching M3U8 Playlist`);
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
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
      const chapters = await MangaChapterFetch(provider, chapterID);
      return res.status(200).json(chapters);
    }
  } catch (err) {
    logger.error(`Failed To Fetch Manga Chapters`);
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
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
        const animedata = await animeinfo(provider, animeid);

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
        const mangainfo = await MangaInfo(provider, mangaid);
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
    logger.error(`Failed To Sync`);
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    res.status(400).json({
      error: err.message,
      Success: false,
    });
  }
});

// ===================== routes =====================

// Local Anime Page
router.get(["/", "/local/anime"], async (req, res) => {
  const config = await settingfetch();
  res.render("index.ejs", {
    catagorie: "Local Anime's",
    api: "/api/list/Anime/local?page=",
    infoapi: "/info/Anime/local?id=",
    Pagination: config?.Pagination || "off",
  });
});

// Local Manga Page
router.get("/local/manga", async (req, res) => {
  const config = await settingfetch();
  res.render("index.ejs", {
    catagorie: "Local Manga's",
    api: "/api/list/Manga/local?page=",
    infoapi: "/info/Manga/local?id=",
    Pagination: config?.Pagination || "off",
  });
});

// home page anime
router.get("/anime", async (req, res) => {
  const config = await settingfetch();
  res.render("index.ejs", {
    catagorie: "Recent Anime's",
    api: "/api/list/Anime/provider?page=",
    infoapi: "/info/Anime/provider?id=",
    Pagination: config?.Pagination || "off",
  });
});

// Mal Page Anime
router.get("/mal/anime", async (req, res) => {
  const config = await settingfetch();
  res.render("index.ejs", {
    catagorie: "MyAnimelist Anime's",
    api: "/api/list/Anime/mal?page=",
    infoapi: "/info/Anime/provider?id=",
    Pagination: config?.Pagination || "off",
  });
});

// home page manga
router.get("/manga", async (req, res) => {
  const config = await settingfetch();
  res.render("index.ejs", {
    catagorie: "Latest Manga's",
    api: "/api/list/Manga/provider?page=",
    infoapi: "/info/Manga/provider?id=",
    Pagination: config?.Pagination || "off",
  });
});

// search anime
router.get("/search", async (req, res) => {
  const anime = req?.query?.animetosearch;
  const manga = req?.query?.mangatosearch;

  const config = await settingfetch();
  res.render("index.ejs", {
    catagorie: `Results For ${anime ? anime : manga}`,
    api: `/api/list/${anime ? "Anime" : "Manga"}/search?query=${
      anime ? anime : manga
    }&page=`,
    infoapi: `/info/${anime ? "Anime" : "Manga"}/provider?id=`,
    Pagination: config?.Pagination || "off",
  });
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

// log page
router.get("/log", async (req, res) => {
  const logs = await getLogs();
  res.render("logs.ejs", { logs });
});

// info page
router.get("/info/:AnimeManga/:LocalMalProvider", async (req, res) => {
  const { AnimeManga, LocalMalProvider } = req.params;
  let id = decodeURIComponent(req?.query?.id ?? "");
  const setting = await settingfetch();
  try {
    if (!id) throw new Error(`No ${AnimeManga} 'id' found in request!`);
    if (
      (AnimeManga === "Anime" || AnimeManga === "Manga") &&
      (LocalMalProvider === "provider" || LocalMalProvider === "local")
    ) {
      return res.render("info.ejs", {
        type: AnimeManga,
        infoapi: `/api/info/${AnimeManga}/${LocalMalProvider}`,
        id: id,
        autoLoadNextChapter: setting?.autoLoadNextChapter ?? "on",
      });
    }
    throw new Error("Something is missing in request /info");
  } catch (err) {
    logger.error(`Failed To Fetch Anime Info`);
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    res.render("error.ejs", {
      error: err.message,
    });
  }
});

// downloads page
router.get("/downloads", async (req, res) => {
  return res.render("downloads.ejs");
});

// proxy for images
router.get("/proxy/image", async (req, res) => {
  const PaheImageUrl = req?.query?.pahe
    ? decodeURIComponent(req?.query?.pahe)
    : null;
  const weebcentralUrl = req?.query?.weebcentral
    ? decodeURIComponent(req?.query?.weebcentral)
    : null;
  const imageUrl = req.query.url ? decodeURIComponent(req.query.url) : null;

  try {
    if (PaheImageUrl) {
      const response = await ddosGuardRequest(PaheImageUrl, {
        responseType: "arraybuffer",
      });
      res.set("Content-Type", response.headers["content-type"]);
      return res.send(response.data);
    } else if (weebcentralUrl) {
      const response = await axios.get(weebcentralUrl, {
        responseType: "arraybuffer",
        headers: {
          Referer: "https://weebcentral.com/",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
        },
      });
      res.set("Content-Type", response.headers["content-type"]);
      return res.send(response.data);
    } else if (imageUrl) {
      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
      });
      res.set("Content-Type", response.headers["content-type"]);
      return res.send(response.data);
    }
    throw new Error("Missing Url");
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

router.get("/error", async (req, res) => {
  return res.render("error.ejs", {
    error: req?.query?.message ?? "Internal Error",
  });
});

module.exports = router;
