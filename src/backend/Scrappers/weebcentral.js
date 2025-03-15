const cheerio = require("cheerio");
const axios = require("axios");
const baseUrl = "https://weebcentral.com";

async function latestManga(page = 1) {
  try {
    const { data } = await axios.get(`${baseUrl}/latest-updates/${page}`);
    const $ = cheerio.load(data);

    const latestMangas = [];

    $("article").each((index, article) => {
      const Manga = $(article);
      let id = $(Manga).find("a").attr("href");
      if (id?.includes("/series/")) {
        id = id.split("/series/")?.[1].split("/")?.[0];
        if (id) {
          const image = Manga.find("picture > img").attr("src");
          const title = Manga.find(".font-semibold.text-lg").text();
          latestMangas.push({
            id: id,
            title: title,
            image: image,
          });
        }
      }
    });

    return {
      current_page: page,
      hasNextPage: true,
      results: latestMangas,
    };
  } catch (err) {
    throw new Error(err.message);
  }
}

async function searchManga(query, page = 1) {
  try {
    const offset = (page - 1) * 32;

    const { data } = await axios.get(
      `${baseUrl}/search/data?limit=32&offset=${offset}&text=${encodeURIComponent(
        query
      )}&sort=Best+Match&order=Ascending&official=Any&anime=Any&adult=Any&display_mode=Full+Display`
    );

    const $ = cheerio.load(data);

    const results = [];

    $("body article").each((index, article) => {
      const Manga = $(article).find("section").eq(0);
      if (Manga.length > 0) {
        let id = $(Manga).find("a").attr("href");
        if (id?.includes("/series/")) {
          id = id.split("/series/")?.[1].split("/")?.[0];
          if (id) {
            const MangaArticle = Manga.find("article").eq(1);
            if (MangaArticle.length > 0) {
              const image = MangaArticle.find("picture > img").attr("src");
              const title = MangaArticle.find(".text-ellipsis")
                .first()
                ?.text()
                ?.trim();

              results.push({
                id: id,
                title: title,
                image: image,
              });
            }
          }
        }
      }
    });
    const hasNextPage = results.length === 32;

    return {
      current_page: page,
      hasNextPage: hasNextPage,
      results: results,
    };
  } catch (err) {
    throw new Error(err.message);
  }
}

async function fetchMangaInfo(mangaId) {
  try {
    const mangaInfo = {
      id: mangaId,
      chapters: [],
      genres: [],
      type: "",
      author: "",
      released: "",
    };

    const { data } = await axios.get(`${baseUrl}/series/${mangaId}`);
    const $ = cheerio.load(data);
    const Main = $("main > div > section");

    if (Main.length > 0) {
      const LeftSections = Main.find("section");

      // left section
      mangaInfo.title = LeftSections.find("h1")
        .eq(0)
        ?.text()
        ?.trim()
        ?.toLowerCase();
      mangaInfo.image = LeftSections.find("picture > img").attr("src");
      // extra info
      LeftSections.find("section")
        .eq(2)
        .find("ul")
        .find("li")
        .each((index, li) => {
          let strongTag = $(li)
            .find("strong")
            .text()
            .trim()
            .replace(":", "")
            .replace("(s)", "")
            .toLowerCase();

          if (strongTag === "tags") strongTag = "genres";

          if (mangaInfo.hasOwnProperty(strongTag)) {
            let value = $(li)
              .find("a, span")
              .map((i, el) => $(el).text().trim().replace(/,$/, ""))
              .get();

            value = [...new Set(value)].filter((v) => v !== "");

            mangaInfo[strongTag] = Array.isArray(mangaInfo[strongTag])
              ? value
              : value[0];
          }
        });

      // Right section
      const RightSections = Main.eq(0).children("section").eq(1);

      const descriptionSection = RightSections.find(
        "li:has(strong:contains('Description')) p"
      );

      mangaInfo.description = descriptionSection.length
        ? descriptionSection.text().trim()
        : null;

      mangaInfo.chapters = await fetchAllChapters(mangaId);
      mangaInfo.totalChapters = mangaInfo?.chapters?.length ?? 0;
    }

    return mangaInfo;
  } catch (err) {
    throw new Error(err.message);
  }
}

async function fetchAllChapters(mangaId) {
  try {
    const { data } = await axios.get(
      `${baseUrl}/series/${mangaId}/full-chapter-list`
    );
    const $ = cheerio.load(data);

    const chapterLinks = [];
    const divs = $("div").toArray();

    for (
      let i = divs.length - 1, chapterNumber = 1;
      i >= 0;
      i--, chapterNumber++
    ) {
      const aTag = $(divs[i]).find("a").first();
      const href = aTag.attr("href");

      if (href) {
        let id = href.split("/chapters/")[1];
        if (id) {
          chapterLinks.push({
            id: id,
            title: `Chapter ${chapterNumber}`,
          });
        }
      }
    }

    return chapterLinks.reverse();
  } catch (err) {
    throw new Error(err.message);
  }
}

async function fetchChapterPages(chapterId) {
  try {
    const { data } = await axios.get(
      `${baseUrl}/chapters/${chapterId}/images?is_prev=False&current_page=1&reading_style=long_strip`
    );
    const $ = cheerio.load(data);

    const pages = $("img")
      .map((index, img) => ({
        page: index + 1,
        img: $(img).attr("src"),
      }))
      .get();

    return pages;
  } catch (err) {
    throw new Error(err.message);
  }
}

module.exports = {
  latestManga,
  searchManga,
  fetchMangaInfo,
  fetchAllChapters,
  fetchChapterPages,
};
