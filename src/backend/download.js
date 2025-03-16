// imports
const { animeinfo, MangaInfo, fetchChapters } = require("./utils/AnimeManga");
const { providerFetch, settingfetch } = require("./utils/settings");
const { addToQueue, checkEpisodeDownload } = require("./utils/queue");
const { MetadataAdd } = require("./utils/Metadata");
// const { MalAddToList, MalGogo } = require("./utils/mal");

// Handles Multiple Episodes Download
async function downloadAnimeMulti(animeid, Episodes = [], Title) {
  if (Episodes?.length <= 0)
    return {
      error: false,
      message: `No Episode Provided To Download!`,
    };

  let Message = {
    type: "info",
    message: "",
  };

  let success = 0;

  for (let i = 0; i < Episodes.length; i++) {
    let Episode = Episodes[i];
    let data = await downloadAnimeSingle(
      animeid,
      Episode.id,
      Episode.number,
      Title,
      i === 0
    );
    // if any error change to error
    if (data?.error) {
      Message.error = true;
    } else {
      success++;
    }
  }

  return `Added ${success} Episodes To Queue!`;
}

// Handles Single Episode Download
async function downloadAnimeSingle(
  animeid,
  episodeid,
  number,
  Title,
  saveinfo = false
) {
  try {
    const config = await settingfetch();
    const provider = await providerFetch("Anime");

    if (saveinfo) {
      const animedata = await animeinfo(provider, animeid);
      if (animedata) {
        MetadataAdd("Anime", {
          id: animeid,
          title: `${animedata.title} ${animedata?.subOrDub}`,
          provider: provider.provider_name,
          subOrDub: animedata?.subOrDub ?? null,
          type: animedata.type ?? null,
          description: animedata.description ?? null,
          status: animedata.status ?? null,
          genres: animedata?.genres?.join(",") ?? null,
          aired: animedata?.aired ?? null,
          ImageUrl: animedata?.image,
          EpisodesDataId: animedata?.dataId,
        });
      }
    }

    let is_downloaded = await checkEpisodeDownload(episodeid);
    if (is_downloaded) {
      return {
        error: true,
        message: "Already downloaded",
      };
    } else {
      await addToQueue({
        Type: "Anime",
        EpNum: number,
        id: animeid,
        Title: Title,
        SubDub: `${animeid.endsWith("dub") ? "dub" : "sub"}`,
        config: {
          Animeprovider: config?.Animeprovider,
          quality: config?.quality,
          mergeSubtitles: config?.mergeSubtitles,
          subtitleFormat: config?.subtitleFormat,
          CustomDownloadLocation: config?.CustomDownloadLocation,
        },
        epid: episodeid,
        totalSegments: 0,
        currentSegments: 0,
      });
      return {
        error: false,
        message: "Added To Queue!",
      };
    }
  } catch (err) {
    return {
      error: true,
      message: `${err.message}`,
    };
  }
}

// Handles Multiple Chapters Download
async function downloadMangaMulti(mangaid, Chapters = [], Title) {
  if (Chapters?.length <= 0)
    return {
      error: false,
      message: `No Episode Provided To Download!`,
    };

  let Message = {
    type: "info",
    message: "",
  };

  let success = 0;

  for (let i = 0; i < Chapters.length; i++) {
    let Chapter = Chapters[i];
    let data = await downloadMangaSingle(
      mangaid,
      Chapter.id,
      Chapter.number,
      Title,
      i === 0
    );
    // if any error change to error
    if (data?.error) {
      Message.error = true;
    } else {
      success++;
    }
  }

  return `Added ${success} Episodes To Queue!`;
}

// Handles Single Manga Download
async function downloadMangaSingle(
  mangaid,
  episodeid,
  number,
  Title,
  saveinfo = false
) {
  try {
    const config = await settingfetch();
    const provider = await providerFetch("Manga");

    if (saveinfo) {
      let mangainfo = await MangaInfo(provider, mangaid);
      mangainfo = { ...mangainfo, ...(await fetchChapters(provider, mangaid)) };
      if (mangainfo) {
        MetadataAdd("Manga", {
          id: mangaid,
          title: Title,
          provider: provider.provider_name,
          description: mangainfo.description ?? null,
          genres: mangainfo?.genres?.join(",") ?? null,
          type: mangainfo.type ?? null,
          author: mangainfo?.author ?? null,
          released: mangainfo?.released ?? null,
          chapters: JSON.stringify(mangainfo?.chapters) ?? null,
          totalChapters: parseInt(mangainfo?.totalChapters) ?? null,
          ImageUrl: mangainfo?.image,
        });
      }
    }

    let is_downloaded = await checkEpisodeDownload(episodeid);

    if (is_downloaded) {
      return {
        error: true,
        message: "Already downloaded",
      };
    } else {
      await addToQueue({
        Type: "Manga",
        EpNum: number,
        id: mangaid,
        Title: Title,
        config: {
          Mangaprovider: config?.Mangaprovider,
          CustomDownloadLocation: config?.CustomDownloadLocation,
        },
        ChapterTitle: `Chapter ${number}`,
        epid: episodeid,
        totalSegments: 0,
        currentSegments: 0,
      });
      return {
        error: false,
        message: "Added To Queue!",
      };
    }
  } catch (err) {
    return {
      error: true,
      message: `${err.message}`,
    };
  }
}

module.exports = {
  downloadAnimeSingle,
  downloadAnimeMulti,
  downloadMangaSingle,
  downloadMangaMulti,
};
