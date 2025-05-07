const AnimekaiDecoder = require("./helper/AnimekaiDecoder");
const axios = require("axios");
const cheerio = require("cheerio");
const baseUrl = "https://animekai.to";
const AnimekaiDecoderObject = new AnimekaiDecoder();

async function fetchRecentEpisodes(filters = {}) {
  try {
    let PreParams = "";

    Object.entries(filters).forEach(([key, value]) => {
      if (typeof value === "object" && value !== null) {
        PreParams += value.map((val) => `${key}[]=${val}`);
        delete filters[key];
      }
    });

    const { data } = await axios.get(
      `${baseUrl}/browser?${
        PreParams && PreParams !== "" ? `${PreParams}&` : ""
      }${new URLSearchParams(filters).toString()}`
    );
    const $ = cheerio.load(data);
    return await scrapeCards($, filters?.page);
  } catch (err) {
    throw new Error(err.message);
  }
}

async function SearchAnime(query, filters = {}) {
  try {
    let PreParams = "";

    Object.entries(filters).forEach(([key, value]) => {
      if (typeof value === "object" && value !== null) {
        PreParams += value.map((val) => `${key}[]=${val}`);
        delete filters[key];
      }
    });

    const { data } = await axios.get(
      `${baseUrl}/browser?keyword=${encodeURIComponent(query)}&${
        PreParams && PreParams !== "" ? `${PreParams}&` : ""
      }${new URLSearchParams(filters).toString()}`
    );
    const $ = cheerio.load(data);

    return await scrapeCards($, filters?.page);
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
        ?.split("page=")[1]
        ?.split("?")[0]
        ?.split(" ")[0] ?? page
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
      const imageSrc =
        Anime.find("a.poster > div > img").attr("data-src") ?? null;
      const image = imageSrc
        ? `/proxy/image?url=${encodeURIComponent(imageSrc)}`
        : null;

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
    let subOrDub = id.endsWith("dub")
      ? "dub"
      : id.endsWith("sub")
      ? "sub"
      : "both";

    let episodeId = id.replace(/-(dub|sub|both)$/, "");

    const { data } = await axios.get(`${baseUrl}/watch/${episodeId}`);
    const $ = cheerio.load(data);
    const main = $("main");

    const watchSection = main.find("div.watch-section");
    const mainEntity = main.find("div#main-entity > div.entity-scroll");
    const dubsub = mainEntity.find("div.info");
    const details = mainEntity.find("div.detail");
    const dataId = main.find("div.rate-box").attr("data-id");
    const imageSrc = main.find("div.poster-wrap img").attr("src") ?? null;
    const image = imageSrc
      ? `/proxy/image?url=${encodeURIComponent(imageSrc)}`
      : null;
    const dub = parseInt(dubsub.find("span.dub").text().trim() || "0");
    const sub = parseInt(dubsub.find("span.sub").text().trim() || "0");

    if (subOrDub === "both") {
      subOrDub = dub > 0 && sub > 0 ? "both" : dub > 0 ? "dub" : "sub";
    }

    return {
      id: `${episodeId}-${subOrDub}`,
      malid: watchSection.attr("data-mal-id") || null,
      image: image,
      title: mainEntity.find("div.title").text().trim() || "Unknown",
      subOrDub: subOrDub,
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
      dataId: dataId,
    };
  } catch (err) {
    throw new Error(err.message);
  }
}

async function fetchEpisode(dataId) {
  try {
    let { data } = await axios.get(
      `https://animekai.to/ajax/episodes/list?ani_id=${dataId}&_=${AnimekaiDecoderObject.GenerateToken(
        dataId
      )}`
    );

    const $ = cheerio.load(data.result);
    let episodes = [];

    $("a").each((i, el) => {
      const num = parseInt(el.attribs["num"]) || null;
      const slug = el.attribs["slug"] || null;
      const title = $(el).find("span").text().trim() || "Unknown Title";
      const token = el.attribs["token"] || null;
      const lang = Number(el.attribs["langs"]);

      if (!num || !slug || !token) return;
      episodes.push({
        number: num,
        slug,
        title,
        id: token,
        lang: lang === 1 ? "sub" : (lang === 2) === "dub" ? "dub" : "both",
      });
    });

    return {
      totalPages: 1,
      total: episodes.length,
      episodes: episodes?.length > 0 ? episodes.reverse() : [],
      currentPage: 1,
      hasNextPage: false,
    };
  } catch (err) {
    return {
      totalPages: 0,
      total: 0,
      episodes: [],
      currentPage: 1,
      hasNextPage: false,
    };
  }
}

