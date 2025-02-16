//====================================== Anime ================================
// find popular anime
async function latestAnime(provider, page) {
  const data = await provider.fetchRecentEpisodes(page);
  return data;
}
// search anime
async function animesearch(provider, Anime_NAME, page) {
  if (!page) page = 1;
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
async function findanime(provider, Anime_NAME, page) {
  const data = await provider.SearchAnime(Anime_NAME, page);
  if (data.results.length <= 0) {
    throw new Error(`No Anime Found With This Name`);
  } else
    return {
      data: data.results,
      hasNextPage: data.hasNextPage,
      currentPage: data.currentPage,
    };
}
// anime info
async function animeinfo(provider, animeId, ExtraParameters = {}) {
  const data = await provider.AnimeInfo(animeId, ExtraParameters);
  return data;
}
// fetch m3u8 links
async function fetchEpisodeSources(provider, episodeId) {
  const sources = await provider.fetchEpisodeSources(episodeId);
  return sources;
}

//====================================== Manga ================================
const PDFDocument = require("pdfkit");
const fs = require("fs");
const axios = require("axios");
const HLSLogger = require("./logger");

// Latest Manga
async function latestMangas(provider, Page = 1) {
  return await provider.latestManga(Page);
}

// Manga Search
async function MangaSearch(provider, MANGA_NAME, PAGE = 1) {
  try {
    return await provider.searchManga(MANGA_NAME, PAGE);
  } catch (err) {
    throw new Error(`No Manga found.. ${err}`);
  }
}

// Manga Info
async function MangaInfo(provider, MANGA_ID) {
  let info = await provider.fetchMangaInfo(MANGA_ID);
  info.chapters.reverse();
  return info;
}

// Chapters Fetch
async function MangaChapterFetch(provider, MangaChapterID) {
  return await provider.fetchChapterPages(MangaChapterID);
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
    const doc = new PDFDocument({ autoFirstPage: false });
    const stream = fs.createWriteStream(outputFile);
    doc.pipe(stream);

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
      const image = doc.openImage(imageBuffer);

      doc.addPage({ size: [image.width, image.height] });

      doc.image(imageBuffer, 0, 0, {
        width: image.width,
        height: image.height,
      });

      logger.currentSegments = i + 1;
      logger.logProgress();
    }

    doc.end();
  } catch (error) {
    throw new Error(error);
  }
}

// Download Chapter Images Utils
async function downloadImage(url) {
  const response = await axios({
    url,
    responseType: "arraybuffer",
  });
  return Buffer.from(response.data, "binary");
}

module.exports = {
  latestAnime,
  animesearch,
  animeinfo,
  fetchEpisodeSources,
  latestMangas,
  MangaSearch,
  MangaInfo,
  MangaChapterFetch,
  DownloadChapters,
};
