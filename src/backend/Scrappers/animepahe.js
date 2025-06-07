// imports
const { app } = require("electron");
const cheerio = require("cheerio");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
// variables
const baseUrl = "https://animepahe.ru";

// Anime Search
async function SearchAnime(query, {}) {
  try {
    const data = await global.scrapeURL(
      `${baseUrl}/api?m=search&q=${encodeURIComponent(query)}`
    );
    const res = {
      currentPage: 1,
      hasNextPage: false,
      totalPages: 1,
      results: data.data.map((item) => ({
        id: `${item.session}`,
        title: item.title,
        image: item?.poster ? item?.poster : null,
      })),
    };
    return res;
  } catch (err) {
    throw new Error(err.message);
  }
}

// Recent Episodes
async function fetchRecentEpisodes(filters = {}) {
  try {
    const data = await global.scrapeURL(
      `${baseUrl}/api?m=airing&page=${filters.page}`
    );
    const res = {
      currentPage: filters.page,
      hasNextPage: data?.next_page_url?.length > 0 ? true : false,
      totalPages: data?.last_page ?? 0,
      results: data.data.map((item) => ({
        id: `${item.anime_session}`,
        title: item.anime_title,
        image: item?.snapshot ? item?.snapshot : null,
      })),
    };
    return res;
  } catch (err) {
    throw new Error(err.message);
  }
}

// Animeinfo
async function AnimeInfo(id) {
  let suffix = id.endsWith("dub") ? "dub" : id.endsWith("sub") ? "sub" : "both";
  id = id.replace(/-(dub|sub|both)$/, "");

  const animeInfo = {
    id: `${id}-${suffix}`,
    title: "",
  };

  try {
    const data = await global.scrapeURL(`${baseUrl}/anime/${id}`);
    const $ = (0, cheerio.load)(data);

    let MalId =
      parseInt($('meta[name="myanimelist"]').attr("content") ?? null) ?? null;

    animeInfo.malid = MalId;
    animeInfo.title = $("div.title-wrapper > h1 > span").first().text();
    let image = $("div.anime-poster a").attr("href") ?? null;
    animeInfo.image = image ? image : null;
    animeInfo.description = $("div.anime-summary").text();
    animeInfo.genres = $("div.anime-genre ul li")
      .map((i, el) => $(el).find("a").attr("title"))
      .get();
    switch (
      $('div.col-sm-4.anime-info p:icontains("Status:") a').text().trim()
    ) {
      case "Currently Airing":
        animeInfo.status = "Ongoing";
        break;
      case "Finished Airing":
        animeInfo.status = "Completed";
        break;
      default:
        animeInfo.status = "Unknown";
    }

    animeInfo.type = $('div.col-sm-4.anime-info p:icontains("Type") a')
      .text()
      .trim()
      .toUpperCase();

    animeInfo.aired = $('div.col-sm-4.anime-info p:icontains("Aired")')
      .text()
      .replace("Aired:", "")
      .replaceAll("\n", " ")
      .replaceAll("  ", "")
      .trim();

    animeInfo.dataId = id;
    animeInfo.subOrDub = suffix;

    return animeInfo;
  } catch (error) {
    console.error("Error fetching data from AnimePahe:", error);
    return { results: [] };
  }
}

// Fetching Episodes Pages
async function fetchEpisode(id, page = 1) {
  try {
    let episodes = [];

    let { last_page, data, total } = await global.scrapeURL(
      `${baseUrl}/api?m=release&id=${id}&sort=episode_desc&page=${page}`
    );

    data.forEach((item) => {
      let hasEngAudio = item?.audio && item?.audio?.toLowerCase() === "eng";
      episodes.push({
        id: `${id}/${item.session}`,
        number: item.episode,
        title: item.title,
        duration: item.duration,
        lang: hasEngAudio ? "both" : "sub",
      });
    });

    return {
      episodes: episodes,
      totalPages: last_page,
      total: total,
      currentPage: page,
    };
  } catch (err) {
    return { episodes: [], totalPages: 0, total: 0, currentPage: page };
  }
}

// fetching Episodes Download Links
async function fetchEpisodeSources(episodeId) {
  try {
    const isBoth = episodeId.endsWith("both");
    const isDub = episodeId.endsWith("dub") ? true : false;

    episodeId = episodeId.replace(/-(dub|sub|both)$/, "");

    const data = await global.scrapeURL(`${baseUrl}/play/${episodeId}`);
    const $ = (0, cheerio.load)(data);

    const links = $("div#resolutionMenu > button").map((i, el) => ({
      url: $(el).attr("data-src"),
      quality: extractQualityNumber($(el).text()),
      audio: $(el).attr("data-audio"),
    }));

    let iSource = {};

    if (!isBoth) iSource.sources = [];
    if (isBoth)
      iSource = {
        dub: {
          sources: [],
        },
        sub: {
          sources: [],
        },
      };

    for (const link of links) {
      const res = await extract(new URL(link.url));
      res[0].quality = link.quality;
      res[0].isDub = link.audio === "eng";
      if (isBoth) {
        if (res[0]?.isDub) {
          iSource.dub.sources.push(res[0]);
        } else if (!res[0]?.isDub) {
          iSource.sub.sources.push(res[0]);
        }
      } else {
        if (isDub && res[0].isDub) {
          iSource.sources.push(res[0]);
        } else if (!isDub && !res[0].isDub) {
          iSource.sources.push(res[0]);
        }
      }
    }
    return iSource;
  } catch (err) {
    console.error("Error fetching data from AnimePahe:", err);
    return { sources: [] };
  }
}

// helpers for extracting video links
function extractQualityNumber(qualityString) {
  const match = qualityString.match(/\d+p/);
  return match ? match[0] : "";
}

// helpers for extracting video links
async function extract(videoUrl) {
  let sources = [];
  try {
    const { data } = await axios.get(`${videoUrl.href}`, {
      headers: { Referer: baseUrl },
    });
    const source = eval(
      /(eval)(\(f.*?)(\n<\/script>)/s.exec(data)[2].replace("eval", "")
    ).match(/https.*?m3u8/);
    sources.push({
      url: source[0],
      isM3U8: source[0].includes(".m3u8"),
    });
    return sources;
  } catch (err) {
    throw new Error(err.message);
  }
}

module.exports = {
  SearchAnime,
  AnimeInfo,
  fetchEpisodeSources,
  fetchRecentEpisodes,
  fetchEpisode,
};
