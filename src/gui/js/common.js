function goBack() {
  window.history.back();
}

async function download(ep, start, end) {
  try {
    const response = await fetch("/api/download", {
      method: "POST",
      body: JSON.stringify({
        ep: ep,
        start: start,
        end: end,
      }),
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
    });
    const responseData = await response.json();
    if (response.status === 400) {
      swal("Something Went Wrong..", `${responseData.message}`, "error");
    } else if (!response.ok) {
      swal(
        "Request Failed",
        `There are ${responseData.queue} Anime in Queue. 
          Error: ${responseData.message}`,
        "error"
      );
    } else {
      swal(
        `Added To Queue Current Queue Size : ${responseData.queue}!`,
        `[NOTE: if it skips episode that means that episode is not aviable yet! ]\n${responseData.message}`,
        "success"
      );
    }
  } catch (err) {
    console.log(err);
    swal("Couldnt add to queue...", `Error: ${err}`, "error");
  }
}
