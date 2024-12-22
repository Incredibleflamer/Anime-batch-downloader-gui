const axios = require("axios");
const cheerio = require("cheerio");

const baseurl = "https://anivibe.net";

async function fetchRecentEpisodes(page = 1) {
  const res = {
    currentPage: page,
    hasNextPage: false,
    results: [],
  };

  try {
    const { data } = await axios.get(`${baseurl}/newest?page=${page}`);

    const $ = cheerio.load(data);
    console.log($);

    const results = [];

    $(".bsx").each((_, ele) => {
      const card = $(ele);
      const anime = scrapeCard(card);
      if (anime) results.push(anime);
    });

    res.results = results;
    res.hasNextPage = $(".pagination .next").length > 0;
    return res;
  } catch (error) {
    console.error("Error fetching data:", error.message);
    return res;
  }
}

async function SearchAnime(query, page = 1) {
  const res = {
    currentPage: page,
    hasNextPage: false,
    results: [],
  };

  try {
    const { data } = await axios.get(
      `${baseurl}/search.html?keyword=${query}&page=${page}`
    );

    const $ = cheerio.load(data);

    const results = [];

    $(".bsx").each((_, ele) => {
      const card = $(ele);
      const anime = scrapeCard(card);
      if (anime) results.push(anime);
    });

    res.results = results;
    res.hasNextPage = $(".pagination .next").length > 0;
    return res;
  } catch (error) {
    console.error("Error searching results:", error.message);
    return [];
  }
}

function scrapeCard(card) {
  const title = card.find(".tip").attr("title") || "";
  const id = (card.find(".tip").attr("href") || "").split("/series/")[1] || "";
  const type = card.find(".typez").text().trim() || "";
  const epx = card.find(".epx").text().trim() || "";
  const languages = [];
  card.find(".sb").each((_, ele) => {
    const language = cheerio.load(ele).text().trim();
    if (language) languages.push(language);
  });

  const image = card.find("img").attr("src") || "";
  if (title && id && image) {
    return { title, id, type, epx, languages, image };
  }
  return null;
}

async function AnimeInfo(id) {
  try {
    const { data } = await axios.get(`${baseurl}/series/${id}`);

    const $ = cheerio.load(data);

    const title =
      $(".entry-title.d-title").attr("data-en") ||
      $(".entry-title.d-title").text().trim();

    const image = $(".thumbook > div.thumb > img").attr("src");

    const genres = [];
    $(".genxed a").each((_, el) => {
      genres.push($(el).text().trim());
    });

    const description = $(".entry-content").text().trim();

    const episodeList = [];
    $(".eplister ul li").each((_, el) => {
      const episodeId = $(el).find("a").attr("href");
      const episodeTitle = $(el).find(".epl-title").text().trim();
      const number = parseInt($(el).find(".epl-num").text().trim(), 10);

      if (episodeId && episodeTitle && !isNaN(number)) {
        episodeList.push({
          episodeId: episodeId,
          title: episodeTitle,
          number,
        });
      }
    });
    return {
      image,
      title,
      genres,
      totalEpisodes: episodeList.length,
      description,
      episodes: episodeList.reverse(),
    };
  } catch (error) {
    console.error("Error fetching episodes:", error.message);
    return null;
  }
}

// sub = 0 & dub = 1
async function scrapeEpisodeSources(episodeId) {
  try {
    const { data } = await axios.get(`${baseurl}/${episodeId}`);

    const $ = cheerio.load(data);

    const scriptTags = $("script").toArray();
    for (const scriptTag of scriptTags) {
      const scriptContent = $(scriptTag).html();
      if (scriptContent.includes("loadIframePlayer")) {
        const jsonStart = scriptContent.indexOf("loadIframePlayer(") + 18;
        const jsonEnd = scriptContent.indexOf("]", jsonStart) + 1;
        const jsonString = scriptContent.substring(jsonStart, jsonEnd);

        try {
          const jsonData = JSON.parse(jsonString);
          return jsonData;
        } catch (e) {
          console.log("Error parsing JSON:", e.message);
        }
        break;
      }
    }
  } catch (error) {
    console.log("Error fetching episode sources:", error.message);
    return null;
  }
}

module.exports = {
  fetchRecentEpisodes,
  SearchAnime,
  AnimeInfo,
  scrapeEpisodeSources,
};