async function fetchEpisodeSources(episodeId) {
  try {
    const isBoth = episodeId.endsWith("both");
    const subOrDub = episodeId.endsWith("sub") ? "sub" : "dub";
    episodeId = episodeId.replace(/-(dub|sub|both)$/, "");

    const { data } = await axios.get(
      `https://animekai.to/ajax/links/list?token=${episodeId}&_=${AnimekaiDecoderObject.GenerateToken(
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

    let filteredServers = isBoth
      ? servers.filter((s) => s.type === "sub" || s.type === "dub")
      : servers.filter((s) => s.type === subOrDub);

    if (!filteredServers || filteredServers.length === 0) {
      throw new Error(
        subOrDub === "dub"
          ? "No dubbed episodes available."
          : "No subbed episodes found."
      );
    }

    let SourceResult = [];
    for (let serverGroup of filteredServers) {
      for (let server of serverGroup.servers) {
        if (!isBoth && SourceResult.length > 0) break;
        try {
          let serverdata = await getSources(server.id);
          SourceResult.push({
            type: serverGroup.type,
            data: serverdata,
          });
        } catch (error) {
          //  ignore
        }
      }
    }

    if (isBoth) {
      return {
        sub: SourceResult.find((item) => item.type === "sub")?.data || [],
        dub: SourceResult.find((item) => item.type === "dub")?.data || [],
      };
    } else {
      return SourceResult.length > 0 ? SourceResult[0].data : null;
    }
  } catch (err) {
    throw new Error(err.message);
  }
}

async function getSources(id) {
  try {
    const { data } = await axios.get(
      `https://animekai.to/ajax/links/view?id=${id}&_=${AnimekaiDecoderObject.GenerateToken(
        id
      )}`
    );
    let { url } = JSON.parse(
      AnimekaiDecoderObject.DecodeIframeData(data.result).replace(/\\/gm, "")
    );

    url = url.replace(/\/(e|e2)\//, "/media/");
    const sources = await axios.get(url);

    const Results = { sources: [] };

    const decodedSources = JSON.parse(
      AnimekaiDecoderObject.Decode(sources?.data?.result).replace(/\\/g, "")
    ).sources;

    const videoUrlPromises = decodedSources.map(async (s) => {
      const videoUrls = await getVideoUrls(s.file);
      return videoUrls;
    });

    const videoUrlsArray = await Promise.all(videoUrlPromises);
    Results.sources = videoUrlsArray.flat();
    return Results;
  } catch (err) {
    console.log(err);
    throw new Error(err);
  }
}

async function getVideoUrls(url) {
  const quality = ["1080", "720", "360"];
  let videoUrls = [];

  videoUrls.push({
    quality: "default",
    url: `${url}`,
  });

  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
    });

    const text = Buffer.from(response.data).toString("utf-8");

    const lines = text.split("\n");
    const baseUrl = url.split("/").slice(0, -1).join("/");

    lines.forEach((line, index) => {
      const qualityMatch = quality.find((q) => line.endsWith(q));
      if (qualityMatch && lines[index + 1]) {
        videoUrls.push({
          quality: `${qualityMatch}p`,
          url: `${baseUrl}/${lines[index + 1]}`,
        });
      }
    });

    return videoUrls;
  } catch (error) {
    console.error("Error fetching the .m3u8 file:", error);
    return [];
  }
}

module.exports = {
  fetchRecentEpisodes,
  SearchAnime,
  AnimeInfo,
  fetchEpisodeSources,
  fetchEpisode,
};
