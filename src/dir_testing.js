const fs = require("fs");
const path = require("path");

async function getAllMetadata(baseDir) {
  try {
    const types = ["Anime", "Manga"];
    let allMetadata = [];

    for (const type of types) {
      const typeDir = path.join(baseDir, type);
      try {
        const directories = await fs.promises.readdir(typeDir, {
          withFileTypes: true,
        });

        const folders = directories
          .filter((dir) => dir.isDirectory())
          .map((dir) => dir.name);

        const metadataPromises = folders.map(async (folder) => {
          const metadataPath = path.join(typeDir, folder, "metadata.json");
          try {
            const data = await fs.promises.readFile(metadataPath, "utf-8");
            const { title, thumbnail } = JSON.parse(data);
            return { title, thumbnail, type };
          } catch (err) {
            return null;
          }
        });

        const metadataList = await Promise.all(metadataPromises);
        allMetadata.push(...metadataList.filter(Boolean));
      } catch (err) {
        // ignore
      }
    }

    return allMetadata;
  } catch (err) {
    console.error("Error reading metadata:", err);
    return [];
  }
}

// getAllMetadata("C:/Users/ADMIN/Downloads").then((data) => console.log(data));
