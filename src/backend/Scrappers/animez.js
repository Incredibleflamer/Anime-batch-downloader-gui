const cheerio = require("cheerio");
const axios = require("axios");

const baseurl = "https://animez.org";

async function SearchAnime(query, page = 1) {
  try {
    const res = await axios.get(
      `${baseurl}/?act=search&f[status]=all&f[sortby]=lastest-chap&f[keyword]=${encodeURIComponent(
        query
      )}&&pageNum=${page}`
    );
    const $ = (0, cheerio.load)(res.data);
    return await ExtractCardsData($, page);
  } catch (err) {
    throw new Error(err.message);
  }
}

async function AnimeInfo(id) {
  let animeInfo = { id: id, genres: [], episodes: { dub: [], sub: [] } };
  try {
    const res = await axios.get(`${baseurl}/${id}/`);
    const $ = (0, cheerio.load)(res.data);

    // genre
    $("ul.InfoList > li").each((i, el) => {
      const fullText = $(el).text().trim();
      const name = $(el).find("strong").text().trim();
      const value = fullText.replace(name, "").trim();

      if (name && value && name.toLowerCase() === "genres:") {
        value.split("-").forEach((genre) => {
          animeInfo.genres.push(genre.trim());
        });
      }
    });

    // episodes
    $("ul#list_chapter_id_detail > li").each((i, el) => {
      if ($(el).find("a").text().trim().toLowerCase().includes("dub")) {
        animeInfo.episodes.dub.push({
          id: $(el).find("a").attr("href"),
        });
      } else {
        animeInfo.episodes.sub.push({
          id: $(el).find("a").attr("href"),
        });
      }
    });

    return {
      ...animeInfo,
      image: `${baseurl}/${$("div.Image > figure > img").attr("src")}`,
      description: $("div#summary_shortened").text() ?? "",
    };
  } catch (err) {
    throw new Error(err.message);
  }
}

async function fetchRecentEpisodes(page = 1) {
  try {
    const res = await axios.get(
      `${baseurl}/?act=search&f[status]=all&f[sortby]=lastest-chap&&pageNum=${page}`
    );
    const $ = (0, cheerio.load)(res.data);
    return await ExtractCardsData($, page);
  } catch (err) {
    throw new Error(err.message);
  }
}

async function fetchEpisodeSources(params) {}

async function ExtractCardsData($, page = 1) {
  const searchResult = {
    currentPage: page,
    hasNextPage: false,
    totalPages: page,
    results: [],
  };
  // geting items
  $("ul.MovieList > li").each((i, el) => {
    // getting id
    const id = $(el).find("article > a").attr("href");
    if (!id) return;

    searchResult.results.push({
      id: id.replaceAll("/", ""),
      image: `${baseurl}/${$(el)
        .find("article > a > div.Image > figure > img")
        .attr("src")}`,
      title: $(el).find("article > a > h2.Title").text().trim(),
    });
  });
  // getting total pages

  if (searchResult.results.length > 0) {
    let pages = $("ul.pagination > li");
    if (pages) {
      pages.each((i, el) => {
        let link = $(el).find("li > a").attr("href");
        if (!link) return;
        let value = $(el).find("li > a").text().trim().toLowerCase();

        // has next page?
        if (value === "»") {
          searchResult.hasNextPage = true;
        }

        // total pages
        if (value === "last") {
          searchResult.totalPages = parseInt(
            link.split("pageNum=")[1].split("#")[0] || link.split("pageNum=")[1]
          );
        }
      });
    }
  }
  return searchResult;
}

// (async () => {
//   try {
//     // const data = await SearchAnime("one piece", 2);
//     const data = await AnimeInfo("one-piece-7096");
//     console.log(data);
//   } catch (err) {
//     console.log(err);
//   }
// })();
