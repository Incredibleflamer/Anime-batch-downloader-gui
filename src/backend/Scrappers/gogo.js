// imports
const cheerio = require("cheerio");
const axios = require("axios");
const CryptoJS = require("crypto-js");

// variables
const baseUrl = "https://anitaku.bz";
const ajaxUrl = "https://ajax.gogocdn.net/ajax";
const keys = {
  key: CryptoJS.enc.Utf8.parse("37911490979715163134003223491201"),
  secondKey: CryptoJS.enc.Utf8.parse("54674138327930866480207815084989"),
  iv: CryptoJS.enc.Utf8.parse("3134003223491201"),
};

async function SearchAnime(query, page = 1) {
  const searchResult = {
    currentPage: page,
    hasNextPage: false,
    results: [],
  };

  try {
    const res = await axios.get(
      `${baseUrl}/filter.html?keyword=${encodeURIComponent(query)}&page=${page}`
    );
    const $ = cheerio.load(res.data);

    searchResult.hasNextPage =
      $("div.anime_name.new_series > div > div > ul > li.selected").next()
        .length > 0;

    $("div.last_episodes > ul > li").each((i, el) => {
      var _a;
      searchResult.results.push({
        id:
          (_a = $(el).find("p.name > a").attr("href")) === null || _a === void 0
            ? void 0
            : _a.split("/")[2],
        title: $(el).find("p.name > a").text(),
        url: `${baseUrl}/${$(el).find("p.name > a").attr("href")}`,
        image: $(el).find("div > a > img").attr("src"),
        releaseDate: $(el)
          .find("p.released")
          .text()
          .trim()
          .replace("Released: ", ""),
        subOrDub: $(el)
          .find("p.name > a")
          .text()
          .toLowerCase()
          .includes("(dub)")
          ? "dub"
          : "sub",
      });
    });
    return searchResult;
  } catch (err) {
    throw new Error(err.message);
  }
}

async function AnimeInfo(id) {
  if (!id.includes("gogoanime")) id = `${baseUrl}/category/${id}`;
  const animeInfo = {
    id: "",
    title: "",
    url: "",
    genres: [],
    totalEpisodes: 0,
  };
  try {
    const res = await axios.get(id);
    const $ = (0, cheerio.load)(res.data);
    animeInfo.id = new URL(id).pathname.split("/")[2];
    animeInfo.title = $(
      "section.content_left > div.main_body > div:nth-child(2) > div.anime_info_body_bg > h1"
    )
      .text()
      .trim();
    animeInfo.url = id;
    animeInfo.image = $("div.anime_info_body_bg > img").attr("src");
    animeInfo.releaseDate = $("div.anime_info_body_bg > p:nth-child(8)")
      .text()
      .trim()
      .split("Released: ")[1];
    animeInfo.description = $("div.anime_info_body_bg > div:nth-child(6)")
      .text()
      .trim()
      .replace("Plot Summary: ", "");
    animeInfo.subOrDub = animeInfo.title.toLowerCase().includes("dub")
      ? "dub"
      : "sub";
    animeInfo.type = $("div.anime_info_body_bg > p:nth-child(4) > a")
      .text()
      .trim()
      .toUpperCase();
    animeInfo.status = "UNKNOWN";
    switch ($("div.anime_info_body_bg > p:nth-child(9) > a").text().trim()) {
      case "Ongoing":
        animeInfo.status = "ONGOING";
        break;
      case "Completed":
        animeInfo.status = "COMPLETED";
        break;
      case "Upcoming":
        animeInfo.status = "NOT_YET_AIRED";
        break;
      default:
        animeInfo.status = "UNKNOWN";
        break;
    }
    animeInfo.otherName = $(".other-name a").text().trim();
    $("div.anime_info_body_bg > p:nth-child(7) > a").each((i, el) => {
      var _a;
      (_a = animeInfo.genres) === null || _a === void 0
        ? void 0
        : _a.push($(el).attr("title").toString());
    });
    const ep_start = $("#episode_page > li").first().find("a").attr("ep_start");
    const ep_end = $("#episode_page > li").last().find("a").attr("ep_end");
    const movie_id = $("#movie_id").attr("value");
    const alias = $("#alias_anime").attr("value");
    const html = await axios.get(
      `${ajaxUrl}/load-list-episode?ep_start=${ep_start}&ep_end=${ep_end}&id=${movie_id}&default_ep=${0}&alias=${alias}`
    );
    const $$ = (0, cheerio.load)(html.data);
    animeInfo.episodes = [];
    $$("#episode_related > li").each((i, el) => {
      var _a, _b, _c;
      (_a = animeInfo.episodes) === null || _a === void 0
        ? void 0
        : _a.push({
            id:
              (_b = $(el).find("a").attr("href")) === null || _b === void 0
                ? void 0
                : _b.split("/")[1],
            number: parseFloat(
              $(el).find(`div.name`).text().replace("EP ", "")
            ),
            url: `${baseUrl}/${
              (_c = $(el).find(`a`).attr("href")) === null || _c === void 0
                ? void 0
                : _c.trim()
            }`,
          });
    });
    animeInfo.episodes = animeInfo.episodes.reverse();
    animeInfo.totalEpisodes = parseInt(
      ep_end !== null && ep_end !== void 0 ? ep_end : "0"
    );
    return animeInfo;
  } catch (err) {
    console.log(err);
    throw new Error(err.message);
  }
}

