let ep = null;
var player = null;
let SelectedSource = "sub";
let Isboth = false;
let subtitles = [];
let skipIntroTime = null;
let markedWatched = false;

async function Videoplay(
  id,
  EpisodeNumber,
  Downloaded = false,
  watched = false
) {
  try {
    ep = parseInt(EpisodeNumber, 10) ?? 0;
    if (player) {
      player.pause();
    }

    const response = await fetch("/api/watch", {
      method: "POST",
      body: JSON.stringify({
        ep: `${Downloaded ? id : `${id.replace(/-(dub|sub|both)$/, "")}-both`}`,
        epNum: ep,
        Downloaded: Downloaded,
        ...(window.LocalAnimeManga
          ? {
              provider: window.LocalAnimeManga,
            }
          : {}),
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
    markedWatched = watched;

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
    DiscordRPC("Watching", `Ep ${ep}`);
    AutoTracking();
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
          if (source?.url?.url) {
            return {
              src: `/proxy?hianime=${encodeURIComponent(source?.url?.url)}`,
              type: "application/x-mpegURL",
              label: source?.quality,
            };
          }
          if (source?.url?.endsWith(".m3u8")) {
            return {
              src: source?.url,
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
      fluid: true,
      responsive: true,
    },
    userActions: {
      hotkeys: function (event) {
        handleHotkeys(event);
      },
    },
  });

  document.addEventListener("keydown", function (event) {
    if (!player) return;

    const active = document.activeElement;
    if (
      active &&
      (active.tagName === "INPUT" ||
        active.tagName === "TEXTAREA" ||
        active.isContentEditable)
    ) {
      return;
    }

    handleHotkeys(event);
  });
}

function handleHotkeys(event) {
  switch (event.code) {
    case "Space":
      event.preventDefault();
      player.paused() ? player.play() : player.pause();
      break;
    case "ArrowLeft":
      event.preventDefault();
      player.currentTime(player.currentTime() - 5);
      break;
    case "ArrowRight":
      event.preventDefault();
      player.currentTime(player.currentTime() + 5);
      break;
    case "ArrowUp":
      event.preventDefault();
      player.volume(Math.min(player.volume() + 0.1, 1));
      break;
    case "ArrowDown":
      event.preventDefault();
      player.volume(Math.max(player.volume() - 0.1, 0));
      break;
    case "KeyF":
      event.preventDefault();
      if (player.isFullscreen()) {
        player.exitFullscreen();
      } else {
        player.requestFullscreen();
      }
      break;
    case "KeyM":
      event.preventDefault();
      player.muted(!player.muted());
      break;
    case "KeyS":
      event.preventDefault();
      if (
        skipIntroTime &&
        skipIntroTime.start &&
        skipIntroTime.end &&
        player.currentTime() >= skipIntroTime.start &&
        player.currentTime() <= skipIntroTime.end
      ) {
        player.currentTime(skipIntroTime.end);
        skipButton.el().style.display = "none";
      }
      break;
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

  if (!player.controlBar.getChild("SubsCapsButton")) {
    player.controlBar.addChild("SubsCapsButton");
  }
}

function addSkipIntroButton() {
  if (!skipIntroTime || !skipIntroTime.start || !skipIntroTime.end || !player)
    return;

  videojs.registerComponent(
    "CustomButton",
    videojs.extend(videojs.getComponent("Button"), {
      constructor: function (player, options) {
        videojs.getComponent("Button").call(this, player, options);
        this.controlText("Skip Intro");
        this.el().innerHTML = "Skip Intro ( S Key )";
      },
      handleClick: function () {
        player.currentTime(skipIntroTime.end);
        this.hide();
      },
    })
  );

  const skipButton = player.addChild("CustomButton", {});
  skipButton.addClass("vjs-custom-control");
  player.el().appendChild(skipButton.el());

  Object.assign(skipButton.el().style, {
    position: "absolute",
    top: "1rem",
    right: "1rem",
    zIndex: "999",
    padding: "6px 12px",
    backgroundColor: "rgba(128,128,128,0.9)",
    borderRadius: "20px",
    color: "white",
    fontSize: "14px",
    cursor: "pointer",
    display: "inline-block",
    whiteSpace: "nowrap",
    lineHeight: "normal",
    height: "auto",
    width: "auto",
    display: "none",
  });

  player.on("timeupdate", function () {
    const currentTime = player.currentTime();
    if (
      currentTime >= skipIntroTime.start &&
      currentTime <= skipIntroTime.end
    ) {
      skipButton.el().style.display = "inline-block";
    } else {
      skipButton.el().style.display = "none";
    }
  });
}

function AutoTracking() {
  if (markedWatched || !player) return;

  player.on("timeupdate", function () {
    const duration = player.duration();
    const currentTime = player.currentTime();

    if (!markedWatched && currentTime >= duration * 0.9) {
      markedWatched = true;
      let status = document.getElementById("mal-status").value ?? "watching";
      MyAnimeListUpdate(status, ep);
    }
  });
}
