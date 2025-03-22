const { FindMapping } = require("./Metadata");
const NodeCache = require("node-cache");
const HLSLogger = require("./logger");
const JSZip = require("jszip");
const axios = require("axios");
const fs = require("fs");

const cache = new NodeCache({ stdTTL: 60, checkperiod: 60 });

//====================================== Anime ================================
// find popular anime
async function latestAnime(provider, page = 1) {
  const cacheKey = `latestanime_${provider.provider_name}_${page}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  const data = await provider.provider.fetchRecentEpisodes(page);
  cache.set(cacheKey, data, 60);
  return data;
}

// search anime
async function animesearch(provider, Anime_NAME, page = 1) {
  let dataarray = { results: [] };
  const formattedAnimeName = Anime_NAME.replace(/\w\S*/g, (word) => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
  let datafirst;
  try {
    datafirst = await findanime(provider, formattedAnimeName, page);
    if (
      !datafirst ||
      !datafirst?.data ||
      !datafirst?.data?.length ||
      datafirst?.data?.length <= 0
    ) {
      datafirst = await findanime(provider, Anime_NAME, page);
    }

    if (datafirst) {
      // results
      if (datafirst.data && datafirst.data.length > 0) {
        dataarray.results.push(...datafirst.data);
      }
      // next page
      if (datafirst?.hasNextPage) {
        dataarray.hasNextPage = datafirst.hasNextPage;
      } else {
        dataarray.hasNextPage = false;
      }
      // currentPage
      if (datafirst?.currentPage) {
        dataarray.currentPage = datafirst.currentPage;
      } else {
        dataarray.currentPage = page + 1;
      }
    }
  } catch (err) {
    throw new Error("No anime found..");
  }
  return dataarray;
}

// find more anime
async function findanime(provider, Anime_NAME, page = 1) {
  const cacheKey = `animesearch_${provider.provider_name}_${Anime_NAME}_${page}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  const data = await provider.provider.SearchAnime(Anime_NAME, page);

  if (data.results.length <= 0) {
    throw new Error(`No Anime Found With This Name`);
  } else {
    cache.set(
      cacheKey,
      {
        data: data.results,
        hasNextPage: data.hasNextPage,
        currentPage: data.currentPage,
      },
      60
    );

    return {
      data: data.results,
      hasNextPage: data.hasNextPage,
      currentPage: data.currentPage,
    };
  }
}

// anime info
async function animeinfo(provider, dir, animeId, MalFetch = true) {
  const cacheKey = `animeinfo_${provider.provider_name}_${animeId}`;
  let cachedData = cache.get(cacheKey);

  if (cachedData) {
    if (
      global?.MalLoggedIn &&
      cachedData?.MalLoggedIn &&
      cachedData?.malid &&
      MalFetch
    ) {
      let MyAnimeListData = await FindMapping(
        "Anime",
        cachedData?.id,
        cachedData?.malid,
        cachedData?.title,
        dir
      );
      cachedData = { ...cachedData, ...MyAnimeListData, MalLoggedIn: true };
    }
    return cachedData;
  }

  let data = await provider.provider.AnimeInfo(animeId);

  if (MalFetch) {
    let MyAnimeListData = await FindMapping(
      "Anime",
      data?.id,
      data?.malid,
      data?.title,
      dir
    );

    if (MyAnimeListData) {
      data = {
        ...data,
        ...MyAnimeListData,
      };
    }

    if (global?.MalLoggedIn) {
      data = { ...data, MalLoggedIn: true };
    }
  }

  cache.set(cacheKey, data, 60);
  return data;
}

// anime fetch ep list
async function fetchEpisode(provider, id, page = 1) {
  try {
    const cacheKey = `animeeplist_${provider.provider_name}_${id}_${page}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const data = await provider.provider.fetchEpisode(id, page);
    cache.set(cacheKey, data, 60);
    return data;
  } catch (err) {
    throw err;
  }
}

// fetch m3u8 links
async function fetchEpisodeSources(provider, episodeId) {
  const cacheKey = `animeepisodesources_${provider.provider_name}_${episodeId}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  const sources = await provider.provider.fetchEpisodeSources(episodeId);
  cache.set(cacheKey, sources, 60);
  return sources;
}

//====================================== Manga ================================

// Latest Manga
async function latestMangas(provider, Page = 1) {
  const cacheKey = `latestmanga_${provider.provider_name}_${Page}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  let data = await provider.provider.latestManga(Page);
  cache.set(cacheKey, data, 60);
  return data;
}

// Manga Search
async function MangaSearch(provider, MANGA_NAME, PAGE = 1) {
  try {
    const cacheKey = `mangasearch_${provider.provider_name}_${MANGA_NAME}_${PAGE}`;
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const data = await provider.provider.searchManga(MANGA_NAME, PAGE);
    cache.set(cacheKey, data, 60);
    return data;
  } catch (err) {
    throw new Error(`No Manga found.. ${err}`);
  }
}

// Manga Info
async function MangaInfo(provider, MANGA_ID) {
  const cacheKey = `mangainfo${provider.provider_name}_${MANGA_ID}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  let info = await provider.provider.fetchMangaInfo(MANGA_ID);
  cache.set(cacheKey, info, 60);
  return info;
}

// Manga
async function fetchChapters(provider, MANGA_ID) {
  const cacheKey = `mangachapters${provider.provider_name}_${MANGA_ID}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  let info = await provider.provider.fetchChapters(MANGA_ID);
  cache.set(cacheKey, info, 60);
  return info;
}

// Chapters Fetch
async function MangaChapterFetch(provider, MangaChapterID) {
  const cacheKey = `mangachapterfetch_${provider.provider_name}_${MangaChapterID}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  const data = await provider.provider.fetchChapterPages(MangaChapterID);
  cache.set(cacheKey, data, 60);
  return data;
}

// Download Chapters
async function DownloadChapters(
  outputFile,
  pages,
  Title,
  ChapterName,
  MangaChapterID
) {
  try {
    const zip = new JSZip();

    const logger = new HLSLogger(
      `Downloading ${Title} || ${ChapterName}`,
      `${MangaChapterID}`,
      0,
      false
    );

    logger.totalSegments = pages.length - 1;

    for (let i = 0; i < pages.length; i++) {
      const imageUrl = pages[i]?.img;
      if (!imageUrl) {
        logger.currentSegments = i + 1;
        logger.logProgress();
        continue;
      }

      const imageBuffer = await downloadImage(imageUrl);

      const fileExtension = imageUrl.split(".").pop().split(/\#|\?/)[0];
      const fileName = `${i + 1}.${fileExtension}`;

      zip.file(fileName, imageBuffer);

      logger.currentSegments = i + 1;
      logger.logProgress();
    }

    const cbzBuffer = await zip.generateAsync({ type: "nodebuffer" });
    fs.writeFileSync(outputFile, cbzBuffer);
  } catch (error) {
    throw new Error(error);
  }
}

// Download Chapter Images Utils
async function downloadImage(url) {
  url = url.split("/proxy/image?weebcentral=")[1];
  if (url) {
    url = decodeURIComponent(url);
    const response = await axios(url, {
      responseType: "arraybuffer",
      headers: {
        Referer: "https://weebcentral.com/",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
      },
    });
    return Buffer.from(response.data, "binary");
  }
  return null;
}

module.exports = {
  latestAnime,
  animesearch,
  animeinfo,
  fetchEpisodeSources,
  fetchEpisode,
  latestMangas,
  MangaSearch,
  MangaInfo,
  MangaChapterFetch,
  DownloadChapters,
  fetchChapters,
};
