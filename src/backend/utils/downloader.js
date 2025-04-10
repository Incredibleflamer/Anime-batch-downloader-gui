const { spawn } = require("child_process");
const { logger } = require("./AppLogger");
const ffmpeg = require("ffmpeg-static");
const path = require("path");
const got = require("got");
const fs = require("fs");

const ffmpegPath = ffmpeg.replace("app.asar", "app.asar.unpacked");

class downloader {
  constructor({
    directory,
    streamUrl,
    Epnum = NaN,
    caption,
    EpID,
    subtitles = [],
    MergeSubtitles = false,
    ChangeTosrt = false,
  }) {
    this.directory = directory;
    if (streamUrl?.url) {
      this.streamUrl = streamUrl.url;
      this.headers = streamUrl.headers ?? {};
    } else {
      this.streamUrl = streamUrl;
    }
    this.Epnum = parseInt(Epnum);
    this.caption = caption;
    this.EpID = EpID;
    this.subtitles =
      subtitles?.length > 0
        ? subtitles?.filter(({ lang }) => lang !== "Thumbnails") ?? []
        : [];
    this.MergeSubtitles = MergeSubtitles ?? false;
    this.ChangeTosrt = ChangeTosrt ?? false;
    this.downloadedPaths = [];
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

    this.mp4 = path.join(this.directory, `${this.Epnum}Ep.mp4`);
    this.SegmentsFile = path.join(this.directory, `${this.Epnum}Ep.ts`);

    if (!this.streamUrl || this.streamUrl.length <= 0) {
      throw new Error("No Stream Url Provided");
    } else {
      let Playlist = await got(this.streamUrl, {
        headers: this.headers ?? {},
      }).text();

      if (!Playlist) throw new Error("No Stream Found!");
      let Segments = Playlist.split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("https://"));

      if (Segments.length <= 0) throw new Error("No Segments Found!");

      this.Segments = Segments;
      this.totalSegments = Segments.length;
      this.currentSegments = 0;

      if (this.subtitles && this.subtitles.length > 0) {
        this.totalSegments += this.subtitles.length;
      }

      this.logProgress();
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

  async DownloadStart() {
    try {
      let FailedSegments = 0;
      this.writer = fs.createWriteStream(this.SegmentsFile, {
        flags: "a",
        encoding: null,
      });
      this.writer.on("error", (err) => {
        throw err;
      });

      while (this.Segments.length > 0) {
        try {
          let Segment = this.Segments[0];
          if (!Segment) throw new Error("[ STOPPING ] Segment Missing!");
          await this.appendSegment(Segment);
          this.Segments.shift();
          this.currentSegments++;
          await this.logProgress();
        } catch (err) {
          if (FailedSegments > 3)
            throw new Error(
              "[ STOPPING ] '3' Times Segment Failed To Download!"
            );
          FailedSegments++;
          this.logProgress(`Failed To Download Segment! ( Continuing in 5s )`);
          console.log(err);
          await new Promise((res) => setTimeout(res, 5000)); // 5s delay
        }
      }

      await new Promise((resolve) => {
        this.writer.end(resolve);
      });
    } catch (err) {
      throw new Error(err);
    }
  }

  async appendSegment(segmentUrl) {
    try {
      const response = await got(segmentUrl, {
        headers: this.headers ?? {},
        responseType: "buffer",
      });

      await new Promise((resolve, reject) => {
        this.writer.write(response.body, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    } catch (err) {
      throw err;
    }
  }

  // Check Subtitles & download
  async CheckSubtitles() {
    if (this.subtitles.length === 0) return;

    try {
      const episodeDir = path.join(this.directory, `subtitles_${this.Epnum}`);

      if (!fs.existsSync(episodeDir)) {
        fs.mkdirSync(episodeDir, { recursive: true });
      }

      const downloadPromises = this.subtitles.map(async ({ url, lang }) => {
        let subtitlePath = path.join(episodeDir, `${this.Epnum}_${lang}.`);

        let subtitleData = await got(url).text();

        if (
          (url.split(".").pop() === "vtt" && this.ChangeTosrt) ||
          this.MergeSubtitles
        ) {
          subtitlePath += "srt";
          subtitleData = this.convertToSRT(subtitleData);
        } else {
          subtitlePath += `${url.split(".").pop()}`;
        }

        try {
          await fs.promises.writeFile(subtitlePath, subtitleData, "utf8");
          this.downloadedPaths.push(subtitlePath);
        } catch (err) {
          logger.error(`Failed to download subtitle (${lang})`);
          logger.error(`Error message: ${err.message}`);
          logger.error(`Stack trace: ${err.stack}`);
        }
      });
      await Promise.all(downloadPromises);
      this.currentSegments += this.subtitles.length;
    } catch (err) {
      logger.error(`Failed to process subtitles`);
      logger.error(`Error message: ${err.message}`);
      logger.error(`Stack trace: ${err.stack}`);
    }
  }

  // Convert To Srt
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
      return content;
    }
  }

  // Merge .ts & subtitles to mp4
  async MergeSegments() {
    try {
      const ffmpegArgs = ["-y", "-i", this.SegmentsFile];

      if (this.MergeSubtitles && this.downloadedPaths.length > 0) {
        this.downloadedPaths.forEach((filePath) => {
          const cleanPath = filePath.replace(/[)\}]+$/, "");
          ffmpegArgs.push("-i", cleanPath);
        });

        ffmpegArgs.push("-map", "0:v", "-map", "0:a");

        this.downloadedPaths.forEach((_, index) => {
          ffmpegArgs.push("-map", `${index + 1}`);
        });

        ffmpegArgs.push("-bsf:a", "aac_adtstoasc");

        ffmpegArgs.push("-c:v", "copy", "-c:a", "copy", "-c:s", "mov_text");

        this.downloadedPaths.forEach((filePath, index) => {
          const lang = this.getLangCodeFromFilename(filePath);
          ffmpegArgs.push(`-metadata:s:s:${index}`, `language=${lang}`);
        });
      }

      ffmpegArgs.push(this.mp4);

      await new Promise((resolve, reject) => {
        const child = spawn(ffmpegPath, ffmpegArgs);
        child.on("close", (code) => {
          if (code !== 0)
            return reject(new Error(`FFmpeg exited with code ${code}`));
          resolve();
        });
      });

      this.currentSegments++;
      await this.logProgress();
      await this.CleanEverything();
    } catch (err) {
      await this.CleanEverything(true);
      throw err;
    }
  }

