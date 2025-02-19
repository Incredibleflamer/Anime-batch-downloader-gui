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
function tongledownloadread() {
  const downloadContainer = document.getElementById("downloadContainer");
  const readContainers = document.querySelectorAll(".readContainer");
  const watchDownloadToggleButton = document.getElementById(
    "read-download-tongle"
  );

  if (downloadContainer.style.display === "none") {
    downloadContainer.style.display = "block";
    readContainers.forEach((container) => (container.style.display = "none"));
    document.body.style.overflowY = "hidden";
    watchDownloadToggleButton.textContent = "Read";
  } else {
    downloadContainer.style.display = "none";
    readContainers.forEach((container) => (container.style.display = "block"));
    document.body.style.overflowY = "auto";
    document.body.style.paddingBottom = "1rem";
    watchDownloadToggleButton.textContent = "Download";
  }
}

let LoadNextChapter = false;
let lastLoadedChapter = 0;
let CurrentChapter = 0;
let TotalChapter = 0;
let CurrentPage = 0;
let Chapters = [];

// Load Manga
function initChapterRead(total, chapters, autoLoadNextChapter) {
  TotalChapter = total;
  Chapters = chapters;
  LoadChapter(0, false);
  LoadNextChapter = autoLoadNextChapter === "on";
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
    let Chapter = Chapters[ChapterNum];
    if (Chapter) {
      if (!Chapter?.fetched || !Append) {
        const response = await fetch("/api/read", {
          method: "POST",
          body: JSON.stringify({ chapterID: Chapter?.id }),
          headers: {
            "Content-Type": "application/json; charset=UTF-8",
          },
        });

        const data = await response.json();
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

          document.getElementById(
            "totalChapters"
          ).textContent = `${TotalChapter}`;
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
      } else {
        scrollToElement(`mangapage-${ChapterNum}-0`);
      }
    } else {
      swal("Chapter Not Found.", "", "error");
    }
  } catch (err) {
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
