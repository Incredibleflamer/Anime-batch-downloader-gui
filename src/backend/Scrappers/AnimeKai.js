const AnimekaiDecoder = require("./helper/AnimekaiDecoder");
const axios = require("axios");
const cheerio = require("cheerio");

const baseUrl = "https://animekai.to";
const { GenerateToken, DecodeIframeData, Decode } = new AnimekaiDecoder();

async function fetchRecentEpisodes(page = 1) {
  try {
    const { data } = await axios.get(`${baseUrl}/updates?page=${page}`);
    const $ = cheerio.load(data);

    return await scrapeCards($, page);
  } catch (err) {
    throw new Error(err.message);
  }
}

async function SearchAnime(query, page = 1) {
  try {
    const { data } = await axios.get(
      `${baseUrl}/browser?keyword=${decodeURIComponent(query)}&page=${page}`
    );
    const $ = cheerio.load(data);

    return await scrapeCards($, page);
  } catch (err) {
    throw new Error(err.message);
  }
}

async function scrapeCards($, page) {
  let res = {
    currentPage: page,
    hasNextPage: false,
    totalPages: page,
    results: [],
  };

  try {
    const main = $("main > div > section");

    const LastPage = Number(
      main
        .find("nav > ul > li")
        .last()
        .find("a")
        .attr("href")
        ?.split("?page=")[1] || page
    );

    res.hasNextPage = LastPage > page;
    res.totalPages = LastPage;

    const AnimeList = main.find("div.aitem-wrapper.regular > div.aitem");

    const results = AnimeList.map((_, div) => {
      const Anime = $(div).find("div.inner");
      const sub = parseInt(Anime.find("div.info > span.sub").text()) || 0;
      const dub = parseInt(Anime.find("div.info > span.dub").text()) || 0;
      const baseId =
        Anime.find("a.poster").attr("href")?.split("/watch/")[1] || null;
      const title = Anime.find("a.title").text().trim() || null;
      const image = Anime.find("a.poster > div > img").attr("data-src") || null;

      if (!baseId || !title || !image) return null;

      let idSuffix = sub > 0 && dub > 0 ? "both" : dub > 0 ? "dub" : "sub";
      let formattedTitle = `${title} (${
        idSuffix.charAt(0).toUpperCase() + idSuffix.slice(1)
      })`;

      return {
        id: `${baseId}-${idSuffix}`,
        title: formattedTitle,
        image,
        sub,
        dub,
      };
    })
      .get()
      .filter(Boolean);

    res.results = results;
    return res;
  } catch (err) {
    return res;
  }
}

async function AnimeInfo(id) {
  try {
    let subOrDub = id.endsWith("sub")
      ? "sub"
      : id.endsWith("dub")
      ? "dub"
      : id.endsWith("both")
      ? "both"
      : "both";

    let episodeId = id
      .replace("-dub", "")
      .replace("-sub", "")
      .replace("-both", "");
    const { data } = await axios.get(`${baseUrl}/watch/${episodeId}`);
    const $ = cheerio.load(data);
    const main = $("main");

    const watchSection = main.find("div.watch-section");
    const mainEntity = main.find("div#main-entity > div.entity-scroll");
    const dubsub = mainEntity.find("div.info");
    const details = mainEntity.find("div.detail");
    const dataId = main.find("div.rate-box").attr("data-id");
    const episodes = await fetchEpisode(dataId, subOrDub);
    const dub = parseInt(dubsub.find("span.dub").text().trim() || "0");
    const sub = parseInt(dubsub.find("span.sub").text().trim() || "0");

    return {
      id: id,
      malid: watchSection.attr("data-mal-id") || "",
      image: main.find("div.poster-wrap img").attr("src") || "",
      title: mainEntity.find("div.title").text().trim() || "Unknown",
      dubs: dub,
      subs: sub,
      subOrDub: subOrDub.toUpperCase(),
      type: dubsub.find("span > b").text().trim() || "Unknown",
      status: details.find("div:contains('Status:') > span").text() || "Unkown",
      genres: details
        .find("div:contains('Genres:') > span > a")
        .map((_, el) => $(el).text().trim())
        .get(),
      aired:
        details.find("div:contains('Premiered:') > span > a").text() ||
        "Unkown",
      description:
        mainEntity.find("div.desc").text().trim() || "No description",
      episodes: episodes,
      epsorted: true,
      totalEpisodes: episodes.length,
    };
  } catch (err) {
    console.error("Error fetching anime info:", err.message);
    throw new Error(err.message);
  }
}

async function fetchEpisode(dataId, subOrDub) {
  let { data } = await axios.get(
    `https://animekai.to/ajax/episodes/list?ani_id=${dataId}&_=${GenerateToken(
      dataId
    )}`
  );

  const $ = cheerio.load(data.result);

  const episodes = $("a")
    .map((i, el) => {
      let lang = el.attribs["langs"];
      if (lang === "1") {
        lang = "sub";
      } else if (lang === "3") {
        lang = subOrDub;
      } else {
        lang = "dub";
      }
      if (subOrDub === lang || lang === "both") {
        return {
          number: parseInt(el.attribs["num"]),
          lang: lang,
          slug: el.attribs["slug"],
          title: $(el).find("span").text(),
          id: `${el.attribs["token"]}$${lang}`,
        };
      } else {
        return null;
      }
    })
    .get()
    .filter(Boolean)
    .reverse();

  return episodes;
}

async function fetchEpisodeSources(episodeId) {
  try {
    let isDub = episodeId.endsWith("dub");
    episodeId = episodeId.replace(/\$(both|sub|dub)/gi, "");

    const { data } = await axios.get(
      `https://animekai.to/ajax/links/list?token=${episodeId}&_=${GenerateToken(
        episodeId
      )}`
    );

    const $ = cheerio.load(data.result);
    const servers = $(".server-items")
      .map((_, el) => {
        const type = el.attribs["data-id"];
        const servers = $(el)
          .find("span")
          .map((_, server) => ({
            server: $(server).text(),
            id: server.attribs["data-lid"],
          }))
          .get();
        return { type, servers };
      })
      .get();

    let filteredServers = servers.find((s) =>
      isDub ? s.type === "dub" : s.type === "sub"
    );

    if (!filteredServers || filteredServers.servers.length === 0) {
      throw new Error(
        isDub ? "No dubbed episodes available." : "No subbed episodes found."
      );
    }

    for (let server of filteredServers.servers) {
      try {
        return await getSources(server.id);
      } catch (error) {
        console.warn(`Error fetching from ${server.server}, trying next...`);
      }
    }

    throw new Error("All servers failed to fetch sources.");
  } catch (err) {
    throw new Error(err.message);
  }
}

async function getSources(id) {
  try {
    const { data } = await axios.get(
      `https://animekai.to/ajax/links/view?id=${id}&_=${GenerateToken(id)}`
    );

    let { url } = JSON.parse(DecodeIframeData(data.result).replace(/\\/gm, ""));

    url = url.replace(/\/(e|e2)\//, "/media/");

    const sources = await axios.get(url);

    return {
      sources: JSON.parse(
        Decode(sources?.data?.result).replace(/\\/g, "")
      ).sources.map((s) => ({ url: s.file, isM3U8: s.file.endsWith(".m3u8") })),
    };
  } catch (err) {
    throw new Error(err);
  }
}

module.exports = {
  fetchRecentEpisodes,
  SearchAnime,
  AnimeInfo,
  fetchEpisodeSources,
};