  getLangCodeFromFilename(filePath) {
    let FileName = path?.basename(filePath)?.split("_")?.[1];
    if (!FileName) return "und";
    FileName =
      FileName?.split(".srt")?.[0]?.slice(0, 3)?.toLocaleLowerCase() ?? "und";
    return FileName;
  }

  async logProgress(ExtraMessage) {
    let caption = this.caption;
    if (this.currentSegments >= this.totalSegments - 3) {
      caption = caption.replace("Downloading", "Merging");
    }

    if (ExtraMessage) caption += ExtraMessage;

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
      logger.error("Error updating download progress");
      logger.error(`Error message: ${err.message}`);
      logger.error(`Stack trace: ${err.stack}`);
    });
  }

  async CleanEverything(everything = false) {
    // remove ts file
    await fs.promises.unlink(this.SegmentsFile).catch(() => {});

    // remove mp4 ( only on error )
    if (everything) {
      await fs.promises.unlink(this.mp4).catch(() => {});
    }

    // remove all subtitles ( error / MergeSubtitles )
    if (
      (everything || this.MergeSubtitles) &&
      this.downloadedPaths?.length > 0
    ) {
      await fs.promises
        .rm(path.join(this.directory, `subtitles_${this.Epnum}`), {
          recursive: true,
          force: true,
        })
        .catch(() => {});
    }
  }
}

async function download(args) {
  let obj = new downloader(args);
  try {
    await obj.DownloadsChecking();
    await obj.DownloadStart();
    await obj.CheckSubtitles();
    await obj.MergeSegments();
  } catch (err) {
    await obj.CleanEverything();
    console.log(err);
    logger.error(err);
    throw new Error(err);
  }
}

module.exports = { download };
