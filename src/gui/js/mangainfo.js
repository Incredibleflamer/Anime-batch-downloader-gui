let lastLoadedChapter = 0;
let CurrentChapter = 0;
let CurrentPage = 0;

// download modal
document.addEventListener("DOMContentLoaded", function () {
  const downloadFormButton = document.getElementById("download-form-button");
  const totalEpisodes = downloadFormButton.dataset.totalEpisodes;
  const epdata = downloadFormButton.dataset.ep;

  function showModal() {
    $("#downloadModal").modal("toggle");
  }

  downloadFormButton.addEventListener("click", showModal);

  const downloadForm = document.getElementById("download-form");
  downloadForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const startEpisode = parseInt(
      document.getElementById("start-episode").value
    );
    const endEpisode = parseInt(document.getElementById("end-episode").value);
    if (
      startEpisode > endEpisode ||
      startEpisode < 1 ||
      endEpisode > totalEpisodes ||
      startEpisode === 0 ||
      endEpisode === 0
    ) {
      alert("Invalid episode range. Please enter a valid range.");
      return;
    }
    await download(epdata, startEpisode, endEpisode);
    $("#downloadModal").modal("toggle");
  });
});

// download
async function download(ep, start, end) {
  try {
    const response = await fetch("/api/mangadownload", {
      method: "POST",
      body: JSON.stringify({
        ep: ep,
        start: start,
        end: end,
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
        `${responseData.message}`,
        "success"
      );
    }
  } catch (err) {
    console.log(err);
    swal("Couldnt add to queue...", `Error: ${err}`, "error");
  }
}

// Tongle Read / Download
function toggleDownloadRead(Internet) {
  const downloadContainer = document.getElementById("downloadContainer");
  const readContainers = document.querySelectorAll(".readContainer");
  const readDownloadToggleButton = document.getElementById(
    "read-download-tongle"
  );
  const noInternet = document.getElementById("nointernet");

  const noInternetDisplay = window.getComputedStyle(noInternet).display;
  const downloadDisplay = window.getComputedStyle(downloadContainer).display;
  const anyReadContainerVisible = [...readContainers].some(
    (container) => window.getComputedStyle(container).display !== "none"
  );

  if (noInternetDisplay !== "none") {
    noInternet.style.display = "none";
    readContainers.forEach((container) => (container.style.display = "block"));
    readDownloadToggleButton.textContent = "Download";
  } else if (downloadDisplay !== "none") {
    document.body.style.paddingBottom = "1rem";
    downloadContainer.style.display = "none";
    readContainers.forEach((container) => (container.style.display = "block"));
    readDownloadToggleButton.textContent = "Download";
  } else if (anyReadContainerVisible) {
    if (Internet) {
      readContainers.forEach((container) => (container.style.display = "none"));
      downloadContainer.style.display = "block";
      readDownloadToggleButton.textContent = "Read";
    } else {
      readContainers.forEach((container) => (container.style.display = "none"));
      noInternet.style.display = "block";
      readDownloadToggleButton.textContent = "Read";
    }
  }

  if (lastLoadedChapter === 0 && !Chapters[0]?.fetched) {
    LoadChapter(0, false);
  }
}

async function NextChapter() {
  if (CurrentChapter < Chapters.length) {
    await LoadChapter(CurrentChapter + 1, LoadNextChapter);
  } else {
    swal("No More Chapters Found", "", "error");
  }
}

async function PrevChapter() {
  if (CurrentChapter > 0) {
    let Append = LoadNextChapter;
    if (Append && Chapters[CurrentChapter - 1]?.fetched) {
      Append = false;
      Chapters = Chapters.map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
      }));
    }
    await LoadChapter(CurrentChapter - 1, Append);
  } else {
    swal("No Prev Chapters Found", "", "error");
  }
}

async function GoToChapter(GoChapter) {
  if (GoChapter > Chapters.length || GoChapter <= 0) {
    swal("No Chapters Found", "", "error");
  } else {
    let Append = LoadNextChapter;
    if (!Chapters[GoChapter - 1]?.fetched) {
      Append = false;
      Chapters = Chapters.map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
      }));
    }
    await LoadChapter(GoChapter - 1, Append);
  }
}

