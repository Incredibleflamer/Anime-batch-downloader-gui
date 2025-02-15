document.addEventListener("DOMContentLoaded", function () {
  var bar = new ldBar(".myBar", {
    max: 100,
    preset: "rainbow",
    value: 0,
  });

  var barvar = document.getElementById("myBar");
  barvar.style.display = "none";
  function fetchProgressAndUpdateProgressBar() {
    fetch("/api/download/progress")
      .then((response) => response.json())
      .then((data) => {
        var captionElement = document.getElementById("caption");
        captionElement.innerHTML = data?.caption || "Nothing to Download";

        var ratio =
          data.currentSegments && data.totalSegments
            ? Math.floor((data.currentSegments / data.totalSegments) * 100)
            : 0;

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

        if (!queueItemsContainer) {
          queueItemsContainer = document.createElement("div");
          queueItemsContainer.id = "queue-items";
          queueContainer.appendChild(queueItemsContainer);
        }

        queueItemsContainer.innerHTML = "";

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
        }
      })
      .catch((err) => {
        console.log("Error fetching progress:", err);
      });
  }

  fetchProgressAndUpdateProgressBar();
  setInterval(fetchProgressAndUpdateProgressBar, 1000);
});

function removeAllFromQueue() {
  fetch("/api/download/remove/all", {
    method: "GET",
  })
    .then((response) => response.json())
    .then((data) => {
      swal(`Removed Everything From Queue!`, "success");
    })
    .catch((err) => {
      swal("Something Went Wrong..", "error");
    });
}

function removeFromQueue(Title, startep, epdownload) {
  fetch(`/api/download/remove/?AnimeEpId=${epdownload}`, {
    method: "GET",
  })
    .then((response) => response.json())
    .then((data) => {
      swal(`Removed: ${Title} || ${startep} From Queue!`, "success");
    })
    .catch((err) => {
      swal("Something Went Wrong..", "error");
    });
}
