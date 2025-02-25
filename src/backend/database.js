// libs
const path = require("path");
const fs = require("fs");
const download = require("node-hls-downloader").download;
const ffmpeg = require("ffmpeg-static");
const axios = require("axios");
const { exec } = require("child_process");
const { logger } = require("./utils/AppLogger");

// imports
const {
  directoryRemover,
  directoryMaker,
  MangaDir,
  GetDir,
} = require("./utils/DirectoryMaker");
const {
  MangaChapterFetch,
  DownloadChapters,
  fetchEpisodeSources,
} = require("./utils/AnimeManga");
const {
  getQueue,
  saveQueue,
  removeQueue,
  SaveQueueData,
} = require("./utils/queue");
const { settingfetch, providerFetch } = require("./utils/settings");
const HLSLogger = require("./utils/logger");

// queue start
async function continuousExecution() {
  try {
    let AnimeQueue = await getQueue();

    while (true) {
      if (AnimeQueue?.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        AnimeQueue = await getQueue();
      }

      for (let i = 0; i < AnimeQueue.length; i++) {
        try {
          const currentTask = AnimeQueue[0];
          if (!currentTask) {
            break;
          }

          if (currentTask?.Type === "Anime") {
            let { config, Title, EpNum, epid, SubDub } = currentTask;
            if (config && Title && EpNum && epid && SubDub) {
              await downloadep(config, `${Title} ${SubDub}`, EpNum, epid);
            } else {
              logger.error(
                `Error message: Some Anime Data missing [ removing from queue ]`
              );
              AnimeQueue.splice(0, 1);
              await SaveQueueData(AnimeQueue);
              break;
            }
          } else if (currentTask?.Type === "Manga") {
            let { Title, EpNum, epid, ChapterTitle, config } = currentTask;

            if (Title && EpNum && epid && ChapterTitle && config) {
              await downloadMangaChapters(
                config,
                Title,
                EpNum,
                epid,
                ChapterTitle
              );
            } else {
              logger.error(
                `Error message: Some Manga Data missing [ removing from queue  ]`
              );
              AnimeQueue.splice(0, 1);
              await SaveQueueData(AnimeQueue);
              break;
            }
          } else {
            logger.error(
              `Error message: Type is Not Valid [ removing from queue  ]`
            );
            AnimeQueue.splice(0, 1);
            await SaveQueueData(AnimeQueue);
            break;
          }
          await saveQueue();
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (err) {
          console.log("Error executing task:", err);
          logger.error(`Error message: ${err.message}`);
          logger.error(`Stack trace: ${err.stack}`);
          AnimeQueue.splice(0, 1);
          await SaveQueueData(AnimeQueue);
          break;
        }
      }

      AnimeQueue = await getQueue();
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  } catch (err) {
    console.error("Error in continuous execution:", err);
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
  }
}

// start downloadloading ep
async function downloadep(Videoconfig, Title, EpNum, AnimeEpId) {
  const [directoryPath, tempname] = await directoryMaker(
    Title,
    EpNum,
    Videoconfig?.CustomDownloadLocation
  );
  try {
    await downloadEpisodeByQuality(
      Videoconfig,
      EpNum,
      directoryPath,
      tempname,
      Title,
      AnimeEpId
    );
  } catch (err) {
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    console.log(err);
    await directoryRemover(tempname);
    await removeQueue(Title, EpNum, AnimeEpId);
  }
}

// Download episode by quality
async function downloadEpisodeByQuality(
  config,
  episodeNumber,
  directoryName,
  tempname,
  Title,
  epid
) {
  try {
    let preferredQualities = ["1080p", "720p", "360p", "default", "backup"];
    const provider = await providerFetch("Anime", config.Animeprovider);
    const sourcesArray = await fetchEpisodeSources(provider.provider, epid);

    let selectedSource = sourcesArray.sources.find(
      (source) => source.quality === config?.quality ?? "1080p"
    );

    if (!selectedSource) {
      for (const quality of preferredQualities) {
        selectedSource = sourcesArray.sources.find(
          (source) => source.quality === quality
        );
        if (selectedSource) break;
      }
    }

    if (
      !selectedSource &&
      sourcesArray.sources[0]?.url &&
      sourcesArray.sources[0]?.isM3U8
    ) {
      selectedSource = sourcesArray.sources[0];
      selectedSource.quality = "best";
    }

    if (selectedSource) {
      await downloadVideo(
        selectedSource.url,
        directoryName,
        episodeNumber,
        tempname,
        selectedSource.quality,
        Title,
        epid
      );

      if (sourcesArray?.subtitles) {
        try {
          const { downloadedPaths, episodeDir } = await downloadSubtitle(
            sourcesArray.subtitles,
            directoryName,
            episodeNumber
          );

          if (config?.mergeSubtitles === "on" || !config?.mergeSubtitles) {
            const outputFile = path.join(
              directoryName,
              `${episodeNumber}Ep.mp4`
            );
            const tempFile = path.join(
              directoryName,
              `Temp_${episodeNumber}Ep.mp4`
            );

            await mergeSubtitleWithVideo(
              outputFile,
              downloadedPaths,
              tempFile,
              episodeDir
            );
          } else if (config?.subtitleFormat === "srt") {
            for (const ttvFilePath of downloadedPaths) {
              if (ttvFilePath.endsWith(".ttv")) {
                const srtFilePath = ttvFilePath.replace(".ttv", ".srt");
                convertTTVToSRT(ttvFilePath, srtFilePath);
                fs.unlinkSync(ttvFilePath);
              }
            }
          }
        } catch (err) {
          logger.error(`Error message: ${err.message}`);
          logger.error(`Stack trace: ${err.stack}`);
          console.log(`Subtitle processing error: ${err.message}`);
        }
      }
    } else {
      throw new Error("No source link found.");
    }
  } catch (err) {
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    console.log(`Error downloading episode: ${err.message}`);
    throw new Error(err.message);
  }
}

// download video
async function downloadVideo(
  Url,
  directoryPath,
  episodeNumber,
  tempname,
  quality,
  Title,
  epid
) {
  try {
    const hlsLogger = new HLSLogger(
      `Downloading ${Title} || EP ${episodeNumber} [  ${quality}  ]`,
      `${epid}`,
      0,
      false
    );
    const outputFile = path.join(directoryPath, `${episodeNumber}Ep.mp4`);
    const segmentedfile = path.join(directoryPath, `${episodeNumber}Ep.ts`);
    const ffmpegPath = ffmpeg.replace("app.asar", "app.asar.unpacked");
    const config = await settingfetch();
    await download({
      concurrency: config?.concurrentDownloads ?? 5,
      maxRetries: 50,
      outputFile: outputFile,
      streamUrl: Url,
      segmentsDir: tempname,
      ffmpegPath: ffmpegPath,
      logger: hlsLogger.logger,
      mergedSegmentsFile: segmentedfile,
      quality: "best",
    });
  } catch (err) {
    try {
      await fs.promises.rm(tempname, { recursive: true });
    } catch (err) {
      console.log(err);
      logger.error(`Error message: ${err.message}`);
      logger.error(`Stack trace: ${err.stack}`);
    }
    console.log(err);
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    throw new Error("Failed To Download");
  }
}

// Download subtitles
async function downloadSubtitle(subtitles, dir, episodeNumber) {
  try {
    if (subtitles.length > 0) {
      const downloadedPaths = [];
      const episodeDir = path.join(dir, `subtitles_${episodeNumber}`);
      if (!fs.existsSync(episodeDir)) {
        fs.mkdirSync(episodeDir, { recursive: true });
      }
      for (const { url, lang } of subtitles) {
        if (lang === "Thumbnails") continue;
        const subtitlePath = path.join(
          episodeDir,
          `${episodeNumber}_${url.split("/").pop()}`
        );
        const response = await axios.get(url, { responseType: "stream" });
        const writer = fs.createWriteStream(subtitlePath);

        await new Promise((resolve, reject) => {
          response.data.pipe(writer);
          writer.on("finish", resolve);
          writer.on("error", reject);
        });

        downloadedPaths.push(subtitlePath);
      }
      return { downloadedPaths, episodeDir };
    }
  } catch (err) {
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    console.log(`Failed to download subtitle: ${err.message}`);
    throw new Error(`Failed to download subtitle: ${err.message}`);
  }
}

// Merge video with subtitles
async function mergeSubtitleWithVideo(
  videoFile,
  subtitleFiles,
  tempFile,
  episodeDir
) {
  const ffmpegPath = ffmpeg.replace("app.asar", "app.asar.unpacked");

  const subtitleInputs = subtitleFiles
    .map((filePath) => `-i "${filePath}"`)
    .join(" ");
  const subtitleMappings = subtitleFiles
    .map((_, index) => `-map ${index + 1}:s`)
    .join(" ");
  const metadata = subtitleFiles
    .map((filePath, index) => {
      const lang = path.basename(filePath, path.extname(filePath));
      return `-metadata:s:s:${index} language=${lang.split("_")}`;
    })
    .join(" ");

  const command = `${ffmpegPath} -i "${videoFile}" ${subtitleInputs} -map 0 ${subtitleMappings} -c copy -c:s mov_text ${metadata} "${tempFile}"`;

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        return reject(new Error(`Error merging subtitles: ${stderr}`));
      }

      try {
        fs.unlinkSync(videoFile);
        if (fs.existsSync(episodeDir)) {
          fs.rmSync(episodeDir, { recursive: true, force: true });
        }
        fs.renameSync(tempFile, videoFile);
        resolve(stdout);
      } catch (fsError) {
        reject(
          new Error(
            `Error replacing video file or deleting subtitle folder: ${fsError.message}`
          )
        );
      }
    });
  });
}

