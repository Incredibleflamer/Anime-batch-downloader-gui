const { spawn } = require("child_process");
const { logger } = require("./AppLogger");
const ffmpeg = require("ffmpeg-static");
const axios = require("axios");
const path = require("path");
const fs = require("fs");

// ffmpeg path fix for bundled application
const ffmpegPath = ffmpeg.replace("app.asar", "app.asar.unpacked");

class downloader {
  constructor({
    concurrency = 1,
    maxRetries = 10,
    directory,
    streamUrl,
    Epnum = NaN,
    caption,
    EpID,
    subtitles = [],
    MergeSubtitles = false,
    ChangeTosrt = false,
  }) {
    // storing in object
    this.concurrency = Math.min(Math.max(parseInt(concurrency) || 1, 10), 100);
    this.maxRetries = Math.max(parseInt(maxRetries) || 10, 10);
    this.directory = directory;
    this.streamUrl = streamUrl;
    this.Epnum = parseInt(Epnum);
    this.caption = caption;
    this.EpID = EpID;
    this.SegmentsDownloaded = [];
    this.subtitles = subtitles ?? [];
    this.MergeSubtitles = MergeSubtitles ?? false;
    this.ChangeTosrt = ChangeTosrt ?? false;
    this.downloadedPaths = [];
    this.httpClient = axios.create({
      timeout: 5000,
      headers: { Connection: "keep-alive" },
    });
  }

