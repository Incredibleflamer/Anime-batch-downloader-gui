// libs
const { app } = require("electron");
const SimplDB = require("simpl.db");
const Module = require("module");
const path = require("path");
const got = require("got");
const fs = require("fs");

// Functions
const {
  getDownloadsFolder,
  ensureDirectoryExists,
} = require("./DirectoryMaker");
const { MalRefreshTokenGen } = require("./mal.js");
const { StartDiscordRPC, StopDiscordRPC } = require("./discord");
const { logger } = require("./AppLogger.js");

// database create [ gets created in /user/your_name/AppData/Roaming ]
const userDataPath = app.getPath("userData");
const DatabaseFilePath = path.join(userDataPath, "database.json");
const settings = new SimplDB({ dataFile: DatabaseFilePath });

const appNodeModules = path.join(__dirname, "..", "..", "node_modules");

let config = [],
  ScraperAnime,
  ScraperManga;
global.Anime_providers = {};
global.Manga_providers = {};

CheckScrapperFolderExists();

// update the settings
async function settingupdate({
  quality = null,
  mal_on_off = null,
  status = null,
  malToken = null,
  autotrack = null,
  CustomDownloadLocation = null,
  Animeprovider = null,
  Mangaprovider = null,
  Pagination = null,
  autoLoadNextChapter = null,
  enableDiscordRPC = null,
}) {
  const currentSettings = settings.get("config");

  if (mal_on_off === "logout") {
    mal_on_off = false;
    malToken = null;
  } else {
    if (malToken === null) malToken = currentSettings?.malToken || null;
    if (malToken !== null) {
      mal_on_off = true;
    } else {
      mal_on_off = false;
    }
  }

  if (autotrack === null) autotrack = currentSettings?.autotrack || "off";
  if (status === null) status = currentSettings?.status || "plan_to_watch";

  if (quality === null) {
    quality = currentSettings.quality || "1080p";
  }

  if (Animeprovider === null) {
    Animeprovider = currentSettings?.Animeprovider || null;
  }

  if (Mangaprovider === null) {
    Mangaprovider = currentSettings?.Mangaprovider || null;
  }

  if (autoLoadNextChapter === null) {
    autoLoadNextChapter = currentSettings?.autoLoadNextChapter || "on";
  }

  if (Pagination === null) {
    Pagination = currentSettings?.Pagination || "off";
  }

  if (enableDiscordRPC === null) {
    enableDiscordRPC = currentSettings?.enableDiscordRPC || "off";
  }

  if (CustomDownloadLocation === null) {
    CustomDownloadLocation =
      currentSettings?.CustomDownloadLocation || getDownloadsFolder();
  }

  config.quality = quality;
  config.mal_on_off = mal_on_off;
  config.status = status;
  config.malToken = malToken;
  config.autotrack = autotrack;
  config.CustomDownloadLocation = CustomDownloadLocation;
  config.Animeprovider = Animeprovider;
  config.Mangaprovider = Mangaprovider;
  config.Pagination = Pagination;
  config.autoLoadNextChapter = autoLoadNextChapter;
  config.enableDiscordRPC = enableDiscordRPC;

  if (config.enableDiscordRPC === "on") {
    try {
      await StartDiscordRPC();
      logger.info("Discord RPC Activated");
    } catch (err) {
      config.enableDiscordRPC = "off";
      logger.error(err);
      logger.info("Discord RPC DISABLED");
    }
  } else {
    let stopped = await StopDiscordRPC();
    if (stopped) logger.info("Discord RPC DISABLED");
  }

  await settingSave();
  return {
    quality,
    mal_on_off,
    status,
    autotrack,
    Animeprovider,
    Mangaprovider,
    Pagination,
    autoLoadNextChapter,
    enableDiscordRPC,
  };
}

// returns valid settings
async function settingfetch() {
  try {
    let changes = false;
    // making sure download folder exists
    if (!config?.CustomDownloadLocation) {
      config.CustomDownloadLocation = getDownloadsFolder();
      changes = true;
    }

    // if downloads folder exists check if its can be access
    if (config?.CustomDownloadLocation) {
      try {
        await ensureDirectoryExists(config?.CustomDownloadLocation);
      } catch (error) {
        console.log(error);
        config.CustomDownloadLocation = getDownloadsFolder();
        changes = true;
      }
    }
    // checking Animeprovider is valid
    if (
      !config?.Animeprovider ||
      !global.Anime_providers.hasOwnProperty(config?.Animeprovider)
    ) {
      config.Animeprovider = null;
      changes = true;
    }

    // checking quality
    if (
      !config?.quality ||
      !["1080p", "720p", "360p"].includes(config?.quality)
    ) {
      config.quality = "1080p";
      changes = true;
    }

    // checking Mangaprovider is valid
    if (
      !config?.Mangaprovider ||
      !global.Manga_providers.hasOwnProperty(config?.Mangaprovider)
    ) {
      config.Mangaprovider = "weebcentral";
      changes = true;
    }

    if (changes) {
      await settingSave();
    }

    return config;
  } catch (err) {
    logger.error("Failed To Update Settings");
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
  }
}

// load settings
async function SettingsLoad() {
  try {
    const storedConfig = await settings.get("config");
    config =
      storedConfig && typeof storedConfig === "object"
        ? storedConfig
        : {
            quality: "1080p",
            mal_on_off: false,
            status: "plan_to_watch",
            malToken: null,
            CustomDownloadLocation: getDownloadsFolder(),
            Animeprovider: null,
            Mangaprovider: "weebcentral",
            autoLoadNextChapter: "on",
            Pagination: "off",
            enableDiscordRPC: "off",
          };

    if (config.malToken != null) {
      let Tosave = await MalRefreshTokenGen(config.malToken);
      await settingupdate(Tosave);
    }
    if (config?.enableDiscordRPC === "on") {
      try {
        await StartDiscordRPC();
        logger.info("Discord RPC Activated");
      } catch (err) {
        logger.error(err);
      }
    }
    await settingSave();
  } catch (err) {
    logger.error("Failed To Load Config");
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
  }
}

