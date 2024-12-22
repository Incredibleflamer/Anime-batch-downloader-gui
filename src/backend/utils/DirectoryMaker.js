// libs
const fs_extra = require("fs-extra");
const path = require("path");
const fs = require("fs");
const os = require("os");

// Anime Dir Maker
async function directoryMaker(title, ep, customdir) {
  let customdirneko = customdir || getDownloadsFolder();
  let destination;
  try {
    await fs.promises.access(customdirneko);
    destination = customdirneko;
  } catch (err) {
    if (err.code === "ENOENT") {
      destination = path.join(
        process.env.PORTABLE_EXECUTABLE_DIR || process.cwd()
      );
    }
  }
  //Anime dir Making
  const animeDirectory = path.join(destination, `./Anime`);
  try {
    await fs.promises.access(animeDirectory);
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.promises.mkdir(animeDirectory);
    } else {
      throw error;
    }
  }
  //Anime Name Dir
  const directoryName = title.replace(/[^a-zA-Z0-9]/g, "_");
  const directoryPath = path.join(animeDirectory, directoryName);
  try {
    await fs.promises.access(directoryPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.promises.mkdir(directoryPath);
    } else {
      throw error;
    }
  }
  //Temp of eps
  const tempeps = path.join(animeDirectory, directoryName, `Temp_${ep}/`);
  try {
    await fs.promises.access(tempeps);
    await fs_extra.emptyDir(tempeps);
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.promises.mkdir(tempeps);
    } else {
      throw error;
    }
  }
  // try and check if ${episodeNumber}Ep.ts or ${episodeNumber}Ep.mp4 exists
  const mp4 = path.join(animeDirectory, directoryName, `${ep}Ep.mp4`);
  const ts = path.join(animeDirectory, directoryName, `${ep}Ep.ts`);
  try {
    await fs.promises.access(mp4);
  } catch (error) {}
  try {
    await fs.promises.access(ts);
  } catch (error) {}

  return [directoryPath, tempeps];
}

// dir + file remover
async function directoryRemover(tempeps) {
  try {
    await fs.promises.access(tempeps);
    await fs.promises.rm(tempeps, { recursive: true });
  } catch (err) {
    return;
  }
}

// Manga Dir Maker
async function MangaDir(title, customdir) {
  let customdirneko = customdir || getDownloadsFolder();
  let destination;
  try {
    await fs.promises.access(customdirneko);
    destination = customdirneko;
  } catch (err) {
    console.log(err);
    if (err.code === "ENOENT") {
      destination = path.join(
        process.env.PORTABLE_EXECUTABLE_DIR || process.cwd()
      );
    }
  }
  //Manga dir Making
  const MangaDirectory = path.join(destination, `./Manga`);
  try {
    await fs.promises.access(MangaDirectory);
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.promises.mkdir(MangaDirectory);
    } else {
      throw error;
    }
  }
  //Manga Name Dir
  const directoryName = title.replace(/[^a-zA-Z0-9]/g, "_");
  const directoryPath = path.join(MangaDirectory, directoryName);
  try {
    await fs.promises.access(directoryPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.promises.mkdir(directoryPath);
    } else {
      throw error;
    }
  }
  // Chapter pdf
  return directoryPath;
}

// download folder Location
function getDownloadsFolder() {
  const homeDir = os.homedir();
  return path.join(homeDir, "Downloads");
}

// Check Path Exists
async function ensureDirectoryExists(directoryPath) {
  if (!path.isAbsolute(directoryPath)) {
    throw new Error("Invalid directory path");
  }
  try {
    await fs.promises.access(directoryPath);
  } catch (err) {
    throw new Error("Invalid directory path");
  }
}

module.exports = {
  directoryMaker,
  directoryRemover,
  MangaDir,
  ensureDirectoryExists,
  getDownloadsFolder,
};
