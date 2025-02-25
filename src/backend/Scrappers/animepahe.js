// imports
const { wrapper } = require("axios-cookiejar-support");
const { CookieJar } = require("tough-cookie");
const { app } = require("electron");
const cheerio = require("cheerio");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
// variables
const baseUrl = "https://animepahe.ru";
const userDataPath = app.getPath("userData");
const cookieFilePath = path.join(userDataPath, "animepahe_cookies.json");

let jar = new CookieJar();

if (fs.existsSync(cookieFilePath)) {
  const cookies = fs.readFileSync(cookieFilePath, "utf8");
  try {
    const cookiesObject = JSON.parse(cookies);
    jar = CookieJar.deserializeSync(cookiesObject);
  } catch (error) {
    console.error("Error deserializing cookies:", error.message);
  }
}

const client = wrapper(axios.create({ jar }));

// Anime Search
async function SearchAnime(query) {
  try {
    const { data } = await ddosGuardRequest(
      `${baseUrl}/api?m=search&q=${encodeURIComponent(query)}`
    );
    const res = {
      currentPage: 1,
      hasNextPage: false,
      totalPages: 1,
      results: data.data.map((item) => ({
        id: `${item.session}`,
        title: item.title,
        image: `/proxy/image?url=${item.poster}`,
      })),
    };
    return res;
  } catch (err) {
    throw new Error(err.message);
  }
}

// Recent Episodes
async function fetchRecentEpisodes(page = 1) {
  try {
    const { data } = await ddosGuardRequest(
      `${baseUrl}/api?m=airing&page=${page}`
    );
    const res = {
      currentPage: page,
      hasNextPage: data?.next_page_url?.length > 0 ? true : false,
      totalPages: data?.last_page ?? 0,
      results: data.data.map((item) => ({
        id: `${item.anime_session}`,
        title: item.anime_title,
        image: `/proxy/image?url=${item.snapshot}`,
      })),
    };
    return res;
  } catch (err) {
    throw new Error(err.message);
  }
}

// Animeinfo
async function AnimeInfo(id, { fetch_info = true, page = 1 } = {}) {
  let suffix = id.endsWith("both")
    ? "both"
    : id.endsWith("dub")
    ? "dub"
    : "sub";
  id = id.replace(/-(dub|sub|both)$/, "");

  const animeInfo = {
    id: `${id}-${suffix}`,
    title: "",
  };

  try {
    if (fetch_info) {
      const response = await ddosGuardRequest(`${baseUrl}/anime/${id}`);

      const $ = (0, cheerio.load)(response.data);

      animeInfo.title = $("div.title-wrapper > h1 > span").first().text();
      animeInfo.image =
        `/proxy/image?url=` + $("div.anime-poster a").attr("href");
      animeInfo.cover =
        `/proxy/image?url=` + `https:${$("div.anime-cover").attr("data-src")}`;
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
    }

    const { episodes, last_page, total_episodes } = await fetchEpisodesPages(
      id,
      page,
      suffix
    );

    animeInfo.totalEpisodes = total_episodes;
    animeInfo.last_page = last_page;
    animeInfo.episodes = episodes;
    animeInfo.Animeprovider = "pahe";

    return animeInfo;
  } catch (error) {
    console.error("Error fetching data from AnimePahe:", error);
    return { results: [] };
  }
}

// Fetching Episodes Pages
async function fetchEpisodesPages(id, page, suffix) {
  try {
    let episodes = [];

    let {
      data: { last_page, data, total },
    } = await ddosGuardRequest(
      `${baseUrl}/api?m=release&id=${id}&sort=episode_asc&page=${page}`
    );

    data.forEach((item) => {
      let hasEngAudio = item?.audio && item?.audio?.toLowerCase() === "eng";
      let epSuffix = hasEngAudio ? "both" : "sub";

      if (suffix === "dub" && hasEngAudio) {
        episodes.push({
          id: `${id}/${item.session}-dub`,
          number: item.episode,
          title: item.title,
          duration: item.duration,
        });
      } else if (suffix === "sub") {
        episodes.push({
          id: `${id}/${item.session}-sub`,
          number: item.episode,
          title: item.title,
          duration: item.duration,
        });
      } else if (suffix === "both") {
        episodes.push({
          id: `${id}/${item.session}-${epSuffix}`,
          number: item.episode,
          title: item.title,
          duration: item.duration,
        });
      }
    });

    if (page === 1 && last_page > 1) {
      const {
        data: { data },
      } = await ddosGuardRequest(
        `${baseUrl}/api?m=release&id=${id}&sort=episode_asc&page=${last_page}`
      );
      last_page = data[0]?.episode ?? last_page;
    }

    return {
      episodes: episodes,
      last_page: last_page,
      total_episodes: total,
    };
  } catch (err) {
    console.log(err);
    return { episodes: [], last_page: 0, total_episodes: 0 };
  }
}

// fetching Episodes Download Links
async function fetchEpisodeSources(episodeId) {
  try {
    const isBoth = episodeId.endsWith("both");
    const isDub = episodeId.endsWith("dub") ? true : false;

    episodeId = episodeId.replace(/-(dub|sub|both)$/, "");

    const response = await ddosGuardRequest(`${baseUrl}/play/${episodeId}`, {
      headers: {
        Referer: `${baseUrl}`,
      },
    });
    const $ = (0, cheerio.load)(response.data);

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

// for sending request & bypassing ddoss gaurd
function saveCookies() {
  try {
    const serializedCookies = jar.serializeSync();
    const cookiesString = JSON.stringify(serializedCookies);
    fs.writeFileSync(cookieFilePath, cookiesString);
  } catch (error) {
    console.error("Error saving cookies:", error.message);
  }
}

async function getNewCookie(url) {
  console.log("Attempting to solve DDos-GUARD challenge...");
  try {
    const jsResponse = await client.get(
      "https://check.ddos-guard.net/check.js"
    );
    const jsContent = jsResponse.data;

    const wellKnownPath = jsContent.match(/'([^']+)'/)[1];
    if (!wellKnownPath) throw new Error("Failed to parse well-known path.");

    const challengeUrl = `${url.protocol}//${url.host}${wellKnownPath}`;
    console.log("Challenge URL:", challengeUrl);

    const challengeResponse = await client.get(challengeUrl);
    const setCookieHeader = challengeResponse.headers["set-cookie"];

    if (!setCookieHeader) throw new Error("No set-cookie header found.");
    console.log("Challenge solved, new cookies received.");

    setCookieHeader.forEach((cookie) => {
      jar.setCookieSync(cookie, challengeUrl);
    });

    saveCookies();

    return true;
  } catch (error) {
    console.error("Failed to solve DDos-GUARD challenge:", error.message);
    return false;
  }
}

async function ddosGuardRequest(url, options = {}) {
  try {
    return await client.get(url, { ...options, withCredentials: true });
  } catch (error) {
    console.log("DDos-GUARD detected. Attempting to bypass...");

    const solved = await getNewCookie(new URL(url));
    if (!solved) throw new Error("Failed to bypass DDos-GUARD.");

    console.log("Retrying request...");
    return await client.get(url, { ...options, withCredentials: true });
  }
}

module.exports = {
  SearchAnime,
  AnimeInfo,
  fetchEpisodeSources,
  fetchEpisodesPages,
  fetchRecentEpisodes,
  ddosGuardRequest,
};
