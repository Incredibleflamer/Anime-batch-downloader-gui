// form
document.addEventListener("DOMContentLoaded", function () {
  const downloadFormButtons = document.querySelectorAll(
    ".download-form-button"
  );

  downloadFormButtons.forEach((downloadFormButton) => {
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
});

// download buttons
function createDownloadButton(type, episodes, id) {
  const togglecontainer = document.getElementById("toggle-container");

  const specificEpisodesBtn = document.createElement("button");
  specificEpisodesBtn.classList.add(
    "btn",
    "btn-outline-info",
    `${type}Options`,
    "download-form-button"
  );

  specificEpisodesBtn.textContent = `Download From Specific Episodes (${type.toUpperCase()})`;
  specificEpisodesBtn.setAttribute(
    "data-ep",
    JSON.stringify(id.replace("-both", `-${type}`))
  );
  specificEpisodesBtn.setAttribute("data-total-episodes", episodes);
  if (type === "dub") {
    specificEpisodesBtn.style.display = "none";
  }
  togglecontainer.appendChild(specificEpisodesBtn);

  const downloadAllBtn = document.createElement("button");
  downloadAllBtn.classList.add("btn", "btn-outline-info", `${type}Options`);
  if (type === "dub") {
    downloadAllBtn.style.display = "none";
  }
  downloadAllBtn.type = "button";
  downloadAllBtn.textContent = `Download All Episodes (${type.toUpperCase()})`;
  downloadAllBtn.setAttribute(
    "onclick",
    `download('${id.replace("-both", `-${type}`)}', 1, ${episodes})`
  );
  togglecontainer.appendChild(downloadAllBtn);

  const container = document.getElementById(`${type}Options`);
  const episodeWrapper = document.createElement("div");
  episodeWrapper.classList.add("wrapper");
  const episodeContainer = document.createElement("div");
  episodeContainer.classList.add("episode-container");

  for (let i = episodes - 1; i >= 0; i--) {
    const episodeBtn = document.createElement("button");
    episodeBtn.classList.add("episode");
    episodeBtn.type = "button";
    episodeBtn.textContent = `Download Episode ${
      i + 1
    } (${type.toUpperCase()})`;
    episodeBtn.setAttribute(
      "onclick",
      `download('${id.replace("-both", `-${type}`)}', ${i + 1})`
    );
    episodeContainer.appendChild(episodeBtn);
  }

  episodeWrapper.appendChild(episodeContainer);
  container.appendChild(episodeWrapper);
}

function createDownloadButton_with_episodes_array(episodes, id) {
  try {
    const { subs, dubs } = episodes.reduce(
      (acc, item) => {
        if (item.lang === "both") {
          acc.dubs.push(item);
          acc.subs.push(item);
        } else if (item.lang === "sub") {
          acc.subs.push(item);
        } else if (item.lang === "dub") {
          acc.dubs.push(item);
        }
        return acc;
      },
      { subs: [], dubs: [] }
    );

    const toggleContainer = document.getElementById("toggle-container");
    if (!toggleContainer) return;

    const fragment = document.createDocumentFragment();

    fragment.appendChild(
      createButton("Download From Specific Episodes (SUB)", "subOptions", {
        "data-ep": id.replace("-both", "-sub"),
        "data-total-episodes": subs.length,
      })
    );

    fragment.appendChild(
      createButton("Download All Episodes (SUB)", "subOptions", {
        onclick: `download('${id.replace("-both", "-sub")}', 1, ${
          subs.length
        })`,
      })
    );

    fragment.appendChild(
      createButton("Download From Specific Episodes (DUB)", "dubOptions", {
        "data-ep": id.replace("-both", "-dub"),
        "data-total-episodes": dubs.length,
        style: "display: none",
      })
    );

    fragment.appendChild(
      createButton("Download All Episodes (DUB)", "dubOptions", {
        onclick: `download('${id.replace("-both", "-dub")}', 1, ${
          dubs.length
        })`,
        style: "display: none",
      })
    );

    toggleContainer.appendChild(fragment);

    createEpisodeButtons("subOptions", subs, "sub", id);
    createEpisodeButtons("dubOptions", dubs, "dub", id);
  } catch (err) {
    console.error("Error in createDownloadButton_with_episodes_array:", err);
  }
}

function createButton(text, className, attributes = {}) {
  const btn = document.createElement("button");
  btn.classList.add(
    "btn",
    "btn-outline-info",
    "download-form-button",
    className
  );
  btn.textContent = text;
  Object.entries(attributes).forEach(([key, value]) =>
    btn.setAttribute(key, value)
  );
  return btn;
}

function createEpisodeButtons(containerId, episodes, type, id) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const fragment = document.createDocumentFragment();
  const wrapper = document.createElement("div");
  wrapper.classList.add("wrapper");

  const episodeContainer = document.createElement("div");
  episodeContainer.classList.add("episode-container");

  episodes.forEach(({ number }) => {
    const episodeBtn = document.createElement("button");
    episodeBtn.classList.add("episode");
    episodeBtn.type = "button";
    episodeBtn.textContent = `Download Episode ${number} (${type.toUpperCase()})`;
    episodeBtn.onclick = () =>
      download(id.replace("-both", `-${type}`), number);

    episodeContainer.appendChild(episodeBtn);
  });

  wrapper.appendChild(episodeContainer);
  fragment.appendChild(wrapper);
  container.appendChild(fragment);
}

// Downloads : Tongle Sub / Dub
function toggleDownloadOptions() {
  const dubOptions = document.getElementsByClassName("dubOptions");
  const subOptions = document.getElementsByClassName("subOptions");
  const button = document.getElementById("toggleDownloadOptions");

  if (subOptions[0].style.display === "none") {
    for (let i = 0; i < subOptions.length; i++) {
      subOptions[i].style.display = "block";
    }
    for (let i = 0; i < dubOptions.length; i++) {
      dubOptions[i].style.display = "none";
    }
    button.textContent = "Show Dub 🎥";
  } else {
    for (let i = 0; i < subOptions.length; i++) {
      subOptions[i].style.display = "none";
    }
    for (let i = 0; i < dubOptions.length; i++) {
      dubOptions[i].style.display = "block";
    }
    button.textContent = "Show Sub 🎭";
  }
}

// Tongle Watch / Download
function tongledownloadwatch() {
  const downloadContainer = document.getElementById("downloadContainer");
  const watchContainer = document.getElementById("watchContainer");
  const watchDownloadToggleButton = document.getElementById(
    "watch-download-tongle"
  );

  if (downloadContainer.style.display === "none") {
    downloadContainer.style.display = "block";
    watchContainer.style.display = "none";
    document.body.style.overflowY = "hidden";
    watchDownloadToggleButton.textContent = "Watch";
  } else {
    downloadContainer.style.display = "none";
    watchContainer.style.display = "block";
    document.body.style.overflowY = "auto";
    document.body.style.paddingBottom = "1rem";
    watchDownloadToggleButton.textContent = "Download";
  }
}
