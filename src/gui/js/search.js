document
  .querySelector("form")
  .addEventListener("submit", function search(event) {
    event.preventDefault();
    const searchInput = document.getElementById("searchInput").value.trim();
    if (!searchInput) {
      return swal(
        "Invalid Search",
        `Please enter some text to search`,
        "error"
      );
    }
    redirectToSearch(searchInput);
  });

function redirectToSearch(query) {
  const encodedQuery = encodeURIComponent(query);
  window.location.href = `/search?animetosearch=${encodedQuery}`;
}
