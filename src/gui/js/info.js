let type = null;
let id = null;
let AnimeMangaepid = null;

let Title = null;
let Image = null;

let totalEpisodes = 0;
let TotalPages = 0;
let EpisodesChapters = {};

let lastLoadedChapter = 0;
let TotalChapter = 0;
let CurrentChapter = 0;
let CurrentPage = 0;
let LoadNextChapter = "off";

// Track Current Page & Chapter
const observer = new IntersectionObserver(
  function updateCurrentPage(entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const ChapterAndPage = entry.target.id.split("-");

        CurrentChapter = parseInt(ChapterAndPage[1]);
        CurrentPage = parseInt(ChapterAndPage[2]);

        let ChapterData = EpisodesChapters?.Chapters[CurrentChapter];

        document.getElementById("currentPage").textContent = `${
          CurrentPage + 1
        }`;

        document.getElementById("currentChapter").textContent = `${
          CurrentChapter + 1
        }`;

        document.getElementById(
          "totalPages"
        ).textContent = `${ChapterData?.TotalPages}`;

        if (
          CurrentPage + 1 === ChapterData?.TotalPages &&
          LoadNextChapter &&
          lastLoadedChapter >= CurrentChapter &&
          CurrentChapter + 1 < EpisodesChapters?.Chapters.length &&
          !EpisodesChapters?.Chapters[CurrentChapter + 1]?.fetched
        ) {
          LoadChapter(CurrentChapter + 1, LoadNextChapter);
        }
      }
    });
  },
  {
    root: null,
    rootMargin: "0px",
    threshold: 0.1,
  }
);

async function init(typeInput, ApiInfoInput, IDInput, LoadNextChapterInput) {
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

  // Manga Chapters
  if (type === "Manga") {
    AnimeMangaepid = AnimeInfoData?.id;
    await AddInfo(AnimeInfoData);

    // AutoLoad
    LoadNextChapter = LoadNextChapterInput;

    // Fetch Manga Chapters List ( page 1 )
    await ChapterFetch();
    await HandleChapters();
  }
  // Anime Episodes
  else {
    AnimeMangaepid = AnimeInfoData?.dataId;
    await AddInfo(AnimeInfoData);
    // Fetch Episode List ( page 1 )
    let AnimeEpisodesData = await EpisodeFetch(1);
    await HandleEpisodes(AnimeEpisodesData);
  }
}

// Add Anime / Manga Info
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
  }${data?.released ? `Released : ${data?.released}<br>` : ""}${
    data?.author ? `Author : ${data?.author}<br>` : ""
  }<p id="totalep-p"></p><p id="subs-p"></p><p id="dubs-p"></p>${
    data?.last_updated ? `LAST UPDATED : ${data?.last_updated} <br>` : ""
  }`;

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
                id="watch-read-download-tongle"
                class="btn btn-outline-info"
                onclick="toggleDownloadWatchRead()"
            >${type === "Anime" ? "Watch" : "Read"}</button>
            
            ${
              data?.LasySync
                ? `<button
                id="sync"
                class="btn btn-outline-info"
                onclick="SyncInfo()"
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
      
      ${
        type === "Anime"
          ? `
          <button id="toggleDownloadOptions" class="btn btn-outline-info" onclick="toggleDownloadOptions('subs')" style="display: none">Show Dub 🎥</button>
          
          <button id="toggleDownloadFrom" onclick="AnimedownloadFromModal('subs')">Download From Specific Episodes (SUB)</button>

          <button id="toggleDownloadAll" onclick="AnimedownloadAll('subs')">Download All Episodes (SUB)</button>
          `
          : `

          <button id="toggleDownloadChapterFrom" onclick="MangadownloadFromModal()">Download From Specific Chapter</button>

          <button id="downloadallChapters" onclick="MangadownloadAll()">Download All Chapters</button>
          
          `
      }
    </div>

    ${
      type === "Anime"
        ? `
        <div class="pages"  style="display: none"></div>
        
        <div class="subOptions downloadOptions" id="subDownloads"></div>
        
        <div class="dubOptions downloadOptions" style="display: none" id="dubDownloads"></div>`
        : `

        <div class="chaptersOptions downloadOptions" id="chaptersDownloads"></div>
        `
    }
  </div>`;

  if (type === "Anime") {
    // Watching Container
    RightSide.innerHTML += `
  <div id="WatchReadContainer" style="display: none">
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
  } else {
    RightSide.innerHTML += `
    <div id="WatchReadContainer" style="display: none">
        <div id="mangaContainer" class="manga-container"></div>
    </div>

    <div id="WatchReadContainer" style="display: none">
      <div class="StickyMangaControls">

        <!-- Chapter Navigation -->
        <div class="chapter-navigation">
          <button id="prevChapter" class="manga-btn" onclick="PrevChapter()">
            &lt;
          </button>
          
          <span>
            Chapter:
            <span id="currentChapter">1</span> /
            <span id="totalChapters">?</span>
          </span>

          <button id="nextChapter" class="manga-btn" onclick="NextChapter()">
            &gt;
          </button>
        </div>

        <!-- Jump to Chapter (Inline) -->
        <div class="jump-container">
          <input type="number" id="jumpToChapter" placeholder="Enter Chapter" min="1" class="manga-input" />
          
          <button id="jumpChapterBtn" onclick="GoToChapter()"  class="manga-btn">Go</button>
        </div>

        <!-- Page Navigation (Inline) -->
        <div class="page-navigation">
          
          <button id="prevPage" class="manga-btn" onclick="PrevPage()">&lt;</button>

          <span>
            Page: <span id="currentPage">1</span> /
            <span id="totalPages">??</span></span>

          <button id="nextPage" class="manga-btn" onclick="NextPage()">&gt;</button>
        </div>

        <!-- Jump to Page (Inline) -->
        <div class="jump-container">
          <input type="number" id="jumpToPage" placeholder="Enter Page" min="1" class="manga-input"/>
          
          <button id="jumpPageBtn" class="manga-btn" onclick="GoToPage()">Go</button>
        </div>
      </div>
    </div>
    `;
  }
}

