let pagination = "";
let catagorie = "";
let local = true;
let currentPage = 1;
let isFetching = false;
let totalPages = false;
let allDataFetched = false;
let hasNextPage = false;

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
    const response = await fetch(`/api/discover/Manga`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        page: page,
        local: local,
        ...(catagorie.startsWith("Results For") ? { title: catagorie } : {}),
      }),
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
          <a href="/mangainfo?${
            catagorie === "Local Manga Library" ? "localmangaid" : "mangaid"
          }=${result.id}">
            <div class="anime-item">
              <img 
              src="./images/loading-image.png"
              data-src="${result.image}" alt="${
        result.title
      }" onerror="this.onerror=null; this.src='./images/image-404.png';" class="thumbnail lazy-image" />
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
  local = catagorie === "Local Manga Library" ? true : false;
  hasNextPage = hasNextPageInput;

  if (pagination === "on" && hasNextPage) {
    document.body.innerHTML += '<div id="pagination-controls"></div>';
    addPaginationControls();
  } else {
    window.addEventListener("scroll", handleScroll);
  }
}
