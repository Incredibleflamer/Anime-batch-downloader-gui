var bar = new ldBar(".myBar", {
  max: 100,
  preset: "rainbow",
  value: 0,
});

var barvar = document.getElementById("myBar");
barvar.style.display = "none";

window.sharedStateAPI.on("download-logger", (data) => {
  UpdateBar(data);
});

UpdateBar();

async function UpdateBar(data = null) {
  try {
    if (!data) {
      let QueueData = await fetch("/downloads", {
        method: "POST",
      });
      data = await QueueData.json();
    }

    if (!bar) return;

    var captionElement = document.getElementById("caption");

    var ratio =
      data?.currentSegments && data?.totalSegments
        ? Math.floor((data.currentSegments / data.totalSegments) * 100)
        : 0;

    if (ratio >= 100 && (!data.queue || data.queue.length === 0)) {
      captionElement.innerHTML = "Nothing to Download";
    } else {
      captionElement.innerHTML = data?.caption || "Nothing to Download";
    }

    var barvar = document.getElementById("myBar");
    if (ratio < 100 && ratio > 0) {
      barvar.style.display = "block";
      bar.set(ratio);
    } else {
      bar.set(0);
      barvar.style.display = "none";
    }

    var queueContainer = document.getElementById("queue");
    var queueItemsContainer = document.getElementById("queue-items");

    let scrollTop = null;
    if (!queueItemsContainer) {
      queueItemsContainer = document.createElement("div");
      queueItemsContainer.id = "queue-items";
      queueContainer.appendChild(queueItemsContainer);
    } else {
      scrollTop = queueItemsContainer.scrollTop;
      queueItemsContainer.innerHTML = "";
    }

    if (data.queue && data.queue.length > 0) {
      queueContainer.innerHTML = `
      <div class="queue-header">
        <div class="queue-title">
          <div class="caption">In Queue</div>
        </div>
        <div class="queue-buttons">
          <button onclick="removeAllFromQueue()" class="btn btn-outline-danger">Remove All</button>
        </div>
      </div>`;

      queueContainer.appendChild(queueItemsContainer);

      data.queue.forEach((item) => {
        var queueItem = document.createElement("div");
        queueItem.classList.add("queue-item");
        queueItem.innerHTML = `
        <span>${item.Title} - ${item.EpNum}</span>
        <span class="remove-icon" onclick="removeFromQueue('${item.Title}', '${item.EpNum}', '${item.epid}')">🗑️</span>`;
        queueItemsContainer.appendChild(queueItem);
      });
    } else {
      queueContainer.innerHTML = "";
    }

    if (scrollTop) queueItemsContainer.scrollTop = scrollTop;
  } catch (err) {
    console.log(err);
  }
}

function removeAllFromQueue() {
  fetch("/api/download/remove", {
    method: "GET",
  })
    .then((response) => response.json())
    .then((data) => {
      Swal.fire({
        icon: "success",
        title: "Queue Updated!",
        text: "Removed Everything!",
      });
    })
    .catch((err) => {
      Swal.fire({
        icon: "error",
        title: "Failed To Update Queue",
        text: "Something Went Wrong...",
      });
    });
}

function removeFromQueue(Title, startep, epdownload) {
  fetch(`/api/download/remove?AnimeEpId=${epdownload}`, {
    method: "GET",
  })
    .then((response) => response.json())
    .then((data) => {
      Swal.fire({
        icon: "success",
        title: "Queue Updated!",
        text: `Removed ${Title} | ${startep}!`,
      });
    })
    .catch((err) => {
      Swal.fire({
        icon: "error",
        title: "Failed To Update Queue",
        text: "Something Went Wrong...",
      });
    });
}
