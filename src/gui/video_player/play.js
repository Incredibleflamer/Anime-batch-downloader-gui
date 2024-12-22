var player = videojs("vid1", {
  controlBar: {
    children: [
      "playToggle",
      "progressControl",
      "volumePanel",
      "PlaybackRateMenuButton",
      "qualitySelector",
      "fullscreenToggle",
    ],
  },
});

async function Videoplay(id, ep) {
  player.pause();
  const response = await fetch("/api/watch", {
    method: "POST",
    body: JSON.stringify({ ep: id, epNum: ep }),
    headers: {
      "Content-type": "application/json; charset=UTF-8",
    },
  });

  const data = await response.json();
  const sourcesArray = data.sourcesArray;

  let title = document.getElementById("now_playing");
  title.textContent = `Now Playing EP ${ep}`;
  title.removeAttribute("hidden");

  player.src(
    sourcesArray.map((source) => ({
      src: source.url,
      type: "application/x-mpegURL",
      label: source.quality,
    }))
  );

  player.playbackRates([0.7, 1.0, 1.5, 2.0, 3.0, 4.0]);

  player.play();
}

function goBack() {
  window.history.back();
}
