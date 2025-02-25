let pagination = "";
let catagorie = "";
let ApiCall = "";
let currentPage = 1;
let isFetching = false;
let totalPages = false;
let allDataFetched = false;
let hasNextPage = false;

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

function isScrolledToBottom() {
  return window.innerHeight + window.scrollY >= document.body.offsetHeight;
}

async function fetchPageData(page) {
  try {
    const response = await fetch(ApiCall, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ page: page, title: catagorie }),
    });
    if (!response.ok) {
      throw new Error("Failed to fetch data");
    }
    const data = await response.json();
    if (data?.currentPage) {
      currentPage = data?.currentPage;
    } else {
      currentPage += 1;
    }

    if (data?.hasNextPage) {
      hasNextPage = true;
    } else if (!data?.hasNextPage || data?.hasNextPage === false) {
      hasNextPage = false;
    }
    return data;
  } catch (err) {
    console.error("Error fetching data:", err);
    return null;
  }
}

async function addchild(data) {
  const animeGrid = document.getElementById("anime-grid");
  if (pagination === "on") {
    animeGrid.innerHTML = "";
  }
  if (data && data.results && data.results.length > 0) {
    data.results.forEach((result) => {
      const animeCard = document.createElement("div");
      animeCard.classList.add("anime-card");
      animeCard.innerHTML = `
          <a href="/mangainfo?mangaid=${result.id}">
            <div class="anime-item">
              <img src="${result.image}" alt="${result.title}" />
              <div class="overlay">${result.title}</div>
              </div>
          </a>
        `;
      animeGrid.appendChild(animeCard);
    });
  }
}

async function handleScroll() {
  if (!allDataFetched && !isFetching && isScrolledToBottom()) {
    isFetching = true;
    const data = await fetchPageData(currentPage + 1);
    if (data && data.results && data.results.length > 0) {
      currentPage++;
      await addchild(data);
    } else {
      allDataFetched = true;
    }
    isFetching = false;
  }
}

function addPaginationControls() {
  const paginationContainer = document.getElementById("pagination-controls");
  paginationContainer.innerHTML = "";
  if (hasNextPage) {
    const inputField = `<input type="number" id="pageInput" min="1" max="${
      totalPages || ""
    }" value="${currentPage}" class="pagination-btn page-number" style="width: 80px; text-align: center;" inputmode="numeric" pattern="[0-9]*">`;

    let firstButtons = "";
    let lastButtons = "";

    if (totalPages) {
      firstButtons = Array.from(
        { length: Math.min(4, totalPages) },
        (_, i) => i + 1
      )
        .map(
          (page) =>
            `<button class="pagination-btn page-number ${
              page === currentPage ? "active" : ""
            }" data-page="${page}" ${
              page === currentPage ? "disabled" : ""
            }>${page}</button>`
        )
        .join("");

      lastButtons =
        totalPages > 4
          ? Array.from({ length: 4 }, (_, i) => totalPages - 3 + i)
              .map(
                (page) =>
                  `<button class="pagination-btn page-number ${
                    page === currentPage ? "active" : ""
                  }" data-page="${page}" ${
                    page === currentPage ? "disabled" : ""
                  }>${page}</button> `
              )
              .join("")
          : "";

      paginationContainer.innerHTML = `
  <div class="pagination-wrapper">
    ${firstButtons} <button class="pagination-btn page-number" id="prevPage">&lt;</button> ${inputField} <button class="pagination-btn page-number" id="nextPage">&gt;</button> ${lastButtons}
  </div>`;
    } else {
      paginationContainer.innerHTML = `
  <div class="pagination-wrapper">
    <button class="pagination-btn page-number" id="prevPage">&lt;</button>
    ${inputField}
    <button class="pagination-btn page-number" id="nextPage">&gt;</button>
  </div>`;
    }

    document
      .querySelectorAll("#pagination-controls button[data-page]")
      .forEach((btn) =>
        btn.addEventListener("click", (e) =>
          handlePagination(parseInt(e.target.dataset.page, 10))
        )
      );

    const pageInput = document.getElementById("pageInput");
    pageInput.addEventListener("change", (e) =>
      handlePagination(parseInt(e.target.value, 10))
    );

    if (currentPage > 1) {
      document
        .getElementById("prevPage")
        .addEventListener("click", () => handlePagination(currentPage - 1));
    } else {
      document
        .getElementById("prevPage")
        .addEventListener("click", () =>
          swal(
            "You Cannot Go Back",
            `You trying to access page which doest exists!`,
            "error"
          )
        );
    }

    if (hasNextPage) {
      document
        .getElementById("nextPage")
        .addEventListener("click", () => handlePagination(currentPage + 1));
    } else {
      document
        .getElementById("nextPage")
        .addEventListener("click", () =>
          swal(
            "You Cannot Go Next",
            `You trying to access page which doest exists!`,
            "error"
          )
        );
    }
  }
}

async function handlePagination(targetPage) {
  targetPage = Math.max(1, parseInt(targetPage, 10));
  if (totalPages) targetPage = Math.min(totalPages, targetPage);
  if (targetPage !== currentPage && !isFetching) {
    isFetching = true;
    const data = await fetchPageData(targetPage);
    if (data) {
      currentPage = targetPage;
      await addchild(data);
      addPaginationControls();
    }
    isFetching = false;
  }
}

async function init(paginationInput, catagorieInput, hasNextPageInput) {
  pagination = paginationInput;
  catagorie = catagorieInput;
  ApiCall =
    catagorie === "Latest Updated" ? "/api/manga/latest" : "/api/findmanga";
  hasNextPage = hasNextPageInput;

  if (pagination === "on") {
    document.body.innerHTML += '<div id="pagination-controls"></div>';
  }

  if (pagination === "on" && hasNextPage) {
    addPaginationControls();
  } else {
    window.addEventListener("scroll", handleScroll);
  }
}