  // Additional Checks
  async DownloadsChecking() {
    if (
      !this.directory ||
      !(await this.CheckFileFolderExists(this.directory))
    ) {
      throw new Error("Directory Not Found!");
    }

    if (!this.Epnum) {
      throw new Error("No Episode Number Found!");
    }

    if (!this.EpID || this.EpID.length <= 0) {
      throw new Error("No Ep id found!");
    }

    await this.CreateFolderAndFiles(this.directory, this.Epnum);

    if (!this.streamUrl || this.streamUrl.length <= 0) {
      throw new Error("No Stream Url Provided");
    } else {
      let Playlist = await axios.get(this.streamUrl);
      if (!Playlist || !Playlist.data) throw new Error("No Stream Found!");
      let Segments = Playlist.data
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("https://"));

      if (Segments.length <= 0) throw new Error("No Segments Found!");
      this.Segments = Segments;
      this.totalSegments = Segments.length;
      this.currentSegments = 0;

      if (this.subtitles && this.subtitles.length > 0) {
        this.totalSegments += this.subtitles.length;
      }
    }
  }

  async DownloadStart() {
    try {
      let concurrencyBefore = this.concurrency;
      while (this.Segments.length > 0) {
        let LastBatchSpeed = this.concurrency;
        this.SegmentsBatchSizeInKB = 0;
        let startTime = Date.now();
        let batch = this.Segments.splice(0, this.concurrency);
        await Promise.all(
          batch.map((segment) => this.DownloadSegment(segment))
        );

        let endTime = Date.now();
        const speedKBps =
          this.SegmentsBatchSizeInKB / ((endTime - startTime) / 1000);

        // Increase concurrency
        if (speedKBps > 10240) {
          this.concurrency += 10;
        } else if (speedKBps > 8192) {
          this.concurrency += 5;
        } else if (speedKBps > 6144) {
          this.concurrency += 3;
        } else if (speedKBps > 5120) {
          this.concurrency += 1;
        }

        // Decrease concurrency
        else if (speedKBps < 1024) {
          this.concurrency -= 10;
        } else if (speedKBps < 2048) {
          this.concurrency -= 5;
        } else if (speedKBps < 3072) {
          this.concurrency -= 3;
        } else if (speedKBps < 4096) {
          this.concurrency -= 1;
        }

        this.concurrency = Math.min(
          Math.max(parseInt(this.concurrency), 10),
          100
        );

        if (LastBatchSpeed !== this.concurrency) {
          logger.info(
            `Current Concurrency : ${this.concurrency} download speed ${speedKBps}`
          );
          console.log(
            `Current Concurrency : ${this.concurrency} download speed ${speedKBps}`
          );
        }
      }

      // Updating Concurrency
      if (concurrencyBefore !== this.concurrency) {
        logger.info(`Updating Concurrency To : ${this.concurrency}`);
        console.log(`Updating Concurrency To : ${this.concurrency}`);
        fetch(`http://localhost:${global.PORT}/api/settings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            concurrentDownloads: this.concurrency,
          }),
        }).catch((err) => {
          logger.info("Error updating concurrency:", err);
          console.log("Error updating concurrency:", err);
        });
      }
    } catch (err) {
      throw new Error(err);
    }
  }

  async CheckSubtitles() {
    if (this.subtitles.length > 0) {
      await this.downloadSubtitles();
    }
  }

  async downloadSubtitles() {
    try {
      const episodeDir = path.join(this.directory, `subtitles_${this.Epnum}`);

      if (!fs.existsSync(episodeDir)) {
        fs.mkdirSync(episodeDir, { recursive: true });
      }

      const downloadPromises = this.subtitles
        .filter(({ lang }) => lang !== "Thumbnails")
        .map(async ({ url, lang }) => {
          let subtitlePath = path.join(
            episodeDir,
            `${this.Epnum}_${lang}.${url.split(".").pop()}`
          );

          if (
            this.ChangeTosrt &&
            subtitlePath.endsWith(".ttv") &&
            !this.MergeSubtitles
          ) {
            subtitlePath = subtitlePath.replace(".ttv", ".srt");
          }

          try {
            const response = await axios.get(url, { responseType: "text" });
            let subtitleData = response.data;

            if (this.ChangeTosrt && !this.MergeSubtitles) {
              subtitleData = this.convertToSRT(subtitleData);
            }

            await fs.promises.writeFile(subtitlePath, subtitleData, "utf8");
            this.downloadedPaths.push(subtitlePath);
          } catch (err) {
            logger.info(
              `Failed to download subtitle (${lang}): ${err.message}`
            );
            console.log(
              `Failed to download subtitle (${lang}): ${err.message}`
            );
          }
        });
      await Promise.all(downloadPromises);
      this.currentSegments += this.subtitles.length;
    } catch (err) {
      logger.info(`Failed to process subtitles: ${err.message}`);
      console.log(`Failed to process subtitles: ${err.message}`);
    }
  }

  convertToSRT(content) {
    try {
      const lines = content.split("\n");
      const srtLines = [];
      let counter = 1;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (
          /^\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}$/.test(line)
        ) {
          srtLines.push(counter++);
          const [startTime, endTime] = line.split(" --> ");
          srtLines.push(
            `${startTime.replace(".", ",")} --> ${endTime.replace(".", ",")}`
          );
        } else if (line) {
          srtLines.push(line);
        } else if (
          srtLines.length > 0 &&
          srtLines[srtLines.length - 1] !== ""
        ) {
          srtLines.push("");
        }
      }

      return srtLines.join("\n");
    } catch (err) {
      logger.info(`Failed to convert subtitle: ${err.message}`);
      console.error(`Failed to convert subtitles: ${err.message}`);
      return content;
    }
  }

  async MergeSegments() {
    try {
      if (this.SegmentsDownloaded.length === 0) {
        throw new Error("No segments downloaded to merge.");
      }

      // Save all segment paths to a txt file
      const segmentPaths = this.SegmentsDownloaded.map(
        (file) => `file '${file}'`
      ).join("\n");
      const fileListPath = path.join(this.SegmentsFolder, "filelist.txt");
      await fs.promises.writeFile(fileListPath, segmentPaths);

      // FFmpeg arguments
      let ffmpegArgs = ["-f", "concat", "-safe", "0", "-i", fileListPath];

      // Merge Subtitles if downloaded
      if (this.MergeSubtitles && this.downloadedPaths.length > 0) {
        this.downloadedPaths.forEach((filePath) => {
          ffmpegArgs.push("-i", filePath.replace(")}", ""));
        });
      }

      ffmpegArgs.push(
        "-map",
        "0:v",
        "-map",
        "0:a",
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "-b:a",
        "128k"
      );

      if (this.MergeSubtitles && this.downloadedPaths.length > 0) {
        this.downloadedPaths.forEach((filePath, index) => {
          ffmpegArgs.push(
            "-map",
            `${index + 1}:s`,
            "-c:s",
            "mov_text",
            "-metadata:s:s:" + index,
            `language=${path.basename(filePath).split("_")[1] || "und"}`
          );
        });
      }

      ffmpegArgs.push(this.mp4, "-y");

      await new Promise((resolve, reject) => {
        const child = spawn(ffmpegPath, ffmpegArgs);

        child.on("close", (code) => {
          if (code !== 0) {
            return reject(new Error(`FFmpeg Merge Failed with code ${code}`));
          }
          resolve();
        });
      });

      this.currentSegments++;
      await this.logProgress();

      // Cleanup
      await this.DeleteSegmentsFolder();
    } catch (err) {
      await this.DeleteSegmentsFolder();
      throw err;
    }
  }

  async DownloadSegment(SegmentUrl) {
    try {
      let SegmentFileName = path.join(
        this.SegmentsFolder,
        SegmentUrl.split("/").pop()
      );
      await this.AxiosGetSegments(SegmentUrl, SegmentFileName, this.maxRetries);
    } catch (err) {
      throw new Error(err);
    }
  }

  async AxiosGetSegments(SegmentUrl, SegmentFileName, maxRetries) {
    try {
      let response = await this.httpClient({
        method: "get",
        url: SegmentUrl,
        responseType: "stream",
        timeout: 5000,
      });

      const writer = fs.createWriteStream(SegmentFileName);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      this.SegmentsBatchSizeInKB +=
        (await fs.promises.stat(SegmentFileName)).size / 1024;

      this.currentSegments++;
      this.logProgress();

      this.SegmentsDownloaded.push(SegmentFileName);
    } catch (err) {
      console.log(maxRetries);
      if (maxRetries === this.maxRetries) {
        this.concurrency -= 10;
      }

      if (maxRetries > 0) {
        const cooldown = Math.floor(Math.random() * 1000) + 1000;
        console.log(`Retrying in ${cooldown / 1000} seconds...`);
        logger.info(`Retrying in ${cooldown / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, cooldown));
        return await this.AxiosGetSegments(
          SegmentUrl,
          SegmentFileName,
          maxRetries - 1
        );
      } else {
        logger.info(`Max Retries reached`);
        throw new Error("Max Retries reached");
      }
    }
  }

  async CheckFileFolderExists(FileDir) {
    if (!FileDir) return false;
    try {
      await fs.promises.access(FileDir);
      return true;
    } catch (err) {
      return false;
    }
  }

  async CreateFolderAndFiles() {
    const mp4 = path.join(this.directory, `${this.Epnum}Ep.mp4`);
    const SegmentsFolder = path.join(this.directory, `Temp_${this.Epnum}`);

    try {
      await fs.promises.access(mp4);
    } catch (error) {
      await fs.promises.writeFile(mp4, "");
    }

    try {
      await fs.promises.access(SegmentsFolder);
    } catch (error) {
      await fs.promises.mkdir(SegmentsFolder, { recursive: true });
    }
    this.mp4 = mp4;
    this.SegmentsFolder = SegmentsFolder;
  }

  async DeleteSegmentsFolder() {
    try {
      const segmentFiles = await fs.promises.readdir(this.SegmentsFolder);
      for (const file of segmentFiles) {
        await fs.promises.unlink(path.join(this.SegmentsFolder, file));
      }
      await fs.promises.rmdir(this.SegmentsFolder);

      if (
        this.downloadedPaths &&
        this.downloadedPaths.length > 0 &&
        this.MergeSubtitles
      ) {
        const subtitlesFolder = path.join(
          this.directory,
          `subtitles_${this.Epnum}`
        );

        if (fs.existsSync(subtitlesFolder)) {
          const subtitleFiles = await fs.promises.readdir(subtitlesFolder);
          for (const file of subtitleFiles) {
            await fs.promises.unlink(path.join(subtitlesFolder, file));
          }
          await fs.promises.rmdir(subtitlesFolder);
        }
      }
    } catch (err) {
      logger.info("Failed to delete SegmentsFolder or Subtitles folder:", err);
      console.log("Failed to delete SegmentsFolder or Subtitles folder:", err);
    }
  }

  async logProgress() {
    let caption = this.caption;
    if (this.currentSegments >= this.totalSegments - 3) {
      caption = caption.replace("Downloading", "Merging");
    }

    await fetch(`http://localhost:${global.PORT}/api/logger`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        caption: caption,
        totalSegments: this.totalSegments + 1,
        currentSegments: this.currentSegments,
        epid: this.EpID,
      }),
    }).catch((err) => {
      logger.info("Error updating download progress:", err);
      console.log("Error updating download progress:", err);
    });
  }
}

async function download(args) {
  try {
    let obj = new downloader(args);
    await obj.DownloadsChecking();
    await obj.DownloadStart();
    await obj.CheckSubtitles();
    await obj.MergeSegments();
  } catch (err) {
    console.log(err);
    logger.error(err);
    throw new Error(err);
  }
}

module.exports = { download };
