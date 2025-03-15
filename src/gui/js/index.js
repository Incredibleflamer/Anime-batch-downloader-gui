let pagination = "off";
let currentPage = 1;
let isFetching = false;
let totalPages = null;
let allDataFetched = false;
let hasNextPage = true;
let api = null;
let infoapi = null;

async function fetchPageData(page) {
  try {
    if (isFetching || (page > 1 && !hasNextPage) || allDataFetched) return;
    isFetching = true;

    const response = await fetch(`${api}/${page}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch data");
    }

    const data = await response.json();

    if (page === 1 && data?.hasNextPage) {
      if (pagination === "on") {
        document.body.innerHTML += '<div id="pagination-controls"></div>';
        addPaginationControls();
      } else {
        window.addEventListener("scroll", handleScroll);
      }
    } else {
      hasNextPage = false;
    }

    if (data?.hasNextPage) {
      hasNextPage = true;
    } else if (!data?.hasNextPage || data?.hasNextPage === false) {
      hasNextPage = false;
    }

    currentPage = page;

    if (data && data.results && data.results.length > 0) {
      await addchild(data);
    } else {
      allDataFetched = true;
    }

    isFetching = false;
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
          <a href="${infoapi}${encodeURIComponent(result.id)}">
            <div class="anime-item">
              <img 
                src="./images/loading-image.png"
                data-src="${result.image}" 
                alt="${result.title}" 
                onerror="this.onerror=null; this.src='./images/image-404.png';"
                class="thumbnail lazy-image" />
              ${
                result?.totalEpisodes && result?.DownloadedEpisodes
                  ? `<div class="episodes"><div class="downloaded"><div class="material-symbols-rounded">download_done</div> ${result?.DownloadedEpisodes?.length}</div><div class="total"><div class="material-symbols-rounded">download</div> ${result?.totalEpisodes}</div></div>`
                  : result?.totalEpisodes && result?.watched
                  ? `<div class="episodes"><div class="downloaded"><div class="material-symbols-rounded">visibility</div>${result.watched}</div><div class="total"><div class="material-symbols-rounded">movie</div>${result.totalEpisodes}</div></div>`
                  : ""
              } 
              <div class="overlay">${result.title}</div>
            </div>
          </a>
        `;
      animeGrid.appendChild(animeCard);
    });

    const lazyImages = document.querySelectorAll(".lazy-image");
    lazyImages.forEach((img) => {
      const tempImage = new Image();
      tempImage.src = img.getAttribute("data-src");

      tempImage.onload = function () {
        img.src = tempImage.src;
      };

      tempImage.onerror = function () {
        img.src = "./images/image404.png";
      };
    });
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
      document.getElementById("prevPage").addEventListener("click", () =>
        Swal.fire({
          icon: "error",
          title: "Page Not Found",
          text: ":P Page you looking for doesn't exists ( like my gf )",
        })
      );
    }

    if (hasNextPage) {
      document
        .getElementById("nextPage")
        .addEventListener("click", () => handlePagination(currentPage + 1));
    } else {
      document.getElementById("nextPage").addEventListener("click", () =>
        Swal.fire({
          icon: "error",
          title: "Page Not Found",
          text: ":P Page you looking for doesn't exists ( like my gf )",
        })
      );
    }
  }
}

async function handlePagination(targetPage) {
  targetPage = Math.max(1, parseInt(targetPage, 10));
  if (totalPages) targetPage = Math.min(totalPages, targetPage);
  if (targetPage !== currentPage) {
    await fetchPageData(targetPage);
  }
}

function isScrolledToBottom() {
  return window.innerHeight + window.scrollY >= document.body.offsetHeight;
}

async function handleScroll() {
  if (!isFetching && isScrolledToBottom()) {
    await fetchPageData(currentPage + 1);
  }
}

async function init(paginationInput, apiInput, infoapiInput) {
  pagination = paginationInput;
  api = apiInput;
  infoapi = infoapiInput;
  await fetchPageData(1);
  document.getElementById("loading-container").hidden = true;
}
