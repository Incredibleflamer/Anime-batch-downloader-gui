let type = null;
let id = null;
let Animeepid = null;

let Title = null;
let Image = null;

let totalEpisodes = 0;
let TotalPages = 0;
let Episodes = {};

async function init(typeInput, ApiInfoInput, IDInput) {
  type = typeInput;
  id = IDInput;

  // Animeinfo
  let Animeinfo = await fetch(ApiInfoInput, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: id,
    }),
  });

  let AnimeInfoData = await Animeinfo.json();

  if (AnimeInfoData?.error) {
    window.location.href = `/error?message=${encodeURIComponent(
      AnimeInfoData?.message ?? "Internal Error"
    )}`;
    return;
  }

  Animeepid = AnimeInfoData?.dataId;

  await AddInfo(AnimeInfoData);

  // Fetch Episode List ( page 1 )
  let AnimeEpisodesData = await EpisodeFetch(1);
  await HandleEpisodes(AnimeEpisodesData);
}

async function AddInfo(data) {
  let LeftSide = document.querySelector(".anime-info-left");
  let RightSide = document.querySelector(".anime-info-right");

  if (data?.title) {
    Title = data.title;
    document.title = `Anime Downloader | ${Title}`;
  }

  // Create Img tag;
  if (data?.image) {
    Image = data.image;
    LeftSide.innerHTML += `<img class="anime-image" src="${data?.image}" alt="${data?.title}" id="anime-image" onerror="this.onerror=null; this.src='./images/image-404.png';">`;
  }

  // Creating Addition Info
  LeftSide.innerHTML += `<div id="additional-info">
  ${
    data?.type
      ? `TYPE: ${data.type} ${
          data?.subOrDub ? `( ${data.subOrDub} )` : ``
        } <br>`
      : ""
  }${data?.status ? `STATUS: ${data.status} <br>` : ""}${
    data?.aired ? `AIRED ON : ${data.aired} <br>` : ""
  }${
    data?.last_updated ? `LAST UPDATED : ${data?.last_updated} <br>` : ""
  }<p id="totalep-p"></p><p id="subs-p"></p><p id="dubs-p"></p>`;

  // episodes will be pushed later inside addition-info div
  RightSide.innerHTML += `
  <div class="anime-title font">${data?.title ?? "No Title Found"}</div>
  <div class="description">${data?.description ?? "No Description Found"}</div>
  <div class="genres"> 
    ${
      data?.genres?.length > 0
        ? data.genres
            .map(
              (element) =>
                `<button type="button" class="genre">${element}</button>`
            )
            .join("")
        : ""
    }
  </div>

  <div class="flex-container">
        <div class="watch-sync-container">
            <button
                id="watch-download-tongle"
                class="btn btn-outline-info"
                onclick="toggleDownloadWatch()"
            >${type === "Anime" ? "Watch" : "Read"}</button>
            
            ${
              data?.LasySync
                ? `<button
                id="sync"
                class="btn btn-outline-info"
                onclick="SyncAnimeInfo('<%= data.id %>')"
            >Sync</button>`
                : ""
            }
        </div>
  </div>
`;

  // Download Container Structure
  RightSide.innerHTML += `
  <div id="downloadContainer"><h2>Download Options</h2>
  
    <div id="downloaded-episodes-info" style="display: none"></div>

    <div id="toggle-container">
      <button id="toggleDownloadOptions" class="btn btn-outline-info" onclick="toggleDownloadOptions('subs')" style="display: none">Show Dub 🎥</button>

      <button id="toggleDownloadFrom" onclick="downloadFromModal('subs')">Download From Specific Episodes (SUB)</button>

      <button id="toggleDownloadAll" onclick="downloadAll('subs')">Download All Episodes (SUB)</button>
    </div>

    <div class="pages"  style="display: none"></div>

    <div class="subOptions downloadOptions" id="subDownloads"></div>
    
    <div class="dubOptions downloadOptions" style="display: none" id="dubDownloads"></div>
  </div>`;

  // Watching Container
  RightSide.innerHTML += `
  <div id="watchContainer" style="display: none">
    
    <div class="video-player">
      <div class="description" id="now_playing">Now Playing :</div>
      <video id="vid1" class="video-js vjs-default-skin" controls></video>
      <br /> select video <h4>Click on ep from below to start playing!</h4>
    </div>

    <div id="playfromdownloads" style="display: none">
      <h5>Play From Downloads</h5>
      <div class="downloadOptions" id="playdownloads"></div>
    </div>

    <div class="pages" style="display: none"></div>

    <div id="playfromonline" style="display: none">
      <h5>Play From Online</h5>
      <div class="downloadOptions" id="playonline"></div>
    </div>
  </div>`;
}