// Fetch Episodes
async function EpisodeFetch(page = 1) {
  if (EpisodesChapters[page]) {
    return EpisodesChapters[page];
  }

  let AnimeEpisodes = await fetch(`/api/episodes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: AnimeMangaepid,
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

  EpisodesChapters[page] = { dubs: [], subs: [] };

  data.episodes.forEach((item) => {
    if (data?.downloadedEp?.includes(item.number)) return;

    if (item.lang === "both") {
      EpisodesChapters[page].dubs.push({
        number: item.number,
        id: `${item.id}-dub`,
      });
      EpisodesChapters[page].subs.push({
        number: item.number,
        id: `${item.id}-sub`,
      });
    } else if (item.lang === "sub") {
      EpisodesChapters[page].subs.push({
        number: item.number,
        id: `${item.id}-sub`,
      });
    } else if (item.lang === "dub") {
      EpisodesChapters[page].dubs.push({
        number: item.number,
        id: `${item.id}-dub`,
      });
    }
  });

  delete data.episodes;
  Object.assign(EpisodesChapters[page], data);
  return EpisodesChapters[page];
}

// Fetch Chapters
async function ChapterFetch() {
  let MangaChapters = await fetch(`/api/chapters`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: AnimeMangaepid,
    }),
  });

  let data = await MangaChapters.json();

  if (data?.error) {
    window.location.href = `/error?message=${encodeURIComponent(
      data?.message ?? "Internal Error"
    )}`;
    return;
  }

  TotalChapter = data?.TotalChapter;
  EpisodesChapters = data;
}

// Handles Episodes
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
          `<button class="episode" onclick="Animedownload('${sub.id}',${sub.number},'sub')"> Download Episode ${sub.number} (SUB) </button>`
      )
      .join("");
  }

  // adding dubs
  if (data?.dubs?.length > 0) {
    document.getElementById("dubDownloads").innerHTML = data.dubs
      .map(
        (dub) =>
          `<button class="episode" onclick="Animedownload('${dub.id}',${dub.number},'dub')"> Download Episode ${dub.number} (DUB) </button>`
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

// Handles Chapters
async function HandleChapters() {
  if (EpisodesChapters?.total) {
    TotalChapter = EpisodesChapters.total;
    document.getElementById(
      "totalep-p"
    ).textContent = `TOTAL CHAPTERS : ${EpisodesChapters.total}`;

    document.getElementById(
      "totalChapters"
    ).textContent = `${EpisodesChapters.total}`;
  }

  // Adding Downloaded
  if (EpisodesChapters?.DownloadedChapters?.length > 0) {
    let downloadsEpsdiv = document.getElementById("downloaded-episodes-info");
    downloadsEpsdiv.style.display = "block";
    downloadsEpsdiv.innerHTML = `<p>⚠️ ${
      EpisodesChapters?.DownloadedChapters?.length
    } Chapter${
      EpisodesChapters?.DownloadedChapters?.length > 1
        ? "s Are Hidden As They Are"
        : " is Hidden As Its"
    } Already Downloaded!</p>`;
  }

  // Adding Chapters
  if (EpisodesChapters?.Chapters?.length > 0) {
    document.getElementById("chaptersDownloads").innerHTML =
      EpisodesChapters.Chapters.map(
        (chapter) =>
          `<button class="episode" onclick="Mangadownload('${chapter.id}', ${chapter.number})"> Chapter ${chapter.number} </button>`
      ).join("");
  }
}

// Tongle Watch / Read
function toggleDownloadWatchRead() {
  const downloadContainer = document.getElementById("downloadContainer");
  const watchContainer = document.querySelectorAll("#WatchReadContainer");
  const watchDownloadToggleButton = document.getElementById(
    "watch-read-download-tongle"
  );

  const watchDisplay = [...watchContainer].some(
    (container) => window.getComputedStyle(container).display !== "none"
  );
  const downloadDisplay = window.getComputedStyle(downloadContainer).display;

  if (downloadDisplay !== "none") {
    document.body.style.paddingBottom = "1rem";
    downloadContainer.style.display = "none";
    watchContainer.forEach((container) => (container.style.display = "block"));
    watchDownloadToggleButton.textContent = "Download";
    if (type === "Manga") {
      if (lastLoadedChapter === 0 && !EpisodesChapters?.Chapters[0]?.fetched) {
        EpisodesChapters.Chapters = EpisodesChapters.Chapters.reverse();
        LoadChapter(0, false);
      }
    }
  } else if (watchDisplay !== "none") {
    watchContainer.forEach((container) => (container.style.display = "none"));
    downloadContainer.style.display = "block";
    watchDownloadToggleButton.textContent = `${
      type === "Anime" ? "Watch" : "Read"
    }`;
  }
}

// Tongle DUB / SUB
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
    toggleDownloadFrom.onclick = () => AnimedownloadFromModal("sub");
    toggleDownloadAll.textContent = "Download All Episodes (SUB)";
    toggleDownloadAll.onclick = () => AnimedownloadAll("sub");
  } else {
    button.textContent = "Show Sub 🎭";
    toggleDownloadFrom.textContent = "Download From Specific Episodes (DUB)";
    toggleDownloadFrom.onclick = () => AnimedownloadFromModal("dub");
    toggleDownloadAll.textContent = "Download All Episodes (DUB)";
    toggleDownloadAll.onclick = () => AnimedownloadAll("dub");
  }
}

// Change Episode Page
function changePage(page) {
  if (page < 1 || page > TotalPages) return;

  EpisodeFetch(page).then((data) => {
    HandleEpisodes(data);
  });
}

// Handle Episode Input Page
function handlePageInput(event) {
  if (event.key === "Enter") {
    let page = parseInt(event.target.value);
    HandleEpisodes(EpisodeFetch(page));
  }
}

// Load Chapter
async function LoadChapter(ChapterNum, Append = false) {
  try {
    let Downloaded = EpisodesChapters?.DownloadedChapters?.includes(
      ChapterNum + 1
    );
    let Chapter = EpisodesChapters?.Chapters?.[ChapterNum];

    let data = null;

    if (!Chapter) {
      return Swal.fire({
        icon: "error",
        title: "Chapter Not Found",
        text: `Couldnt Find Chapter : ${ChapterNum}`,
      });
    } else if (!Downloaded && Chapter?.fetched && Append) {
      return scrollToElement(`mangapage-${ChapterNum}-0`);
    } else if (!Downloaded && Chapter && (!Chapter?.fetched || !Append)) {
      const response = await fetch("/api/read", {
        method: "POST",
        body: JSON.stringify({ chapterID: Chapter?.id }),
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
        },
      });

      data = await response.json();
    } else {
      let Foundchapter = EpisodesChapters?.Chapters[ChapterNum + 1];
      if (Foundchapter && Foundchapter?.fetched && !Append) {
        scrollToElement(`mangapage-${ChapterNum}-0`);
      } else {
        const response = await fetch("/api/read", {
          method: "POST",
          body: JSON.stringify({
            chapterID: ChapterNum + 1,
            Downloaded: true,
            MangaID: id,
          }),
          headers: {
            "Content-Type": "application/json; charset=UTF-8",
          },
        });

        data = await response.json();
      }
    }

    if (data) {
      if (!Append) scrollToElement(`mangaContainer`);

      const mangaContainer = document.getElementById("mangaContainer");
      if (!Append) {
        mangaContainer.innerHTML = `<h2>Chapter ${Chapter.number}</h2>`;
      } else {
        mangaContainer.innerHTML += `<h2>Chapter ${Chapter.number}</h2>`;
      }

      data.forEach((page, index) => {
        const img = document.createElement("img");
        img.src = page?.img;
        img.loading = "lazy";
        img.alt = `Manga Page ${page?.page}`;
        img.id = `mangapage-${ChapterNum}-${index}`;
        img.classList.add("manga-page");
        mangaContainer.appendChild(img);
      });

      document.querySelectorAll(".manga-page").forEach((img) => {
        observer.observe(img);
      });

      document.getElementById("currentChapter").textContent = `${
        CurrentChapter + 1
      }`;

      document.getElementById("totalChapters").textContent = `${TotalChapter}`;
      document.getElementById("currentPage").textContent = `1`;
      document.getElementById("totalPages").textContent = `${data.length}`;

      if (!EpisodesChapters?.Chapters?.fetched) {
        EpisodesChapters.Chapters[ChapterNum] = {
          ...EpisodesChapters?.Chapters[ChapterNum],
          fetched: true,
          TotalPages: data.length,
        };
      }
      CurrentChapter = ChapterNum;
      lastLoadedChapter = ChapterNum;
      CurrentPage = 0;
    } else {
      Swal.fire({
        icon: "error",
        title: "Failed To Load Chapter",
        text: "Chapter Loading Failed!",
      });
    }
  } catch (err) {
    console.log(err);
    Swal.fire({
      icon: "error",
      title: "Something Went Wrong",
      text: "While Loading The Chapter",
    });
  }
}

// Chapter prev
async function PrevChapter() {
  if (CurrentChapter > 0) {
    let Append = LoadNextChapter;
    if (Append && EpisodesChapters?.Chapters[CurrentChapter - 1]?.fetched) {
      Append = false;
      EpisodesChapters.Chapters = EpisodesChapters?.Chapters.map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
      }));
    }
    await LoadChapter(CurrentChapter - 1, Append);
  } else {
    Swal.fire({
      icon: "error",
      title: "No Prev Chapter",
      text: "Looks Like You Tried To Go Back Into Non Existing Chapter",
    });
  }
}

// Chapter Next
async function NextChapter() {
  if (CurrentChapter < EpisodesChapters?.Chapters?.length) {
    await LoadChapter(CurrentChapter + 1, LoadNextChapter);
  } else {
    Swal.fire({
      icon: "error",
      title: "No Chapters Found",
      text: "Hey Buddy Cooldown You Have Finished This Manga Congrats! :3",
    });
  }
}

// Chapter Go To
async function GoToChapter() {
  const chapterInput = document.getElementById("jumpToChapter").value;
  const chapterNumber = parseInt(chapterInput, 10);

  if (!isNaN(chapterNumber)) {
    let GoChapter = chapterNumber;
    chapterInput.value = "";

    if (GoChapter > EpisodesChapters?.Chapters.length || GoChapter <= 0) {
      Swal.fire({
        icon: "error",
        title: "No Chapter",
        text: "Looks Like You Tried To Search My GF 😭",
      });
    } else {
      let Append = LoadNextChapter;
      if (!EpisodesChapters.Chapters[GoChapter - 1]?.fetched) {
        Append = false;
        EpisodesChapters.Chapters = EpisodesChapters.Chapters.map(
          (chapter) => ({
            id: chapter.id,
            title: chapter.title,
          })
        );
      }
      await LoadChapter(GoChapter - 1, Append);
    }
  } else {
    Swal.fire({
      icon: "error",
      title: "Invalid Number",
      text: "Enter Valid Chapter Buddy :(",
    });
  }
}

// Current Chapter Prev Page
async function PrevPage() {
  if (CurrentPage > 0) {
    scrollToElement(`mangapage-${CurrentChapter}-${CurrentPage - 1}`);
  } else {
    Swal.fire({
      icon: "error",
      title: "No Page Found",
      text: "No Prev Page Found",
    });
  }
}

// Current Chapter Next Page
async function NextPage() {
  let ChapterData = EpisodesChapters.Chapters[CurrentChapter];
  if (CurrentPage < ChapterData?.TotalPages) {
    scrollToElement(`mangapage-${CurrentChapter}-${CurrentPage + 1}`);
  } else {
    Swal.fire({
      icon: "error",
      title: "Page Not Found",
      text: "Looks Like No More Pages!",
    });
  }
}

// Current Chapter Go To Page
async function GoToPage() {
  const PageInput = document.getElementById("jumpToPage").value;
  const PageNumber = parseInt(PageInput, 10);
  let ChapterData = EpisodesChapters.Chapters[CurrentChapter];
  if (ChapterData && ChapterData?.TotalPages) {
    if (!isNaN(PageNumber) && PageNumber <= ChapterData?.TotalPages) {
      PageInput.value = "";
      return scrollToElement(`mangapage-${CurrentChapter}-${PageNumber - 1}`);
    }
  }
  Swal.fire({
    icon: "error",
    title: "Invalid Number",
    text: "Enter a valid page number atleast :(",
  });
}

// Scroll To Element
function scrollToElement(elementId) {
  const targetElement = document.getElementById(elementId);
  if (targetElement) {
    targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// Download Episode
async function Animedownload(Epid, Epnumber, SubDub) {
  await DownloadApi(
    JSON.stringify({
      id: `${id.replace(/-(dub|sub|both)$/, ``)}-${SubDub}`,
      ep: Epid,
      number: Epnumber,
      Title: Title,
    }),
    "Single"
  );
}

// Download Chapters
async function Mangadownload(Mangaid, ChapterNumber) {
  await DownloadApi(
    JSON.stringify({
      id: id,
      ep: Mangaid,
      number: ChapterNumber,
      Title: Title,
    }),
    "Single"
  );
}

// Download All Episode
async function AnimedownloadAll(SubDub) {
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

      await DownloadApi(
        JSON.stringify({
          id: `${id.replace(/-(dub|sub|both)$/, ``)}-${SubDub}`,
          Title: Title,
          Episodes: data,
        }),
        "Multi"
      );
    },
  });
}

// Download All Chapters
async function MangadownloadAll() {
  await DownloadApi(
    JSON.stringify({
      id: id,
      Chapters: EpisodesChapters?.Chapters,
      Title: Title,
    }),
    "Single"
  );
}

// Download From X - Y Episodes
async function AnimedownloadFromModal(SubDub) {
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

          await DownloadApi(
            JSON.stringify({
              id: `${id.replace(/-(dub|sub|both)$/, ``)}-${SubDub}`,
              Title: Title,
              Episodes: data,
            }),
            "Multi"
          );
        },
      });
    }
  });
}

// Download X - Y Chapter
async function MangadownloadFromModal() {
  Swal.fire({
    title: `Download Chapters`,
    html: `
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <label for="start">Starting Chapter (1)</label>
      <input id="start" type="number" class="swal2-input" value="1" min="1" required>
      
      <label for="end">End Chapter (${TotalChapter})</label>
      <input id="end" type="number" class="swal2-input" placeholder="Leave Blank If downloading only 1 Ep" required>
    </div>
  `,
    showCancelButton: true,
    confirmButtonText: "Submit",
    preConfirm: () => {
      let StartChapter = parseInt(document.getElementById("start")?.value);
      if (!StartChapter || StartChapter < 1) {
        Swal.showValidationMessage("Start Chapter must be greater than 0");
        return false;
      }

      let EndChapter = parseInt(document.getElementById("end")?.value);
      if (EndChapter && EndChapter < StartChapter) {
        Swal.showValidationMessage(
          `End Episode Must Be Greater Than ${StartChapter}`
        );
        return false;
      } else if (EndChapter && EndChapter > TotalChapter) {
        Swal.showValidationMessage(
          `End Episode Must be Less Than ${TotalChapter}`
        );
        return false;
      }

      if (!EndChapter) EndChapter = StartChapter;

      return { Start: StartChapter, End: EndChapter };
    },
  }).then(async (result) => {
    if (result.isConfirmed) {
      let data = EpisodesChapters?.Chapters?.filter(
        (items) =>
          items?.number &&
          items?.number >= result.value.Start &&
          items?.number <= result.value.End
      );

      if (data?.length > 0) {
        await DownloadApi(
          JSON.stringify({
            id: id,
            Title: Title,
            Chapters: data,
          }),
          "Multi"
        );
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed To Update Queue!",
          text: `Couldnt Add Nothing In Queue 🤣 ( Hint You Tried To Download 0 Eps )`,
        });
      }
    }
  });
}

// Fetch Pages And Get All Episodes Fetched
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

// Call Single Api
async function DownloadApi(body, SingleMulti) {
  try {
    const response = await fetch(`/api/download/${type}/${SingleMulti}`, {
      method: "POST",
      body: body,
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

// Sync Anime
async function SyncInfo() {
  try {
    const response = await fetch(`/api/sync/local`, {
      method: "POST",
      body: JSON.stringify({
        [`${type === "Anime" ? "animeid" : "mangaid"}`]: id,
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

// Last Sync Update
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