// fetch which provider
async function providerFetch(Type = "Anime", provider) {
  if (!provider)
    provider = Type === "Anime" ? config?.Animeprovider : config?.Mangaprovider;

  return Type === "Anime"
    ? {
        provider_name:
          provider && global.Anime_providers[provider] ? provider : null,
        provider:
          provider && global.Anime_providers[provider]
            ? global.Anime_providers[provider]
            : null,
      }
    : {
        provider_name:
          provider && global.Manga_providers[provider]
            ? provider
            : "weebcentral",
        provider:
          provider && global.Manga_providers[provider]
            ? global.Manga_providers[provider]
            : global.Manga_providers["weebcentral"],
      };
}

// sync the config with database
async function settingSave() {
  try {
    await settings.set("config", config);
    await settings.save();
  } catch (err) {
    logger.error("Failed To Save Settings");
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
  }
}

// Check Folder Exists
async function CheckScrapperFolderExists() {
  const Scraper = path.join(userDataPath, "scrapers");
  if (!fs.existsSync(Scraper)) fs.mkdirSync(Scraper, { recursive: true });

  ScraperAnime = path.join(Scraper, "Anime");
  if (!fs.existsSync(ScraperAnime))
    fs.mkdirSync(ScraperAnime, { recursive: true });

  ScraperManga = path.join(Scraper, "Manga");
  if (!fs.existsSync(ScraperManga))
    fs.mkdirSync(ScraperManga, { recursive: true });
}

// Patch Module Path
function patchModulePaths() {
  const oldResolveLookupPaths = Module._resolveLookupPaths;

  Module._resolveLookupPaths = function (request, parent, newReturn) {
    const result = oldResolveLookupPaths.call(this, request, parent, newReturn);
    const paths = newReturn ? result[1] : result;

    if (!paths.includes(appNodeModules)) {
      paths.unshift(appNodeModules);
    }

    return newReturn ? [result[0], paths] : paths;
  };
}

// Load All downloaded Scrapers
function loadAllScrapers() {
  for (const key of Object.keys(global.Anime_providers)) {
    delete global.Anime_providers[key];
  }

  for (const key of Object.keys(global.Manga_providers)) {
    delete global.Manga_providers[key];
  }

  const files = [
    ...fs
      .readdirSync(ScraperAnime)
      .filter((f) => f.endsWith(".js"))
      .map((f) => ({ type: "anime", path: path.join(ScraperAnime, f) })),
    ...fs
      .readdirSync(ScraperManga)
      .filter((f) => f.endsWith(".js"))
      .map((f) => ({ type: "manga", path: path.join(ScraperManga, f) })),
  ];

  for (const { type, path: fullPath } of files) {
    try {
      delete require.cache[require.resolve(fullPath)];
      const scraper = require(fullPath);
      if (scraper?.name) {
        if (type === "anime") {
          global.Anime_providers[scraper.name] = scraper;
        } else if (type === "manga") {
          global.Manga_providers[scraper.name] = scraper;
        }
      } else {
        logger.warn(`Scraper ${fullPath} does not export a 'name' property`);
      }
    } catch (error) {
      logger.error(`Failed to load scraper ${fullPath}: ${error.message}`);
    }
  }

  global.win.webContents.send("extention-updated", {
    Anime: Object.entries(global.Anime_providers || {}).map(([key, val]) => ({
      name: key,
      version: val.version,
    })),
    Manga: Object.entries(global.Manga_providers || {}).map(([key, val]) => ({
      name: key,
      version: val.version,
    })),
  });
}

// Download / Delete Scrapper
async function HandleExtensions(TaskType, AnimeManga, ExtensionName) {
  const extensionPath = path.join(
    `${AnimeManga === "Anime" ? ScraperAnime : ScraperManga}`,
    `${ExtensionName}.js`
  );
  if (TaskType === "add") {
    try {
      const response = await got(
        `https://raw.githubusercontent.com/TheYogMehta/extensions/refs/heads/main/extensions/${AnimeManga}/${ExtensionName}.js`
      );
      fs.writeFileSync(extensionPath, response.body, "utf-8");
      loadAllScrapers();
      return {
        type: "success",
        title: `${AnimeManga} Extention Installed!`,
        msg: `${ExtensionName} Added Successfully.`,
      };
    } catch (error) {
      return {
        type: "error",
        title: "Failed to Install Extention!",
        msg: `Failed to Add ${ExtensionName} : ${error.message}`,
      };
    }
  } else if (TaskType === "remove") {
    if (fs.existsSync(extensionPath)) {
      fs.unlinkSync(extensionPath);
      loadAllScrapers();
      return {
        type: "success",
        title: `Removed ${AnimeManga} Extention!`,
        msg: `${ExtensionName} removed successfully.`,
      };
    } else {
      return {
        type: "error",
        title: `Failed to Remove ${AnimeManga} Extention!`,
        msg: `${ExtensionName} does not exist.`,
      };
    }
  } else {
    return {
      type: "error",
      title: "Something Is Not Right...",
      msg: "Not a valid request!",
    };
  }
}

module.exports = {
  settingupdate,
  settingfetch,
  settingSave,
  SettingsLoad,
  providerFetch,
  loadAllScrapers,
  HandleExtensions,
  patchModulePaths,
};
