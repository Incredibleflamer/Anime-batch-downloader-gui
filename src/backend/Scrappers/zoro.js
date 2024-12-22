// import
const cheerio = require("cheerio");
const axios = require("axios");
const { getSources } = require("./helper/rabbit");

// varibles
const baseUrl = "https://hianime.to";

async function SearchAnime(query, page = 1) {
  return scrapeCardPage(
    `${baseUrl}/search?keyword=${decodeURIComponent(query)}&page=${page}`
  );
}

async function AnimeInfo(id) {
  let subOrDub = id.endsWith("sub")
    ? "sub"
    : id.endsWith("dub")
    ? "dub"
    : id.endsWith("both")
    ? "both"
    : "both";
  const info = {
    id: id,
    title: "",
  };
  id = id.replace("-dub", "").replace("-sub", "").replace("-both", "");
  try {
    const { data } = await axios.get(`${baseUrl}/watch/${id}`);
    const $ = (0, cheerio.load)(data);
    const { mal_id, anilist_id } = JSON.parse($("#syncData").text());
    info.malID = Number(mal_id);
    info.alID = Number(anilist_id);
    info.title = $("h2.film-name > a.text-white").text();
    info.japaneseTitle = $("div.anisc-info div:nth-child(2) span.name").text();
    info.image = $("img.film-poster-img").attr("src");
    info.description = $("div.film-description").text().trim();
    // Movie, TV, OVA, ONA, Special, Music
    info.type = $("span.item").last().prev().prev().text().toUpperCase();
    info.url = `${baseUrl}/${id}`;

    info.dubs = parseInt(
      $("div.film-stats div.tick div.tick-item.tick-dub").text()
    );

    info.subs = parseInt(
      $("div.film-stats div.tick div.tick-item.tick-sub").text()
    );

    info.subOrDub = subOrDub;
    const episodesAjax = await axios.get(
      `${baseUrl}/ajax/v2/episode/list/${id.split("-").pop()}`
    );
    const $$ = (0, cheerio.load)(episodesAjax.data.html);
    info.totalEpisodes = $$("div.detail-infor-content > div > a").length;
    info.episodes = [];
    $$("div.detail-infor-content > div > a").each((i, el) => {
      var _a, _b, _c, _d;
      const episodeId =
        (_c =
          (_b =
            (_a = $$(el).attr("href")) === null || _a === void 0
              ? void 0
              : _a.split("/")[2]) === null || _b === void 0
            ? void 0
            : _b.replace("?ep=", "$episode$")) === null || _c === void 0
          ? void 0
          : subOrDub !== "both"
          ? _c.concat(`$${subOrDub}`)
          : _c;
      const number = parseInt($$(el).attr("data-number"));
      const title = $$(el).attr("title");
      const url = baseUrl + $$(el).attr("href");
      const isFiller = $$(el).hasClass("ssl-item-filler");
      (_d = info.episodes) === null || _d === void 0
        ? void 0
        : _d.push({
            id: episodeId,
            number: number,
            title: title,
            isFiller: isFiller,
            url: url,
          });
    });
    return info;
  } catch (err) {
    console.log(err);
    throw new Error(err.message);
  }
}

async function fetchRecentEpisodes(page = 1) {
  return scrapeCardPage(`${baseUrl}/recently-updated?page=${page}`);
}

async function fetchEpisodeSources(episodeId) {
  if (episodeId?.startsWith("http")) {
    return {
      ...(await ZoroExtract(episodeId)),
    };
  }
  if (!episodeId.includes("$episode$")) throw new Error("Invalid episode id");
  const subOrDub = episodeId.endsWith("sub") ? "sub" : "dub";
  episodeId = `${baseUrl}/watch/${episodeId
    .replace("$episode$", "?ep=")
    .replace(/\$auto|\$sub|\$dub/gi, "")}`;
  try {
    const { data } = await axios.get(
      `${baseUrl}/ajax/v2/episode/servers?episodeId=${
        episodeId.split("?ep=")[1]
      }`
    );
    const $ = (0, cheerio.load)(data.html);
    let serverId = null;
    try {
      try {
        serverId = retrieveServerId($, 4, subOrDub);
      } catch (err) {
        try {
          serverId = retrieveServerId($, 1, subOrDub);
        } catch (err) {
          //
        }
      }
      if (!serverId) throw new Error("");
    } catch (err) {
      throw new Error("Couldn't find server.");
    }
    const {
      data: { link },
    } = await axios.get(`${baseUrl}/ajax/v2/episode/sources?id=${serverId}`);
    return await fetchEpisodeSources(link);
  } catch (err) {
    console.log(err);
    throw err;
  }
}

