const axios = require("axios");

async function getVideoUrls(url) {
  const quality = ["1080", "720", "360"];

  try {
    const response = await axios.get(url);
    const text = response.data;
    const lines = text.split("\n");

    const baseUrl = url.split("/").slice(0, -1).join("/");

    const videoUrls = [];

    lines.forEach((line, index) => {
      const qualityMatch = quality.find((q) => line.includes(q));
      if (qualityMatch && lines[index + 1]) {
        videoUrls.push({
          quality: qualityMatch,
          url: `${baseUrl}/${lines[index + 1]}`,
        });
      }
    });

    return videoUrls;
  } catch (error) {
    console.error("Error fetching the .m3u8 file:", error);
    return [];
  }
}

(async () => {
  const result = await getVideoUrls(
    "https://54d8e.project-quantum-42.biz/c3/h1e00e76d6043835b9cc206f446a7563984a4cd132f93c00300ffdfbf0d91895303c98e70c2d9014636b170eed451dae77dd9dab5507b1dea249d16e5cf68f083249697715c0768604e8a2a1eddff5b7dde5ae8e6fc461b835f82c96d476ab19ceb952bf2d8a6d3ba9d2abac743319919/list,5b49a52e32138f5289c309be43a64868d1bfd0166088c3.m3u8"
  );
  console.log(result);
})();
