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
