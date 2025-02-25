var player = null;
let SelectedSource = "sub";
let Isboth = false;
let subtitles = [];
let skipIntroTime = null;

async function Videoplay(id, EpisodeNumber, Downloaded = false) {
  try {
    ep = parseInt(EpisodeNumber, 10);
    if (player) {
      player.pause();
    }

    const response = await fetch("/api/watch", {
      method: "POST",
      body: JSON.stringify({
        ep: `${Downloaded ? id : `${id.replace(/-(dub|sub|both)$/, "")}-both`}`,
        epNum: ep,
        Downloaded: Downloaded,
      }),
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
    });

    const data = await response.json();

    let sources = {
      sub: data?.sub || [],
      dub: data?.dub || [],
      sources: data?.sources || [],
    };

    window.videoSources = sources;
    subtitles = data?.subtitles ?? data?.sub?.subtitles ?? [];
    skipIntroTime = data?.intro ?? data.sub?.intro ?? null;

    Isboth =
      sources?.sub?.sources?.length > 0 && sources?.dub?.sources?.length > 0;

    SelectedSource = Isboth
      ? "sub"
      : sources?.sub?.sources?.length > 0
      ? "sub"
      : sources?.dub?.source?.length > 0
      ? "dub"
      : "sub";

    updateVideoSource();
    updateSubDubButton();
    addSubtitleTracks();
    addSkipIntroButton();
  } catch (err) {
    console.error("Error loading video:", err);
  }
}

function updateVideoSource() {
  try {
    let sources = window.videoSources;
    let selectedSources =
      SelectedSource === "dub" && sources?.dub?.sources?.length > 0
        ? { sources: sources?.dub?.sources }
        : sources?.sub?.sources?.length > 0
        ? { sources: sources?.sub?.sources }
        : { sources: sources?.sources };

    if (!selectedSources?.sources?.length) {
      console.warn(`No ${SelectedSource} sources available.`);
      return;
    }

    let title = document.getElementById("now_playing");
    title.textContent = `Now Playing EP ${ep} (${SelectedSource.toUpperCase()})`;
    title.removeAttribute("hidden");

    if (!player) {
      initPlayer();
    }

    player.src(
      selectedSources?.sources
        ?.filter((source) => source?.quality && source.quality !== "default")
        ?.map((source) => {
          if (source?.url.endsWith(".m3u8")) {
            return {
              src: `/proxy?url=${encodeURIComponent(source?.url)}`,
              type: "application/x-mpegURL",
              label: source?.quality,
            };
          } else {
            return {
              src: source?.url,
              type: "video/mp4",
              label: source?.quality,
            };
          }
        })
    );

    player.playbackRates([0.7, 1.0, 1.5, 2.0, 3.0, 4.0]);
    player.play();
  } catch (err) {
    console.error("Error updating video source:", err);
  }
}

function initPlayer() {
  player = videojs("vid1", {
    controlBar: {
      children: [
        "playToggle",
        "progressControl",
        "volumePanel",
        "PlaybackRateMenuButton",
        "qualitySelector",
        "captionsButton",
        "fullscreenToggle",
      ],
      skipButtons: { forward: 5, backward: 5 },
      enableDocumentPictureInPicture: true,
      enableSmoothSeeking: true,
    },
    userActions: {
      hotkeys: function (event) {
        handleHotkeys(event);
      },
    },
  });

  document.addEventListener("keydown", function (event) {
    if (event.code === "Space") {
      event.preventDefault();
      player.paused() ? player.play() : player.pause();
    }
  });

  player.ready(function () {
    player.el().setAttribute("tabindex", "0");
    player.el().addEventListener("keydown", function (event) {
      handleHotkeys(event);
    });
  });
}

function handleHotkeys(event) {
  if (event.which === 32) {
    event.preventDefault();
    player.paused() ? player.play() : player.pause();
  }
  if (event.which === 37) {
    event.preventDefault();
    player.currentTime(player.currentTime() - 5);
  }
  if (event.which === 39) {
    event.preventDefault();
    player.currentTime(player.currentTime() + 5);
  }
}

function toggleSubDub() {
  SelectedSource = SelectedSource === "sub" ? "dub" : "sub";
  updateVideoSource();
  updateSubDubButton();
}

function updateSubDubButton() {
  let subDubButton = document.getElementById("subDubToggle");

  if (Isboth) {
    if (!subDubButton) {
      let controlBar = document.querySelector(".vjs-control-bar");
      subDubButton = document.createElement("button");
      subDubButton.id = "subDubToggle";
      subDubButton.classList.add("vjs-button");
      subDubButton.style.marginLeft = "10px";
      subDubButton.onclick = toggleSubDub;
      controlBar.appendChild(subDubButton);
    }
    subDubButton.textContent = `Switch to ${
      SelectedSource === "sub" ? "Dub" : "Sub"
    }`;
  } else if (subDubButton) {
    subDubButton.remove();
  }
}

function addSubtitleTracks() {
  if (!player) return;

  while (player.remoteTextTracks().length > 0) {
    player.removeRemoteTextTrack(player.remoteTextTracks()[0]);
  }

  if (!subtitles || subtitles.length === 0) {
    console.warn("No subtitles available.");
    return;
  }

  let langCount = {};
  let defaultSelectedTrack = null;

  subtitles.forEach((subtitle) => {
    let lang = subtitle.lang.trim().split("-")[0];

    if (langCount[lang]) {
      langCount[lang]++;
      lang += ` ${langCount[lang]}`;
    } else {
      langCount[lang] = 1;
    }

    let track = player.addRemoteTextTrack(
      {
        kind: "subtitles",
        src: subtitle.url,
        srclang: lang,
        label: lang.toUpperCase(),
        default: false,
      },
      false
    );

    if (!defaultSelectedTrack && lang.toLowerCase().includes("english")) {
      defaultSelectedTrack = track;
    }
  });

  player.on("loadedmetadata", function () {
    let tracks = player.textTracks();
    if (tracks.length > 0) {
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].mode = "disabled";
      }
      if (defaultSelectedTrack) {
        defaultSelectedTrack.track.mode = "showing";
      } else {
        tracks[0].mode = "showing";
      }
    }
  });

  player.controlBar.addChild("SubsCapsButton");
}

function addSkipIntroButton() {
  if (!skipIntroTime || !skipIntroTime.start || !skipIntroTime.end || !player)
    return;

  let controlBar = document.querySelector(".vjs-control-bar");
  let skipButton = document.getElementById("skipIntroButton");

  if (!skipButton) {
    skipButton = document.createElement("button");
    skipButton.id = "skipIntroButton";
    skipButton.classList.add("vjs-button");
    skipButton.textContent = "Skip Intro";
    skipButton.style.marginLeft = "10px";
    skipButton.onclick = () => {
      player.currentTime(skipIntroTime.end);
      skipButton.remove(); // Remove button after skipping
    };
    controlBar.appendChild(skipButton);
  }

  // Check the current time every second and toggle button visibility
  player.on("timeupdate", function () {
    let currentTime = player.currentTime();
    if (
      currentTime >= skipIntroTime.start &&
      currentTime <= skipIntroTime.end
    ) {
      skipButton.style.display = "block"; // Show button
    } else {
      skipButton.style.display = "none"; // Hide button
    }
  });
}
