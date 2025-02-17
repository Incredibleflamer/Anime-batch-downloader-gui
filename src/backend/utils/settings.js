// libs
const { app } = require("electron");
const path = require("path");
const SimplDB = require("simpl.db");
const {
  getDownloadsFolder,
  ensureDirectoryExists,
} = require("./DirectoryMaker");

// database create [ gets created in /user/your_name/AppData/Roaming ]
const userDataPath = app.getPath("userData");
const DatabaseFilePath = path.join(userDataPath, "database.json");
const settings = new SimplDB({ dataFile: DatabaseFilePath });

let config = [];

const Anime_providers = {
  hianime: require("../Scrappers/hianime"),
  pahe: require("../Scrappers/animepahe"),
  animekai: require("../Scrappers/AnimeKai"),
  // anivibe: require("../Scrappers/anivibe"),
};

const Manga_providers = {
  weebcentral: require("../Scrappers/weebcentral"),
};

// update the settings
async function settingupdate({
  quality = null,
  // mal_on_off = null,
  // status = null,
  // malToken = null,
  // autotrack = null,
  CustomDownloadLocation = null,
  Animeprovider = null,
  Mangaprovider = null,
  mergeSubtitles = null,
  subtitleFormat = null,
  Pagination = null,
  concurrentDownloads = null,
  subDub = null,
}) {
  const currentSettings = settings.get("config");
  // quality
  if (quality === null) {
    quality = currentSettings.quality || "1080p";
  }
  if (!quality) {
    throw new Error("Quality parameter is required.");
  }
  // mal on off
  // if (mal_on_off === "logout") {
  //   mal_on_off = false;
  //   malToken = null;
  // } else {
  //   if (malToken === null) malToken = currentSettings?.malToken || null;
  //   if (malToken !== null) {
  //     mal_on_off = true;
  //   } else {
  //     mal_on_off = false;
  //   }
  // }
  // auto track anime as watched
  // if (autotrack === null) autotrack = currentSettings?.autotrack || "off";
  // status
  // if (status === null) status = currentSettings?.status || "plan_to_watch";
  // provider
  if (Animeprovider === null)
    Animeprovider = currentSettings?.Animeprovider || "hianime";
  if (Mangaprovider === null)
    Mangaprovider = currentSettings?.Mangaprovider || "weebcentral";
  // mergeSubtitles
  if (mergeSubtitles === null)
    mergeSubtitles = currentSettings?.mergeSubtitles || "on";
  // Pagination
  if (Pagination === null) Pagination = currentSettings?.Pagination || "off";
  // concurrentDownloads
  if (concurrentDownloads === null) {
    concurrentDownloads = currentSettings?.concurrentDownloads || 5;
  } else {
    concurrentDownloads = parseInt(concurrentDownloads) || 5;
  }
  if (subtitleFormat === null)
    subtitleFormat = currentSettings?.subtitleFormat || "ttv";

  if (subDub === null) subDub = currentSettings?.subDub || "sub";

  // quality
  config.quality = quality;
  // mal on off
  // config.mal_on_off = mal_on_off;
  // mal status
  // config.status = status;
  // mal access_token
  // config.malToken = malToken;
  // mal auto track ep
  // config.autotrack = autotrack;
  // custom dir
  config.CustomDownloadLocation = CustomDownloadLocation;
  // provider
  config.Animeprovider = Animeprovider;
  config.Mangaprovider = Mangaprovider;
  // mergeSubtitles
  config.mergeSubtitles = mergeSubtitles;
  // Pagination
  config.Pagination = Pagination;
  // concurrentDownloads
  config.concurrentDownloads = concurrentDownloads;
  // subtitleFormat
  config.subtitleFormat = subtitleFormat;
  // subDub
  config.subDub = subDub;

  await settingSave();
  // return config
  return {
    quality,
    // mal_on_off,
    // status,
    // autotrack,
    Animeprovider,
    Mangaprovider,
    mergeSubtitles,
    Pagination,
    concurrentDownloads,
    subtitleFormat,
    subDub,
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

    // checking mergeSubtitles
    if (
      !config?.mergeSubtitles ||
      !["on", "off"].includes(config?.mergeSubtitles)
    ) {
      config.mergeSubtitles = "on";
      changes = true;
    }

    // checking subtitle format
    if (
      !config?.subtitleFormat ||
      !["ttv", "srt"].includes(config?.subtitleFormat)
    ) {
      config.subtitleFormat = "ttv";
      changes = true;
    }

    // checking subDub
    if (!config?.subDub) {
      config.subDub = "sub";
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
    console.log(err);
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
            // mal_on_off: false,
            // status: "plan_to_watch",
            // malToken: null,
            CustomDownloadLocation: getDownloadsFolder(),
            Animeprovider: "hianime",
            Mangaprovider: "weebcentral",
            mergeSubtitles: "on",
            subtitleFormat: "ttv",
            Pagination: "off",
            concurrentDownloads: 5,
            subDub: "sub",
          };

    // if (config.malToken != null) {
    //   await refresh_token(config.malToken);
    //   await MalLogin(token);
    // }
    await settingSave();
  } catch (err) {
    console.log(err);
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
    console.log(err);
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
