const { app } = require("electron");
const cheerio = require("cheerio");
const domhandler = require("domhandler");
const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");

const baseUrl = "https://mangasee123.com";
const userDataPath = app.getPath("userData");
const CACHE_FILE_PATH = path.join(userDataPath, "manga_cache.json");

// Function to fetch manga information
async function fetchMangaInfo(mangaId) {
  const mangaInfo = {
    id: mangaId,
    title: "",
  };
  const url = `${baseUrl}/manga`;

  try {
    const { data } = await axios.get(`${url}/${mangaId}`);
    const $ = cheerio.load(data);
    const schemaScript = $("body > script:nth-child(15)").get()[0].children[0];

    if (domhandler.isText(schemaScript)) {
      const mainEntity = JSON.parse(schemaScript.data)["mainEntity"];
      mangaInfo.title = mainEntity["name"];
      mangaInfo.altTitles = mainEntity["alternateName"];
      mangaInfo.genres = mainEntity["genre"];
    }

    mangaInfo.image = $("img.bottom-5").attr("src");
    mangaInfo.headerForImage = { Referer: baseUrl };
    mangaInfo.description = $(".top-5 .Content").text();

    const contentScript = $("body > script:nth-child(16)").get()[0].children[0];

    if (domhandler.isText(contentScript)) {
      const chaptersData = processScriptTagVariable(
        contentScript.data,
        "vm.Chapters = "
      );
      mangaInfo.chapters = chaptersData.map((i) => {
        const chapterNumber = processChapterNumber(i["Chapter"]);
        const chapterTitle = i["ChapterName"] || `Chapter ${chapterNumber}`;
        return {
          id: `${mangaId}-chapter-${chapterNumber}`,
          title: chapterTitle,
          releaseDate: i["Date"],
        };
      });
    }

    return mangaInfo;
  } catch (err) {
    throw new Error(err.message);
  }
}

// Function to fetch chapter pages
async function fetchChapterPages(chapterId) {
  const images = [];
  const url = `${baseUrl}/read-online/${chapterId}-page-1.html`;

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const chapterScript = $("body > script:nth-child(19)").get()[0].children[0];

    if (domhandler.isText(chapterScript)) {
      const curChapter = processScriptTagVariable(
        chapterScript.data,
        "vm.CurChapter = "
      );
      const imageHost = processScriptTagVariable(
        chapterScript.data,
        "vm.CurPathName = "
      );
      const curChapterLength = Number(curChapter["Page"]);

      for (let i = 0; i < curChapterLength; i++) {
        const chapter = processChapterForImageUrl(
          chapterId.replace(/[^0-9.]/g, "")
        );
        const page = `${i + 1}`.padStart(3, "0");
        const mangaId = chapterId.split("-chapter-", 1)[0];
        const imagePath = `https://${imageHost}/manga/${mangaId}/${chapter}-${page}.png`;
        images.push(imagePath);
      }
    }

    return images.map((image, i) => ({
      page: i + 1,
      img: image,
      headerForImage: { Referer: baseUrl },
    }));
  } catch (err) {
    throw new Error(err.message);
  }
}

// Fuction Fetch Json
async function MangaSeeJsonFetch(update = false) {
  const cacheExists = await fs
    .access(CACHE_FILE_PATH)
    .then(() => true)
    .catch(() => false);

  let cache = null;

  if (cacheExists) {
    const cacheData = await fs.readFile(CACHE_FILE_PATH, "utf-8");
    cache = JSON.parse(cacheData);
  }

  if (cache && !update) {
    const now = Date.now();
    if (now - cache.timestamp < 60 * 60 * 1000) {
      return cache.data;
    }
  }

  const { data } = await axios.get(`${baseUrl}/search/?sort=lt&desc=true`);
  const $ = cheerio.load(data);
  const scripts = $("script");
  let results = null;

  scripts.each(async (index, script) => {
    const scriptContent = $(script).html();
    if (scriptContent && scriptContent.includes("vm.Directory")) {
      const directoryMatch = scriptContent.match(
        /vm\.Directory\s*=\s*(\[.*?\]);/s
      );

      if (directoryMatch && directoryMatch[1]) {
        const directoryJson = directoryMatch[1];
        try {
          const directoryData = JSON.parse(directoryJson);
          results = directoryData.map((val) => ({
            id: val["i"],
            title: val["s"],
            altTitles: val["a"],
            publishedDate: val["ls"],
            image: `https://temp.compsci88.com/cover/${val["i"]}.jpg`,
          }));
        } catch (jsonError) {
          throw new Error("Error parsing vm.Directory JSON:", jsonError);
        }
      }
    }
  });

  if (results) {
    results.sort(
      (a, b) => new Date(b.publishedDate) - new Date(a.publishedDate)
    );
    cache = {
      timestamp: Date.now(),
      data: results,
    };
    await fs.writeFile(CACHE_FILE_PATH, JSON.stringify(cache, null, 2));
  }
  return cache.data;
}

// Function to search for manga
async function search(query, page = 1) {
  try {
    const cache = await MangaSeeJsonFetch();

    const sanitizedQuery = query?.replace(/\s/g, "").toLowerCase();

    const itemsPerPage = 30;
    const startIndex = (page - 1) * itemsPerPage;

    const filteredData = cache.filter(
      (item) =>
        item.title.replace(/\s/g, "").toLowerCase().includes(sanitizedQuery) ||
        item.altTitles.some((alt) =>
          alt.replace(/\s/g, "").toLowerCase().includes(sanitizedQuery)
        )
    );

    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const paginatedData = filteredData.slice(
      startIndex,
      startIndex + itemsPerPage
    );

    return {
      currentPage: page,
      hasNextPage: page < totalPages,
      totalPages: totalPages,
      results: paginatedData,
    };
  } catch (err) {
    throw new Error(err.message);
  }
}

// Function to get the latest manga
async function latestManga(page = 1) {
  try {
    const cache = await MangaSeeJsonFetch();
    const itemsPerPage = 30;
    const totalItems = cache.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const paginatedManga = cache.slice(startIndex, startIndex + itemsPerPage);

    return {
      currentPage: page,
      hasNextPage: page < totalPages,
      totalPages: totalPages,
      results: paginatedManga,
    };
  } catch (err) {
    throw new Error(err.message);
  }
}

// Function to process script tag variable
function processScriptTagVariable(script, variable) {
  const chopFront = script.substring(
    script.search(variable) + variable.length,
    script.length
  );
  return JSON.parse(chopFront.substring(0, chopFront.search(";")));
}

// Function to process chapter number
function processChapterNumber(chapter) {
  const decimal = chapter.substring(chapter.length - 1, chapter.length);
  chapter = chapter.replace(chapter[0], "").slice(0, -1);
  if (decimal === "0") return `${+chapter}`;
  if (chapter.startsWith("0")) chapter = chapter.replace(chapter[0], "");
  return `${+chapter}.${decimal}`;
}

// Function to process chapter for image URL
function processChapterForImageUrl(chapter) {
  if (!chapter.includes(".")) return chapter.padStart(4, "0");
  const values = chapter.split(".");
  const pad = values[0].padStart(4, "0");
  return `${pad}.${values[1]}`;
}

module.exports = {
  latestManga,
  search,
  fetchChapterPages,
  fetchMangaInfo,
  MangaSeeJsonFetch,
};