// utils
async function scrapeCardPage(url) {
  var _a, _b, _c;
  try {
    const res = {
      currentPage: 0,
      hasNextPage: false,
      totalPages: 0,
      results: [],
    };
    const { data } = await axios.get(url);
    const $ = (0, cheerio.load)(data);
    const pagination = $("ul.pagination");
    res.currentPage = parseInt(
      (_a = pagination.find(".page-item.active")) === null || _a === void 0
        ? void 0
        : _a.text()
    );
    const nextPage =
      (_b = pagination.find("a[title=Next]")) === null || _b === void 0
        ? void 0
        : _b.attr("href");
    if (nextPage != undefined && nextPage != "") {
      res.hasNextPage = true;
    }
    const totalPages =
      (_c = pagination.find("a[title=Last]").attr("href")) === null ||
      _c === void 0
        ? void 0
        : _c.split("=").pop();
    if (totalPages === undefined || totalPages === "") {
      res.totalPages = res.currentPage;
    } else {
      res.totalPages = parseInt(totalPages);
    }
    res.results = await scrapeCard($);
    if (res.results.length === 0) {
      res.currentPage = 0;
      res.hasNextPage = false;
      res.totalPages = 0;
    }
    return res;
  } catch (err) {
    throw new Error("Something went wrong. Please try again later.");
  }
}

async function scrapeCard($) {
  try {
    const results = [];
    $(".flw-item").each((i, ele) => {
      const card = $(ele);
      const atag = card.find(".film-name a");
      const id = atag.attr("href")?.split("/")[1].split("?")[0];
      const type = card
        .find(".fdi-item")
        .first()
        ?.text()
        .replace(" (? eps)", "")
        .replace(/\s\(\d+ eps\)/g, "");
      const title = atag.text();
      const url = `${baseUrl}${atag.attr("href")}`;
      const image = card.find("img").attr("data-src");
      const episodes = parseInt(card.find(".tick-item.tick-eps")?.text()) || 0;

      // Push separate entries for sub and dub if they both exist
      const sub = parseInt(card.find(".tick-item.tick-sub")?.text()) || 0;
      const dub = parseInt(card.find(".tick-item.tick-dub")?.text()) || 0;

      if (sub > 0 && dub > 0) {
        results.push({
          id: `${id}-both`,
          title: `${title} (BOTH)`,
          url,
          image,
          type,
          episodes,
        });
      } else if (dub > 0) {
        results.push({
          id: `${id}-dub`,
          title: `${title} (Dub)`,
          url,
          image,
          type,
          episodes,
        });
      } else if (sub > 0) {
        results.push({
          id: `${id}-sub`,
          title: `${title} (Sub)`,
          url,
          image,
          type,
          episodes,
        });
      }
    });

    return results;
  } catch (err) {
    throw new Error("Something went wrong. Please try again later.");
  }
}

function retrieveServerId($, index, subOrDub) {
  return $(
    `.ps_-block.ps_-block-sub.servers-${subOrDub} > .ps__-list .server-item`
  )
    .map((i, el) => ($(el).attr("data-server-id") == `${index}` ? $(el) : null))
    .get()[0]
    .attr("data-id");
}

async function ZoroExtract(videoUrl) {
  try {
    const result = {
      sources: [],
      subtitles: [],
    };

    const srcsData = await getSources(videoUrl);
    if (!srcsData) {
      throw new Error("Url may have an invalid video id");
    }

    result.intro = srcsData.intro;
    result.outro = srcsData.outro;
    result.subtitles = srcsData.tracks.map((s) => ({
      url: s.file,
      lang: s.label ? s.label : "Thumbnails",
    }));
    result.sources = srcsData.sources.map((s) => ({
      url: s.file,
      type: s.type,
      isM3U8: s.file.includes(".m3u8"),
    }));
    return result;
  } catch (err) {
    throw err;
  }
}

module.exports = {
  SearchAnime,
  AnimeInfo,
  fetchRecentEpisodes,
  fetchEpisodeSources,
};
