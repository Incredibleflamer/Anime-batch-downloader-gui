const { ipcRenderer } = require("electron");

ipcRenderer.on("mal", (event, data) => {
  let LoggedIn = data?.LoggedIn;
  document.getElementById("connectMal").hidden = LoggedIn;
  document.getElementById("myAnimeList-logout").hidden = !LoggedIn;
  document.getElementById("myAnimeList-config").hidden = !LoggedIn;
});

function showSection(targetId) {
  document.querySelectorAll(".settings-section").forEach((section) => {
    section.style.display = section.id === targetId ? "block" : "none";
  });
}

function showLoadingAnimation() {
  document.getElementById("overlay").style.display = "block";
}

function hideLoadingAnimation() {
  document.getElementById("overlay").style.display = "none";
}

function submitSettings(event) {
  event.preventDefault();
  const statusElement = document.getElementById("malstatus");
  const autotrackElement = document.getElementById("malautotrack");

  const data = {
    quality: document.getElementById("quality-select")?.value || null,
    Animeprovider: document.getElementById("anime-provider")?.value || null,
    Mangaprovider: document.getElementById("manga-provider")?.value || null,
    CustomDownloadLocation:
      document.getElementById("download-location")?.value || null,
    mergeSubtitles:
      document.getElementById("merge-subtitles-select")?.value || null,
    subDub: document.getElementById("subdub-option-select")?.value || null,
    Pagination: document.getElementById("pagination")?.value || null,
    subtitleFormat:
      document.getElementById("subtitle-format-select")?.value || null,
    autoLoadNextChapter:
      document.getElementById("auto-load-next-chapter-select")?.value || null,
    autotrack: autotrackElement ? autotrackElement.value : null,
    status: statusElement ? statusElement.value : null,
  };

  document.getElementById("save-settings").style.display = "none";

  showLoadingAnimation();

  fetch("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((responseData) => {
      hideLoadingAnimation();
      if (responseData.message) {
        swal("Updated Your User Config", responseData.message, "success");
      } else {
        swal("Something Is Missing", responseData.error, "error");
      }
    })
    .catch((error) => {
      hideLoadingAnimation();
      console.error("Error:", error);
      swal("Error", "Failed to update settings", "error");
    });
}

function handleProviderChange() {
  const selectedProvider = document.getElementById("anime-provider")?.value;
  const subDubOption = document.getElementById("subdub-option");
  const mergeSubtitles = document.getElementById("merge-subtitles");
  const mergeSubtitlesValue = document.getElementById(
    "merge-subtitles-select"
  )?.value;
  const SubtitlesFormat = document.getElementById("subtitle-format");

  subDubOption.style.display = selectedProvider === "pahe" ? "block" : "none";

  mergeSubtitles.style.display =
    selectedProvider === "hianime" ? "block" : "none";

  SubtitlesFormat.style.display =
    selectedProvider === "hianime" && mergeSubtitlesValue === "on"
      ? "block"
      : "none";
}

function redirectToUrl(url) {
  window.location.href = url;
}

function MalLogout() {
  fetch("./mal/logout");
}

function init(url, settings) {
  // Mal Connected Or Not
  let UrlPresent = url && url?.length > 0 ? true : false;
  document.getElementById("connectMal").hidden = !UrlPresent;
  document.getElementById("myAnimeList-logout").hidden = UrlPresent;
  document.getElementById("myAnimeList-config").hidden = UrlPresent;

  // Mal Status
  document.getElementById("malstatus").value =
    settings?.status ?? "plan_to_watch";

  // Mal Autotracking On / Off
  document.getElementById("malautotrack").value =
    settings?.malautotrack ?? "off";

  // Anime Provider
  document.getElementById("anime-provider").value =
    settings?.Animeprovider ?? "hianime";

  // Anime Quality
  document.getElementById("quality-select").value =
    settings?.quality ?? "1080p";

  // Anime Merge Subtitles
  document.getElementById("merge-subtitles-select").value =
    settings?.mergeSubtitles ?? "on";

  // Anime Subtitle Format
  document.getElementById("subtitle-format-select").value =
    settings?.subtitleFormat ?? "ttv";

  // Anime Sub / Dub
  document.getElementById("subdub-option-select").value =
    settings?.subDub ?? "sub";

  // Manga Provider
  document.getElementById("manga-provider").value =
    settings?.Mangaprovider ?? "weebcentral";

  // Manga AutoLoad Next Chapter
  document.getElementById("auto-load-next-chapter-select").value =
    settings?.autoLoadNextChapter ?? "on";

  // pagination
  document.getElementById("pagination").value = settings?.pagination ?? "on";

  document.querySelectorAll("input, select").forEach((input) => {
    input.addEventListener(
      "input",
      () => (document.getElementById("save-settings").style.display = "block")
    );
  });

  showSection("utils");
  handleProviderChange();
}