async function EpisodeFetch(page = 1) {
  if (Episodes[page]) {
    return Episodes[page];
  }

  let AnimeEpisodes = await fetch(`/api/episodes/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: Animeepid,
      page: page,
    }),
  });

  let data = await AnimeEpisodes.json();

  if (data?.error) {
    window.location.href = `/error?message=${encodeURIComponent(
      data?.message ?? "Internal Error"
    )}`;
    return;
  }

  TotalPages = data?.TotalPages;
  totalEpisodes = data?.total;

  Episodes[page] = { dubs: [], subs: [] };

  data.episodes.forEach((item) => {
    if (data?.downloadedEp?.includes(item.number)) return;

    if (item.lang === "both") {
      Episodes[page].dubs.push({
        number: item.number,
        id: `${item.id}-dub`,
      });
      Episodes[page].subs.push({
        number: item.number,
        id: `${item.id}-sub`,
      });
    } else if (item.lang === "sub") {
      Episodes[page].subs.push({
        number: item.number,
        id: `${item.id}-sub`,
      });
    } else if (item.lang === "dub") {
      Episodes[page].dubs.push({
        number: item.number,
        id: `${item.id}-dub`,
      });
    }
  });

  delete data.episodes;
  Object.assign(Episodes[page], data);
  return Episodes[page];
}

async function HandleEpisodes(data) {
  // Updating Total & Sub & Dubs Episodes
  if (data?.total) {
    document.getElementById(
      "totalep-p"
    ).textContent = `TOTAL EPISODES : ${data?.total}`;
  }

  if (data?.subs?.length > 0) {
    document.getElementById("subs-p").textContent = `SUB : ${data.subs.length}`;
  }

  if (data?.dubs?.length > 0) {
    document.getElementById("dubs-p").textContent = `DUB : ${data.dubs.length}`;
  }

  // Downloaded Episodes
  if (data?.downloadedEp?.length > 0) {
    let downloadsEpsdiv = document.getElementById("downloaded-episodes-info");
    downloadsEpsdiv.style.display = "block";
    downloadsEpsdiv.innerHTML = `<p>⚠️ ${data?.downloadedEp?.length} Episode${
      data?.downloadedEp?.length > 1
        ? "s Are Hidden As They Are"
        : " is Hidden As Its"
    } Already Downloaded!</p>`;
  }

  // sub dub tongle
  if (data?.subs?.length > 0 && data?.dubs?.length > 0) {
    document.getElementById("toggleDownloadOptions").style.display = "block";
  } else {
    document.getElementById("toggleDownloadOptions").style.display = "none";
    toggleDownloadOptions(data?.subs?.length > 0 ? "sub" : "dub");
  }

  // adding subs
  if (data?.subs?.length > 0) {
    document.getElementById("subDownloads").innerHTML = data.subs
      .map(
        (sub) =>
          `<button class="episode" onclick="download('${sub.id}',${sub.number},'sub')"> Download Episode ${sub.number} (SUB) </button>`
      )
      .join("");
  }

  // adding dubs
  if (data?.dubs?.length > 0) {
    document.getElementById("dubDownloads").innerHTML = data.dubs
      .map(
        (dub) =>
          `<button class="episode" onclick="download('${dub.id}',${dub.number},'dub')"> Download Episode ${dub.number} (DUB) </button>`
      )
      .join("");
  }

  if (data?.totalPages > 1) {
    document.querySelectorAll(".pages").forEach((PageHandlers) => {
      PageHandlers.style.display = "flex";

      PageHandlers.innerHTML = `
      <button class="page" onclick="changePage(${data?.currentPage - 1})" ${
        data?.currentPage === 1 ? "disabled" : ""
      }>&lt;</button>
      
      <span class="totalPages">
        <input type="number" id="pageInput" min="1" max="${
          data?.totalPages
        }" value="${
        data?.currentPage
      }" onkeypress="handlePageInput(event)" class="pageInput"> : &nbsp &nbsp &nbsp &nbsp${
        data?.totalPages
      }
      </span>
      
      <button class="page" onclick="changePage(${data?.currentPage + 1})" ${
        data?.currentPage === data?.totalPages ? "disabled" : ""
      }>&gt;</button>
      </div>
      `;
    });
  }

  // Watch : Downloaded Episodes
  if (data?.downloadedEp?.length > 0) {
    document.getElementById("playfromdownloads").style.display = "grid";
    document.getElementById("playdownloads").innerHTML = data?.downloadedEp
      .map(
        (ep) =>
          `<button class="episode" onclick="Videoplay('${ep}')", true> Watch EP ${ep}</button>`
      )
      .join("");
  }

  // Watch : Online
  if (data?.subs?.length > 0 || data?.dubs?.length > 0) {
    document.getElementById("playfromonline").style.display = "grid";
    const episodesMap = new Map();
    [...(data.subs || []), ...(data.dubs || [])].forEach((ep) => {
      episodesMap.set(ep.id, ep);
    });

    document.getElementById("playonline").innerHTML = [...episodesMap.values()]
      .map(
        (ep) =>
          `<button class="episode" onclick="Videoplay('${ep.id}')">
          Watch EP ${ep.number}
       </button>`
      )
      .join("");
  }
}

function toggleDownloadWatch() {
  const downloadContainer = document.getElementById("downloadContainer");
  const watchContainer = document.getElementById("watchContainer");
  const watchDownloadToggleButton = document.getElementById(
    "watch-download-tongle"
  );

  const watchDisplay = window.getComputedStyle(watchContainer).display;
  const downloadDisplay = window.getComputedStyle(downloadContainer).display;

  if (downloadDisplay !== "none") {
    document.body.style.paddingBottom = "1rem";
    downloadContainer.style.display = "none";
    watchContainer.style.display = "block";
    watchDownloadToggleButton.textContent = "Download";
  } else if (watchDisplay !== "none") {
    watchContainer.style.display = "none";
    downloadContainer.style.display = "block";
    watchDownloadToggleButton.textContent = "Watch";
  }
}

function toggleDownloadOptions(type = null) {
  const toggleDownloadFrom = document.getElementById("toggleDownloadFrom");
  const toggleDownloadAll = document.getElementById("toggleDownloadAll");
  const dubOptions = document.getElementsByClassName("dubOptions");
  const subOptions = document.getElementsByClassName("subOptions");
  const button = document.getElementById("toggleDownloadOptions");

  let showSub =
    type === "sub" || (type === null && subOptions[0].style.display === "none");

  for (let i = 0; i < subOptions.length; i++) {
    subOptions[i].style.display = showSub ? "grid" : "none";
  }
  for (let i = 0; i < dubOptions.length; i++) {
    dubOptions[i].style.display = showSub ? "none" : "grid";
  }

  if (showSub) {
    button.textContent = "Show Dub 🎥";
    toggleDownloadFrom.textContent = "Download From Specific Episodes (SUB)";
    toggleDownloadFrom.onclick = () => downloadFromModal("sub");
    toggleDownloadAll.textContent = "Download All Episodes (SUB)";
    toggleDownloadAll.onclick = () => downloadAll("sub");
  } else {
    button.textContent = "Show Sub 🎭";
    toggleDownloadFrom.textContent = "Download From Specific Episodes (DUB)";
    toggleDownloadFrom.onclick = () => downloadFromModal("dub");
    toggleDownloadAll.textContent = "Download All Episodes (DUB)";
    toggleDownloadAll.onclick = () => downloadAll("dub");
  }
}

function changePage(page) {
  if (page < 1 || page > TotalPages) return;

  EpisodeFetch(page).then((data) => {
    HandleEpisodes(data);
  });
}

function handlePageInput(event) {
  if (event.key === "Enter") {
    let page = parseInt(event.target.value);
    HandleEpisodes(EpisodeFetch(page));
  }
}

// Sync Anime
async function SyncAnimeInfo(animeid) {
  try {
    const response = await fetch(`/api/sync/local`, {
      method: "POST",
      body: JSON.stringify({
        animeid: animeid,
      }),
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
    });
    if (response.status === 400 || !response.ok) {
      throw new Error("Something Went Wrong");
    } else {
      Swal.fire({
        icon: "success",
        title: "Sync In Process",
        text: "Syncing May Take Time!",
      });
      updateLastUpdated();
    }
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Failed To Sync!",
      text: `Error: \n${err}`,
    });
  }
}

function updateLastUpdated() {
  const additionalInfo = document.getElementById("additional-info");
  if (!additionalInfo) return;

  const lines = additionalInfo.innerHTML.split("<br>");

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("Last Updated")) {
      lines[i] = `Last Updated: now`;
      break;
    }
  }

  additionalInfo.innerHTML = lines.join("<br>");
}

async function download(Epid, Epnumber, SubDub) {
  try {
    const response = await fetch("/api/download/Anime/Single", {
      method: "POST",
      body: JSON.stringify({
        id: `${id.replace(/-(dub|sub|both)$/, ``)}-${SubDub}`,
        ep: Epid,
        number: Epnumber,
        Title: Title,
      }),
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
    });

    const responseData = await response.json();
    if (responseData?.error) {
      Swal.fire({
        icon: "error",
        title: "Failed To Update Queue!",
        text: `Error: ${responseData?.message ?? "Internal Error"}`,
      });
    } else {
      Swal.fire({
        icon: "success",
        title: "Updated Queue!",
        text: `${responseData?.message ?? "no message provided by backend"}`,
      });
    }
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Failed To Update Queue!",
      text: `Error: ${err?.message ?? "Internal Error"}`,
    });
  }
}

async function downloadAll(SubDub) {
  Swal.fire({
    title: "Fetching All Episodes...",
    html: `
      <p style="font-size: 14px;">Don't close this window.</p>
      <progress id="progressBar" value="0" max="100" style="width: 100%;"></progress>
      <p id="progressText">Fetching pages... (0%)</p>
      <p id="timeEstimate"></p>
    `,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: async () => {
      let progressBar = document.getElementById("progressBar");
      let progressText = document.getElementById("progressText");
      let timeEstimate = document.getElementById("timeEstimate");

      let data = await GetAllEpFetched(
        SubDub,
        1,
        totalEpisodes,
        (pagesFetched, pagesToFetch) => {
          let progressPercent = ((pagesFetched / pagesToFetch) * 100).toFixed(
            0
          );
          progressBar.value = progressPercent;
          progressText.innerText = `Fetched ${pagesFetched} / ${pagesToFetch} pages (${progressPercent}%)`;
          timeEstimate.innerText = `Estimated time: ${
            pagesToFetch - pagesFetched + 1
          } seconds left`;
        }
      );

      await DOWNLOADAPI(data, SubDub);
    },
  });
}

async function downloadFromModal(SubDub) {
  Swal.fire({
    title: `Download Episodes (${SubDub === "subs" ? "SUB" : "DUB"})`,
    html: `
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <label for="start">Start Episode (1)</label>
        <input id="start" type="number" class="swal2-input" value="1" min="1" required>
        
        <label for="end">End Episode (${totalEpisodes})</label>
        <input id="end" type="number" class="swal2-input" placeholder="Leave Blank If downloading only 1 Ep" required>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Submit",
    preConfirm: () => {
      let StartEp = parseInt(document.getElementById("start")?.value);
      if (!StartEp || StartEp < 1) {
        Swal.showValidationMessage("Start Episode must be greater than 0");
        return false;
      }

      let EndEp = parseInt(document.getElementById("end")?.value);
      if (EndEp && EndEp < StartEp) {
        Swal.showValidationMessage(
          `End Episode Must Be Greater Than ${StartEp}`
        );
        return false;
      } else if (EndEp && EndEp > totalEpisodes) {
        Swal.showValidationMessage(
          `End Episode Must be Less Than ${totalEpisodes}`
        );
        return false;
      }

      if (!EndEp) EndEp = StartEp;

      return { Start: StartEp, End: EndEp };
    },
  }).then(async (result) => {
    if (result.isConfirmed) {
      Swal.fire({
        title: "Fetching Episodes...",
        html: `
          <p style="font-size: 14px;">Don't close this window.</p>
          <progress id="progressBar" value="0" max="100" style="width: 100%;"></progress>
          <p id="progressText">Fetching pages... (0%)</p>
          <p id="timeEstimate"></p>
        `,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: async () => {
          let progressBar = document.getElementById("progressBar");
          let progressText = document.getElementById("progressText");
          let timeEstimate = document.getElementById("timeEstimate");

          let data = await GetAllEpFetched(
            SubDub,
            result.value.Start,
            result.value.End,
            (pagesFetched, pagesToFetch) => {
              let progressPercent = (
                (pagesFetched / pagesToFetch) *
                100
              ).toFixed(0);
              progressBar.value = progressPercent;
              progressText.innerText = `Fetched ${pagesFetched} / ${pagesToFetch} pages (${progressPercent}%)`;
              timeEstimate.innerText = `Estimated time: ${
                pagesToFetch - pagesFetched + 1
              } seconds left`;
            }
          );

          data = data.filter(
            (item) =>
              item.number >= result.value.Start &&
              item.number <= result.value.End
          );

          await DOWNLOADAPI(data, SubDub);
        },
      });
    }
  });
}

