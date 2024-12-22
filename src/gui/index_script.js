document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");

  searchButton.addEventListener("click", function () {
    removeError();
    const animeName = searchInput.value.trim();
    if (animeName !== "") {
      showLoadingAnimation();
      const apiUrl = `http://localhost:6969/api/search?animetosearch=${encodeURIComponent(
        animeName
      )}`;

      fetch(apiUrl)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch anime data");
          }
          return response.json();
        })
        .then((data) => {
          hideLoadingAnimation();
        })
        .catch((err) => {
          hideLoadingAnimation();
          showError(
            "An error occurred while fetching data. Please try again later."
          );
          console.log("Error:", err);
        });
    } else {
      showError("Please enter an anime name");
    }
  });

  // Show loader
  function showLoadingAnimation() {
    const loadingElement = document.getElementById("loading");
    loadingElement.removeAttribute("hidden");
  }

  // Hide loader
  function hideLoadingAnimation() {
    const loadingElement = document.getElementById("loading");
    if (loadingElement) {
      loadingElement.setAttribute("hidden", true);
    }
  }
});
