// imports
const { animeinfo, MangaInfo } = require("./utils/AnimeManga");
const { providerFetch, settingfetch } = require("./utils/settings");
const {
  addToQueue,
  saveQueue,
  checkEpisodeDownload,
} = require("./utils/queue");
const { MalAddToList, MalGogo } = require("./utils/mal");

// main download function
async function downloadfunction(animeid, startep, endep) {
  startep = parseInt(startep);
  endep = parseInt(endep);
  if (!startep || !animeid) throw new Error("Something seems to be missing..");
  if (!(startep > 0)) throw new Error("Start ep is 0");
  const provider = await providerFetch();
  const animedata = await animeinfo(provider, animeid);
  if (!animedata) throw new Error("no anime found with this id");

  let Title = animedata.title;
  let info = [];
  let errors = [];
  let Success = [];
  let TryToDownload = [];

  const config = await settingfetch();

  if (!endep) {
    TryToDownload.push(startep - 1);
  } else {
    if (startep > endep) throw new Error("Start ep is greater than End ep");
    for (let i = startep; i <= endep; i++) {
      TryToDownload.push(i - 1);
    }
  }

  // checking if ep are ther in sources
  for (let i = 0; i < TryToDownload.length; i++) {
    let epid = animedata.episodes[TryToDownload[i]].id;
    if (!epid) {
      return errors.push(
        `${Title} | ${TryToDownload[i] + 1} Not Found [ skiped ]`
      );
    }

    let true_false = await checkEpisodeDownload(epid);

    if (true_false) {
      errors.push(
        `${Title} | ${TryToDownload[i] + 1} Already In Queue [ skiped ]`
      );
    }

    await addToQueue({
      Type: "Anime",
      EpNum: TryToDownload[i] + 1,
      Title: animedata.title,
      config: {
        provider: config?.provider,
        quality: config?.quality,
        mergeSubtitles: config?.mergeSubtitles,
        subtitleFormat: config?.subtitleFormat,
        CustomDownloadLocation: config?.CustomDownloadLocation,
      },
      epid: epid,
      totalSegments: 0,
      currentSegments: 0,
    });

    Success.push(`${Title} | ${TryToDownload[i] + 1} Added To queue`);
  }

  await saveQueue();

  // add to mal?
  if (config.mal_on_off == true && config.provider === "gogo") {
    try {
      let malid = await MalGogo(animeid);
      const true_false_added = await MalAddToList(malid, config.status);
      if (true_false_added === true) {
        Success.push(`Added ${Title} To ${config.status}.`);
      } else {
        info.push(`Couldnt Update ${Title} To ${config.status}`);
      }
    } catch (err) {
      console.log(err);
      info.push(`Couldnt Add ${Title} To Mal [ Logout and Login Again. ]`);
    }
  }
  return { errors, info, Success };
}

// main download manga
async function MangaDownloadMain(mangaid, startchap, endchap) {
  if (!startchap || !mangaid)
    throw new Error("Something seems to be missing..");
  if (!(startchap > 0)) throw new Error("Start ep is 0");
  const mangainfo = await MangaInfo(mangaid);
  if (!mangainfo) throw new Error("no manga found with this id");

  let Title = mangainfo.title;
  let info = [];
  let errors = [];
  let Success = [];

  if (!endchap) {
    let eptodownload = mangainfo.chapters[parseInt(startchap) - 1];
    let true_false = await checkEpisodeDownload(eptodownload.id);
    if (true_false) {
      errors.push(`${Title} | ${eptodownload.title} Already In Queue`);
    } else {
      await addToQueue({
        Type: "Manga",
        Title: Title,
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
  downloadfunction,
  MangaDownloadMain,
};