async function fetchRecentEpisodes(page = 1, type = 1) {
  try {
    const res = await axios.get(
      `${ajaxUrl}/page-recent-release.html?page=${page}&type=${type}`
    );
    const $ = (0, cheerio.load)(res.data);
    const recentEpisodes = [];
    $("div.last_episodes.loaddub > ul > li").each((i, el) => {
      var _a, _b, _c, _d;
      recentEpisodes.push({
        id:
          (_b =
            (_a = $(el).find("a").attr("href")) === null || _a === void 0
              ? void 0
              : _a.split("/")[1]) === null || _b === void 0
            ? void 0
            : _b.split("-episode")[0],
        episodeId:
          (_c = $(el).find("a").attr("href")) === null || _c === void 0
            ? void 0
            : _c.split("/")[1],
        episodeNumber: parseFloat(
          $(el).find("p.episode").text().replace("Episode ", "")
        ),
        title: $(el).find("p.name > a").text(),
        image: $(el).find("div > a > img").attr("src"),
        url: `${baseUrl}${
          (_d = $(el).find("a").attr("href")) === null || _d === void 0
            ? void 0
            : _d.trim()
        }`,
      });
    });
    const hasNextPage = !$("div.anime_name_pagination.intro > div > ul > li")
      .last()
      .hasClass("selected");
    return {
      currentPage: page,
      hasNextPage: hasNextPage,
      results: recentEpisodes,
    };
  } catch (err) {
    throw new Error("Something went wrong. Please try again later.");
  }
}

async function fetchEpisodeSources(episodeId, downloadUrl) {
  if (episodeId.startsWith("http")) {
    const serverUrl = new URL(episodeId);
    return {
      headers: { Referer: serverUrl.href },
      sources: await GogoExtract(serverUrl),
      download: downloadUrl
        ? downloadUrl
        : `https://${serverUrl.host}/download${serverUrl.search}`,
    };
  }
  try {
    const res = await axios.get(`${baseUrl}/${episodeId}`);
    const $ = (0, cheerio.load)(res.data);
    let serverUrl;

    serverUrl = new URL(
      `${$(
        "div.anime_video_body > div.anime_muti_link > ul > li.vidcdn > a"
      ).attr("data-video")}`
    );

    const downloadLink = `${$(".dowloads > a").attr("href")}`;
    return downloadLink
      ? await fetchEpisodeSources(serverUrl.href, downloadLink)
      : await fetchEpisodeSources(serverUrl.href);
  } catch (err) {
    console.log(err);
    throw new Error("Episode not found.");
  }
}

// helpers
async function GogoExtract(videoUrl) {
  var _a;
  let sources = [];
  const res = await axios.get(videoUrl.href);
  const $ = (0, cheerio.load)(res.data);
  const encyptedParams = await GogoGenerateEncryptedAjaxParams(
    $,
    (_a = videoUrl.searchParams.get("id")) !== null && _a !== void 0 ? _a : ""
  );
  const encryptedData = await axios.get(
    `${videoUrl.protocol}//${videoUrl.hostname}/encrypt-ajax.php?${encyptedParams}`,
    {
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
    }
  );
  const decryptedData = await GogoDecryptAjaxData(encryptedData.data.data);
  if (!decryptedData.source)
    throw new Error("No source found. Try a different server.");
  if (decryptedData.source[0].file.includes(".m3u8")) {
    const resResult = await axios.get(decryptedData.source[0].file.toString());
    const resolutions = resResult.data.match(/(RESOLUTION=)(.*)(\s*?)(\s*.*)/g);
    resolutions === null || resolutions === void 0
      ? void 0
      : resolutions.forEach((res) => {
          const index = decryptedData.source[0].file.lastIndexOf("/");
          const quality = res.split("\n")[0].split("x")[1].split(",")[0];
          const url = decryptedData.source[0].file.slice(0, index);
          sources.push({
            url: url + "/" + res.split("\n")[1],
            isM3U8: (url + res.split("\n")[1]).includes(".m3u8"),
            quality: quality + "p",
          });
        });
    decryptedData.source.forEach((source) => {
      sources.push({
        url: source.file,
        isM3U8: source.file.includes(".m3u8"),
        quality: "default",
      });
    });
  } else
    decryptedData.source.forEach((source) => {
      sources.push({
        url: source.file,
        isM3U8: source.file.includes(".m3u8"),
        quality: source.label.split(" ")[0] + "p",
      });
    });
  decryptedData.source_bk.forEach((source) => {
    sources.push({
      url: source.file,
      isM3U8: source.file.includes(".m3u8"),
      quality: "backup",
    });
  });
  return sources;
}

async function GogoGenerateEncryptedAjaxParams($, id) {
  const encryptedKey = CryptoJS.AES.encrypt(id, keys.key, {
    iv: keys.iv,
  });
  const scriptValue = $("script[data-name='episode']").attr("data-value");
  const decryptedToken = CryptoJS.AES.decrypt(scriptValue, keys.key, {
    iv: keys.iv,
  }).toString(CryptoJS.enc.Utf8);
  return `id=${encryptedKey}&alias=${id}&${decryptedToken}`;
}

async function GogoDecryptAjaxData(encryptedData) {
  const decryptedData = CryptoJS.enc.Utf8.stringify(
    CryptoJS.AES.decrypt(encryptedData, keys.secondKey, {
      iv: keys.iv,
    })
  );
  return JSON.parse(decryptedData);
}

module.exports = {
  SearchAnime,
  AnimeInfo,
  fetchRecentEpisodes,
  fetchEpisodeSources,
};
