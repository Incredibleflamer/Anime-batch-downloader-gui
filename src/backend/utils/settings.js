// libs
const { app } = require("electron");
const path = require("path");
const SimplDB = require("simpl.db");
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

let config = [];

const Anime_providers = {
  hianime: require("../Scrappers/hianime"),
  pahe: require("../Scrappers/animepahe"),
  // animekai: require("../Scrappers/AnimeKai"), // Disabled Untill Any Fix
  // anivibe: require("../Scrappers/anivibe"),
};

const Manga_providers = {
  weebcentral: require("../Scrappers/weebcentral"),
};

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
    Animeprovider = currentSettings?.Animeprovider || "hianime";
  }

  if (Mangaprovider === null) {
    Mangaprovider = currentSettings?.Mangaprovider || "weebcentral";
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
      !Anime_providers.hasOwnProperty(config?.Animeprovider)
    ) {
      config.Animeprovider = "hianime";
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
      !Anime_providers.hasOwnProperty(config?.Mangaprovider)
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
            Animeprovider: "hianime",
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
          provider && Anime_providers[provider] ? provider : "hianime",
        provider:
          provider && Anime_providers[provider]
            ? Anime_providers[provider]
            : Anime_providers["hianime"],
      }
    : {
        provider_name:
          provider && Manga_providers[provider] ? provider : "weebcentral",
        provider:
          provider && Manga_providers[provider]
            ? Manga_providers[provider]
            : Manga_providers["weebcentral"],
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

module.exports = {
  settingupdate,
  settingfetch,
  settingSave,
  SettingsLoad,
  providerFetch,
};
