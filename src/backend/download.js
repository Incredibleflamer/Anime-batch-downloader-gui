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

// main download function
async function downloadfunction(animeid, startep, endep) {
  startep = parseInt(startep);
  endep = parseInt(endep);
  if (!startep || !animeid) throw new Error("Something seems to be missing..");
  if (!(startep > 0)) throw new Error("Start ep is 0");
  const config = await settingfetch();
  const provider = await providerFetch("Anime");

  let info = [];
  let errors = [];
  let Success = [];
  const animedata = await animeinfo(provider, animeid);

  MetadataAdd("Anime", {
    id: animeid,
    title: `${Title} ${animedata?.subOrDub}`,
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

  if (
    provider.provider_name === "animekai" ||
    provider.provider_name === "hianime"
  ) {
    let TryToDownload = [];
    if (!animedata) throw new Error("no anime found with this id");
    let Title = animedata.title;
    if (!endep) {
      TryToDownload.push(startep - 1);
    } else {
      if (startep > endep) throw new Error("Start ep is greater than End ep");
      for (let i = startep; i <= endep; i++) {
        TryToDownload.push(i - 1);
      }
    }

    if (provider.provider_name === "hianime") {
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
        } else {
          await addToQueue({
            Type: "Anime",
            EpNum: TryToDownload[i] + 1,
            id: animeid,
            Title: animedata.title,
            SubDub: `${animeid.endsWith("dub") ? "dub" : "sub"}`,
            config: {
              Animeprovider: config?.Animeprovider,
              quality: config?.quality,
              mergeSubtitles: config?.mergeSubtitles,
              subtitleFormat: config?.subtitleFormat,
              CustomDownloadLocation: config?.CustomDownloadLocation,
            },
            image: animedata?.image ?? null,
            epid: epid,
            totalSegments: 0,
            currentSegments: 0,
          });
          Success.push(`${Title} | ${TryToDownload[i] + 1} Added To queue`);
        }
      }
    } else if (provider.provider_name === "animekai") {
      for (const episode of animedata.episodes.filter((ep) =>
        TryToDownload.includes(ep.number - 1)
      )) {
        let epid = episode?.id;
        if (!epid) {
          errors.push(`${Title} | ${episode.number} Not Found [ skipped ]`);
          continue;
        }

        let alreadyQueued = await checkEpisodeDownload(epid);
        if (alreadyQueued) {
          errors.push(
            `${Title} | ${episode.number} Already In Queue [ skipped ]`
          );
        } else {
          await addToQueue({
            Type: "Anime",
            id: animeid,
            EpNum: episode.number,
            Title: animedata.title,
            SubDub: `${animeid.endsWith("dub") ? "dub" : "sub"}`,
            config: {
              Animeprovider: config?.Animeprovider,
              quality: config?.quality,
              mergeSubtitles: config?.mergeSubtitles,
              subtitleFormat: config?.subtitleFormat,
              CustomDownloadLocation: config?.CustomDownloadLocation,
            },
            image: animedata?.image ?? null,
            epid: epid,
            totalSegments: 0,
            currentSegments: 0,
          });

          Success.push(`${Title} | ${episode.number} Added To Queue`);
        }
      }
    }
  } else if (provider.provider_name === "pahe") {
    let currentPage = Math.ceil(startep / 30);
    let animedata = await animeinfo(provider, animeid, {
      fetch_info: true,
      page: currentPage,
    });
    if (!animedata) throw new Error("no anime found with this id");
    let Title = animedata.title;

    let allEpisodes = [...animedata.episodes];
    if (!endep) {
      const episode = animedata.episodes.find((ep) => ep.number === startep);
      if (episode) {
        allEpisodes = [episode];
      } else {
        allEpisodes = [];
        errors.push(`${Title} | ${startep} Not Found [skipped]`);
      }
    } else {
      // finding more ep if needed
      if (endep && endep > startep) {
        let lastFetchedEp = Math.max(...allEpisodes.map((ep) => ep.number));
        let nextPage = currentPage + 1;
        while (lastFetchedEp < endep) {
          const datanew = await animeinfo(provider, animeid, {
            fetch_info: false,
            page: nextPage,
          });
          if (!datanew || !datanew.episodes || datanew.episodes.length === 0) {
            break;
          }
          allEpisodes = [...allEpisodes, ...datanew.episodes];
          lastFetchedEp = Math.max(...allEpisodes.map((ep) => ep.number));
          nextPage++;
        }
      }
      // filtering ep
      allEpisodes = allEpisodes
        .filter((ep) => ep.number >= startep && ep.number <= endep)
        .sort((a, b) => a.number - b.number);
    }

    // Saving in metadata
    MetadataAdd("Anime", {
      id: animeid,
      title: `${Title} ${config?.subDub === "dub" ? "dub" : "sub"}`,
      provider: provider.provider_name,
      subOrDub: config?.subDub === "dub" ? "dub" : "sub",
      type: animedata.type ?? null,
      description: animedata.description ?? null,
      status: animedata.status ?? null,
      genres: animedata?.genres?.join(",") ?? null,
      aired: animedata?.aired ?? null,
      totalEpisodes: parseInt(animedata?.totalEpisodes) ?? null,
      last_page: parseInt(animedata?.last_page) ?? null,
      episodes: JSON.stringify(animedata?.episodes) ?? null,
      ImageUrl: animedata?.image,
    });

    // doing a foreach
    if (allEpisodes.length > 0) {
      for (let i = 0; i < allEpisodes.length; i++) {
        let epid = allEpisodes[i].id;

        if (!epid) {
          return errors.push(
            `${Title} | ${allEpisodes[i].number} Not Found [skipped]`
          );
        }

        let true_false = await checkEpisodeDownload(epid);

        if (true_false) {
          errors.push(
            `${Title} | ${allEpisodes[i].number} Already In Queue [ skiped ]`
          );
        } else {
          await addToQueue({
            Type: "Anime",
            EpNum: allEpisodes[i].number,
            id: animeid,
            Title: animedata.title,
            SubDub: `${config?.subDub === "dub" ? "dub" : "sub"}`,
            config: {
              Animeprovider: config?.Animeprovider,
              quality: config?.quality,
              mergeSubtitles: config?.mergeSubtitles,
              subtitleFormat: config?.subtitleFormat,
              CustomDownloadLocation: config?.CustomDownloadLocation,
            },
            epid: `${epid}`,
            image: animedata?.image ?? null,
            totalSegments: 0,
            currentSegments: 0,
          });
          Success.push(`${Title} | ${allEpisodes[i].number} Added To queue`);
        }
      }
    }
  }

  await saveQueue();

  // add to mal? TODO : FIX FOR ALL PROVIDERS
  // if (config.mal_on_off == true && config.Animeprovider === "") {
  //   try {
  //     let malid = await MalGogo(animeid);
  //     const true_false_added = await MalAddToList(malid, config.status);
  //     if (true_false_added === true) {
  //       Success.push(`Added ${Title} To ${config.status}.`);
  //     } else {
  //       info.push(`Couldnt Update ${Title} To ${config.status}`);
  //     }
  //   } catch (err) {
  //     info.push(`Couldnt Add ${Title} To Mal [ Logout and Login Again. ]`);
  //   }
  // }
  return { errors, info, Success };
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
  downloadfunction,
  MangaDownloadMain,
};
