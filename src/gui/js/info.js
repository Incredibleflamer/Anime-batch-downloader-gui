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
    `${type}Options`
  );
  if (type === "dub") {
    specificEpisodesBtn.style.display = "none";
  }
  specificEpisodesBtn.textContent = `Download From Specific Episodes (${type.toUpperCase()})`;
  specificEpisodesBtn.setAttribute(
    "data-ep",
    JSON.stringify(id.replace("-both", `-${type}`))
  );
  specificEpisodesBtn.setAttribute("data-total-episodes", episodes);
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

// setting click
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
