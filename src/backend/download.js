// imports
const { animeinfo, MangaInfo } = require("./utils/AnimeManga");
const { providerFetch, settingfetch } = require("./utils/settings");
const {
  addToQueue,
  saveQueue,
  checkEpisodeDownload,
} = require("./utils/queue");
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

// main download manga
async function MangaDownloadMain(mangaid, startchap, endchap) {
  if (!startchap || !mangaid)
    throw new Error("Something seems to be missing..");
  if (!(startchap > 0)) throw new Error("Start ep is 0");

  const config = await settingfetch();
  const provider = await providerFetch("Manga");

  const mangainfo = await MangaInfo(provider, mangaid);
  if (!mangainfo) throw new Error("no manga found with this id");

  let Title = mangainfo.title;
  let info = [];
  let errors = [];
  let Success = [];

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

  if (!endchap) {
    let eptodownload = mangainfo.chapters[parseInt(startchap) - 1];
    let true_false = await checkEpisodeDownload(eptodownload.id);
    if (true_false) {
      errors.push(`${Title} | ${eptodownload.title} Already In Queue`);
    } else {
      await addToQueue({
        Type: "Manga",
        id: mangaid,
        image: mangainfo.image,
        Title: Title,
        config: {
          Mangaprovider: config?.Mangaprovider,
          CustomDownloadLocation: config?.CustomDownloadLocation,
        },
        EpNum: startchap,
        epid: eptodownload.id,
        ChapterTitle: eptodownload.title,
        totalSegments: 0,
        currentSegments: 0,
      });
      Success.push(`${Title} | ${eptodownload.title} Added To queue`);
    }
  } else {
    // multiple eps
    if (startchap > endchap)
      throw new Error("Start chapter is greater than End ep");
    for (let i = startchap; i <= endchap; i++) {
      // Fix the loop condition
      let epdownloads = mangainfo.chapters[parseInt(i) - 1];
      let true_false = await checkEpisodeDownload(epdownloads.id);
      if (true_false) {
        errors.push(
          `${Title} | ${epdownloads.title} Already In Queue [ skiped ]`
        );
      } else {
        await addToQueue({
          Type: "Manga",
          Title: Title,
          config: {
            Mangaprovider: config?.Mangaprovider,
            CustomDownloadLocation: config?.CustomDownloadLocation,
          },
          EpNum: startchap,
          epid: epdownloads.id,
          ChapterTitle: epdownloads.title,
          totalSegments: 0,
          currentSegments: 0,
        });
        Success.push(`${Title} | ${epdownloads.title} Added To queue`);
      }
    }
  }
  await saveQueue();
  return { errors, info, Success };
}

module.exports = {
  MangaDownloadMain,
  downloadAnimeSingle,
  downloadAnimeMulti,
};