async function LoadChapter(ChapterNum, Append = false) {
  try {
    let Downloaded = DownloadedChapters.includes(ChapterNum + 1);
    let Chapter = Chapters?.[ChapterNum];

    let data = null;

    if (!Chapter) {
      return swal("Chapter Not Found.", "", "error");
    } else if (!Downloaded && Internet && Chapter?.fetched && Append) {
      return scrollToElement(`mangapage-${ChapterNum}-0`);
    } else if (!Downloaded && !Internet) {
      let current_downloaded_index = DownloadedChapters.indexOf(ChapterNum);

      if (current_downloaded_index < DownloadedChapters.length - 1) {
        let NextAvalibleChapter =
          DownloadedChapters[current_downloaded_index + 1];
        let Foundchapter = Chapters[NextAvalibleChapter - 1];

        if (Foundchapter && Foundchapter?.fetched) {
          return scrollToElement(`mangapage-${NextAvalibleChapter}-0`);
        } else {
          mangaContainer.innerHTML += `<h2> Skipping From ${
            ChapterNum + 1
          } ... ${NextAvalibleChapter - 1} </h2>`;
          mangaContainer.innerHTML += "<h2> Not Downloaded & No Internet <h2>";
          return LoadChapter(NextAvalibleChapter - 1, true);
        }
      } else {
        mangaContainer.innerHTML += "<h2> Couldnt Find More Chapters!<h2>";
        mangaContainer.innerHTML += "<h2> Reason : No Internet <h2>";
        return;
      }
    } else if (
      !Downloaded &&
      Internet &&
      Chapter &&
      (!Chapter?.fetched || !Append)
    ) {
      const response = await fetch("/api/read", {
        method: "POST",
        body: JSON.stringify({ chapterID: Chapter?.id }),
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
        },
      });

      data = await response.json();
    } else {
      let Foundchapter = Chapters[ChapterNum + 1];
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
        mangaContainer.innerHTML = `<h2>${Chapter.title}</h2>`;
      } else {
        mangaContainer.innerHTML += `<h2>${Chapter.title}</h2>`;
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

      if (!Chapters?.fetched) {
        Chapters[ChapterNum] = {
          ...Chapters[ChapterNum],
          fetched: true,
          TotalPages: data.length,
        };
      }
      CurrentChapter = ChapterNum;
      lastLoadedChapter = ChapterNum;
      CurrentPage = 0;
    } else {
      swal("Failed to load chapter pages.", "", "error");
    }
  } catch (err) {
    console.log(err);
    swal("Something went wrong while loading the chapter.", "", "error");
  }
}

document.getElementById("jumpChapterBtn").addEventListener("click", () => {
  const chapterInput = document.getElementById("jumpToChapter").value;
  const chapterNumber = parseInt(chapterInput, 10);

  if (!isNaN(chapterNumber)) {
    GoToChapter(chapterNumber);
    chapterInput.value = "";
  } else {
    swal("Please enter a valid chapter number.", "", "error");
  }
});

const observer = new IntersectionObserver(
  function updateCurrentPage(entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const ChapterAndPage = entry.target.id.split("-");

        CurrentChapter = parseInt(ChapterAndPage[1]);
        CurrentPage = parseInt(ChapterAndPage[2]);

        let ChapterData = Chapters[CurrentChapter];

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
          CurrentChapter + 1 < Chapters.length &&
          !Chapters[CurrentChapter + 1]?.fetched
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

function scrollToElement(elementId) {
  const targetElement = document.getElementById(elementId);
  if (targetElement) {
    targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

document.getElementById("jumpPageBtn").addEventListener("click", () => {
  const PageInput = document.getElementById("jumpToPage").value;
  const PageNumber = parseInt(PageInput, 10);
  let ChapterData = Chapters[CurrentChapter];
  if (ChapterData && ChapterData?.TotalPages) {
    if (!isNaN(PageNumber) && PageNumber <= ChapterData?.TotalPages) {
      PageInput.value = "";
      return scrollToElement(`mangapage-${CurrentChapter}-${PageNumber - 1}`);
    }
  }
  swal("Please enter a valid Page number.", "", "error");
});

async function NextPage() {
  let ChapterData = Chapters[CurrentChapter];
  if (CurrentPage < ChapterData?.TotalPages) {
    scrollToElement(`mangapage-${CurrentChapter}-${CurrentPage + 1}`);
  } else {
    swal("No More Page Found", "", "error");
  }
}

async function PrevPage() {
  if (CurrentPage > 0) {
    scrollToElement(`mangapage-${CurrentChapter}-${CurrentPage - 1}`);
  } else {
    swal("No Prev Page Found", "", "error");
  }
}

async function SyncMangaInfo(mangaid) {
  try {
    const response = await fetch(`/api/sync/local`, {
      method: "POST",
      body: JSON.stringify({
        mangaid: mangaid,
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