async function GetAllEpFetched(SubDub, Start, End, progressCallback) {
  let EpisodesToDownload = [];

  let AllKeys = Object.keys(Episodes).map(Number);
  let LastPageFetched = Math.max(...AllKeys, 0);

  let AllFetched =
    !Episodes?.[LastPageFetched]?.hasNextPage && AllKeys.length === TotalPages;

  let FirstPage = Math.ceil(Start / 30);
  let LastPage = Math.ceil(End / 30);
  let pagesToFetch = [];
  for (let i = FirstPage; i <= LastPage; i++) {
    if (!AllKeys.includes(i)) {
      pagesToFetch.push(i);
    }
  }

  let pagesFetched = 0;
  for (let page of pagesToFetch) {
    await EpisodeFetch(page);
    pagesFetched++;

    if (progressCallback) {
      progressCallback(pagesFetched, pagesToFetch.length);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  leftPages = !AllFetched
    ? Array.from({ length: TotalPages }, (_, i) => i + 1).filter(
        (page) => !Object.keys(Episodes).map(Number).includes(page)
      )
    : [];

  Object.values(Episodes).forEach((page) => {
    if (page[`${SubDub}s`] && Array.isArray(page[`${SubDub}s`])) {
      EpisodesToDownload.push(...page[`${SubDub}s`]);
    }
  });

  return EpisodesToDownload;
}

async function DOWNLOADAPI(Episodes, SubDub) {
  try {
    const response = await fetch("/api/download/Anime/Multi", {
      method: "POST",
      body: JSON.stringify({
        id: `${id.replace(/-(dub|sub|both)$/, ``)}-${SubDub}`,
        Title: Title,
        Episodes: Episodes,
      }),
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
    });

    const responseData = await response.json();
    if (responseData?.error) {
      Swal.fire({
        icon: "error",
        title: "Failed To Update Queue!",
        text: `Error: ${responseData?.message ?? "Internal Error"}`,
      });
    } else {
      Swal.fire({
        icon: "success",
        title: "Update Queue!",
        text: responseData?.message ?? "no message provided by backend",
      });
    }
  } catch (err) {
    console.log(err);
    Swal.fire({
      icon: "error",
      title: "Failed To Update Queue!",
      text: `Error: ${err?.message ?? "Internal Error"}`,
    });
  }
}
