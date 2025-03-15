let id = "test123456";
let type = null;
let Episodes = {};
let totalEpisodes = 0;

let ApiData = {
  image: "./images/image-404.png",
  title: "Mid Ahhh Jokes",
  description: "Still Airing! Stay Tuned For Next Part",
  genres: ["IDK THE GENRES SORRY."],
  type: "TV",
  subdub: "SUB",
  status: "AIRING",
  aired: "3/12/2025",
  LasySync: "now",
};

let EpisodeData = {
  hasNextPage: true,
  totalEpisodes: 10,
  totalPages: 2,
  currentPage: 1,
  downloadedEp: [5, 6],
  episodes: [
    {
      id: "xyz-1",
      number: 1,
      lang: "both",
    },
    {
      id: "xyz-2",
      number: 2,
      lang: "both",
    },
    {
      id: "xyz-3",
      number: 3,
      lang: "both",
    },
    {
      id: "xyz-4",
      number: 4,
      lang: "both",
    },
    {
      id: "xyz-5",
      number: 5,
      lang: "both",
    },
  ],
};

let EpisodeDatePage2 = {
  hasNextPage: false,
  currentPage: 2,
  totalEpisodes: 10,
  totalPages: 2,
  downloadedEp: [5, 6],
  episodes: [
    {
      id: "xyz-6",
      number: 6,
      lang: "sub",
    },
    {
      id: "xyz-7",
      number: 7,
      lang: "sub",
    },
    {
      id: "xyz-8",
      number: 8,
      lang: "sub",
    },
    {
      id: "xyz-9",
      number: 9,
      lang: "sub",
    },
    {
      id: "xyz-10",
      number: 10,
      lang: "sub",
    },
  ],
};

async function init(api, typeInput) {
  type = typeInput;
  // Call Api [ ApiData ]
  await AddInfo(ApiData);
  await HandleEpisodes(await EpisodeFetch(1));
}

async function AddInfo(data) {
  let LeftSide = document.querySelector(".anime-info-left");
  let RightSide = document.querySelector(".anime-info-right");

  // Create Img tag;
  if (data?.image) {
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

  Episodes[page] = { dubs: [], subs: [] };

  let data = { ...(page === 1 ? EpisodeData : EpisodeDatePage2) };

  data.episodes.forEach((item) => {
    if (data?.downloadedEp?.includes(item.number)) return;

    if (item.lang === "both") {
      Episodes[page].dubs.push({
        number: item.number,
        id: item.id,
      });
      Episodes[page].subs.push({
        number: item.number,
        id: item.id,
      });
    } else if (item.lang === "sub") {
      Episodes[page].subs.push({
        number: item.number,
        id: item.id,
      });
    } else if (item.lang === "dub") {
      Episodes[page].dubs.push({
        number: item.number,
        id: item.id,
      });
    }
  });

  delete data.episodes;
  Object.assign(Episodes[page], data);
  return Episodes[page];
}

async function HandleEpisodes(data) {
  // Updating Total & Sub & Dubs Episodes
  if (data?.totalEpisodes) {
    totalEpisodes = data?.totalEpisodes;
    document.getElementById(
      "totalep-p"
    ).textContent = `TOTAL EPISODES : ${data?.totalEpisodes}`;
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
          `<button class="episode" onclick="download('${sub.id}-sub')"> Download Episode ${sub.number} (SUB) </button>`
      )
      .join("");
  }

  // adding dubs
  if (data?.dubs?.length > 0) {
    document.getElementById("dubDownloads").innerHTML = data.dubs
      .map(
        (dub) =>
          `<button class="episode" onclick="download('${dub.id}-dub')"> Download Episode ${dub.number} (DUB) </button>`
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
    toggleDownloadFrom.onclick = () => downloadFromModal("subs");
    toggleDownloadAll.textContent = "Download All Episodes (SUB)";
    toggleDownloadAll.onclick = () => downloadAll("subs");
  } else {
    button.textContent = "Show Sub 🎭";
    toggleDownloadFrom.textContent = "Download From Specific Episodes (DUB)";
    toggleDownloadFrom.onclick = () => downloadFromModal("dubs");
    toggleDownloadAll.textContent = "Download All Episodes (DUB)";
    toggleDownloadAll.onclick = () => downloadAll("dubs");
  }
}

function changePage(page) {
  if (page < 1 || page > EpisodeData.totalPages) return;

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
      swal("Success!", "Syncing May Take Time!", "success");
      updateLastUpdated();
    }
  } catch (err) {
    swal("Couldnt Sync Animedata...", `Error: ${err}`, "error");
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

async function download(id) {
  try {
    const response = await fetch("/api/download/Anime", {
      method: "POST",
      body: JSON.stringify({
        id: id,
      }),
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
    });

    const responseData = await response.json();
    if (response.status === 400) {
      swal("Something Went Wrong..", `${responseData.message}`, "error");
    } else if (!response.ok) {
      swal(
        "Request Failed",
        `There are ${responseData.queue} Anime in Queue. 
          Error: ${responseData.message}`,
        "error"
      );
    } else {
      swal(
        `Added To Queue Current Queue Size : ${responseData.queue}!`,
        `[NOTE: if it skips episode that means that episode is not aviable yet! ]\n${responseData.message}`,
        "success"
      );
    }
  } catch (err) {
    console.log(err);
    swal("Couldnt add to queue...", `Error: ${err}`, "error");
  }
}

async function downloadAll(SubDub) {
  GetAllEpFetched(SubDub);
}

async function downloadFromModal(SubDub) {
  Swal.fire({
    title: `Download Episodes (${SubDub === "subs" ? "SUB" : "DUB"})`,
    html: `
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <label for="start">Start Episode (1)</label>
        <input id="start" type="number" class="swal2-input" value="1" min="1" required>
        
        <label for="end">End Episode (${totalEpisodes})</label>
        <input id="end" type="number" class="swal2-input" placeholder="Leave Blank If want to download only 1 Ep" required>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Submit",
    preConfirm: () => {
      let StartEp = parseInt(document.getElementById("start")?.value);
      if (!StartEp || StartEp < 1) {
        Swal.showValidationMessage("Start Episode must be greater then 0");
        return false;
      }

      let EndEp = parseInt(document.getElementById("end")?.value);
      if (EndEp && EndEp < StartEp) {
        Swal.showValidationMessage(
          `End Episode Must Be Greater Then ${StartEp} `
        );
        return false;
      } else if (EndEp && EndEp > totalEpisodes) {
        Swal.showValidationMessage(
          `End Episode Must be Less Then ${totalEpisodes}`
        );
        return false;
      }

      if (!EndEp) EndEp = 0;

      return {
        Start: StartEp,
        End: EndEp,
      };
    },
  }).then((result) => {
    if (result.isConfirmed) {
      console.log("First number:", result.value.Start);
      console.log("Second number:", result.value.EndEp);
    }
  });
}

async function GetAllEpFetched(SubDub) {
  let EpisodesToDownload = [];

  let AllKeys = Object.keys(Episodes);

  let LastPageFetched = AllKeys.reduce((acc, curr) => {
    if (curr > parseInt(acc)) return parseInt(curr);
  });

  let AllFetched =
    !Episodes?.[LastPageFetched]?.hasNextPage &&
    LastPageFetched === AllKeys.length;
  console.log(AllFetched);

  Object.values(Episodes).forEach((page) => {
    if (page[SubDub]) {
      EpisodesToDownload.push(...page[SubDub]);
    }
  });

  if (EpisodesToDownload?.length > 0) {
  } else {
  }

  return {};
}