// Function to convert TTV subtitle to SRT format
function convertTTVToSRT(ttvPath, srtPath) {
  const ttvContent = fs.readFileSync(ttvPath, "utf-8");
  const lines = ttvContent.split("\n");
  const srtLines = [];
  let counter = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (/^\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}$/.test(line)) {
      srtLines.push(counter++);
      const [startTime, endTime] = line.split(" --> ");
      const srtTime = `${startTime.replace(".", ",")} --> ${endTime.replace(
        ".",
        ","
      )}`;
      srtLines.push(srtTime);
    } else if (line) {
      srtLines.push(line);
    } else if (srtLines.length > 0 && srtLines[srtLines.length - 1] !== "") {
      srtLines.push("");
    }
  }

  // Write to SRT file
  fs.writeFileSync(srtPath, srtLines.join("\n"), "utf-8");
}

// start downloadloading manga
async function downloadMangaChapters(
  config,
  Title,
  EpNum,
  ChapterId,
  ChapterTitle
) {
  const provider = await providerFetch("Manga", config?.Mangaprovider);
  const ChapterData = await MangaChapterFetch(provider.provider, ChapterId);

  if (!ChapterData || ChapterData?.length < 1) {
    await removeQueue(Title, EpNum, ChapterId);
    throw new Error("No Image Found For This Chapter!");
  }

  const directoryPath = await MangaDir(Title, config?.CustomDownloadLocation);
  try {
    const sanitizedChapterName = ChapterTitle.replace(/[<>:"/\\|?*]/g, "-");
    const outputFile = path.join(directoryPath, `${sanitizedChapterName}.cbz`);
    await DownloadChapters(
      outputFile,
      ChapterData,
      Title,
      ChapterTitle,
      ChapterId
    );
  } catch (err) {
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    console.log(err);
    await removeQueue(Title, EpNum, ChapterId);
  }
}

module.exports = {
  continuousExecution,
};
