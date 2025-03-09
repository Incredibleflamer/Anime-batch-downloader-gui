// libs
const { logger } = require("./AppLogger");
const {
  ddosGuardRequest,
  fetchEpisodesPages,
} = require("../Scrappers/animepahe");
const BetterSqlite3 = require("better-sqlite3");
const { app } = require("electron");
const axios = require("axios");
const path = require("path");
const fs = require("fs");

// Database creation [gets created in /user/your_name/AppData/Roaming]
const userDataPath = app.getPath("userData");
const db = new BetterSqlite3(path.join(userDataPath, "metadata.db"));

const tables = {
  Anime: {
    id: "TEXT PRIMARY KEY",
    folder_name: "TEXT",
    // Animeinfo
    title: "TEXT",
    subOrDub: "TEXT",
    type: "TEXT",
    provider: "TEXT",
    description: "TEXT",
    status: "TEXT",
    genres: "TEXT",
    aired: "TEXT",
    // EPISODES
    totalEpisodes: "INTEGER",
    last_page: "INTEGER",
    episodes: "TEXT",
    // IMAGE
    image: "BLOB",
    last_updated: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
  },
  Manga: {
    id: "TEXT PRIMARY KEY",
    // MANGA INFO
    title: "TEXT",
    folder_name: "TEXT",
    provider: "TEXT",
    description: "TEXT",
    genres: "TEXT",
    type: "TEXT",
    author: "TEXT",
    released: "TEXT",
    // CHAPTER INFO
    chapters: "TEXT",
    totalChapters: "INTEGER",
    image: "BLOB",
    last_updated: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
  },
  Mapping: {
    id: "INTEGER PRIMARY KEY AUTOINCREMENT",
    MalID: "TEXT",
    AnimeKai: "TEXT",
    HiAnime: "TEXT",
    AnimePahe: "TEXT",
  },
  last_ran_Mapping: {
    id: "INTEGER PRIMARY KEY AUTOINCREMENT",
    last_ran: "TEXT",
    last_fetched: "TEXT",
  },
};

// Create tables & update schema
Object.entries(tables).forEach(([tableName, columns]) => {
  const columnsString = Object.entries(columns)
    .map(([col, definition]) => `${col} ${definition}`)
    .join(", ");

  try {
    db.exec(`CREATE TABLE IF NOT EXISTS ${tableName} (${columnsString})`);
    updateTableSchema(tableName, columns);
  } catch (error) {
    throw new Error(`Error creating table ${tableName}: ${error.message}`);
  }
});

function updateTableSchema(tableName, expectedColumns) {
  try {
    const existingColumns = db
      .prepare(`PRAGMA table_info(${tableName})`)
      .all()
      .map((col) => col.name);

    Object.entries(expectedColumns).forEach(([col, definition]) => {
      if (!existingColumns.includes(col)) {
        db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${col} ${definition}`);
      }
    });
  } catch (error) {
    throw new Error(
      `Error updating table schema for ${tableName}: ${error.message}`
    );
  }
}

// Add metadata
async function MetadataAdd(type, valuesToAdd, Updating = false) {
  if (!tables[type] || !valuesToAdd?.id) {
    throw new Error(`Invalid args!`);
  }

  const existingRecord = db
    .prepare(`SELECT * FROM ${type} WHERE id = ?`)
    .get(valuesToAdd?.id);

  if (existingRecord && Updating) {
    try {
      updates = {};
      // Anime
      if (
        valuesToAdd.totalEpisodes !== undefined &&
        valuesToAdd.episodes !== existingRecord.episodes
      ) {
        updates.episodes = valuesToAdd.episodes;
      }

      if (
        valuesToAdd.totalEpisodes !== undefined &&
        existingRecord.totalEpisodes !== valuesToAdd.totalEpisodes
      ) {
        updates.totalEpisodes = valuesToAdd.totalEpisodes;
      }

      if (
        valuesToAdd.last_page !== undefined &&
        existingRecord.last_page !== valuesToAdd.last_page
      ) {
        updates.last_page = valuesToAdd.last_page;
      }

      if (
        valuesToAdd?.description !== undefined &&
        existingRecord.description !== valuesToAdd.description
      ) {
        updates.description = valuesToAdd.description;
      }

      if (
        valuesToAdd?.status !== undefined &&
        existingRecord.status !== valuesToAdd.status
      ) {
        updates.status = valuesToAdd.status;
      }

      if (
        valuesToAdd?.genres !== undefined &&
        existingRecord.genres !== valuesToAdd.genres
      ) {
        updates.genres = valuesToAdd.genres;
      }

      // Manga
      if (
        valuesToAdd?.chapters !== undefined &&
        existingRecord.chapters !== valuesToAdd.chapters
      ) {
        updates.chapters = valuesToAdd.chapters;
      }

      if (
        valuesToAdd?.totalChapters !== undefined &&
        existingRecord.totalChapters !== valuesToAdd.totalChapters
      ) {
        updates.totalChapters = valuesToAdd.totalChapters;
      }

      if (Object.keys(updates).length > 0) {
        const setClause =
          Object.keys(updates)
            .map((key) => `${key} = ?`)
            .join(", ") + ", last_updated = CURRENT_TIMESTAMP";

        const values = [...Object.values(updates), valuesToAdd.id];

        db.prepare(`UPDATE ${type} SET ${setClause} WHERE id = ?`).run(
          ...values
        );
      }
    } catch (err) {
      console.log(err);
    }
  } else if (!existingRecord) {
    if (valuesToAdd?.ImageUrl) {
      let data;

      if (valuesToAdd?.ImageUrl?.startsWith("/proxy/image?pahe=")) {
        valuesToAdd.ImageUrl = decodeURIComponent(
          valuesToAdd.ImageUrl.replace("/proxy/image?pahe=", "")
        );

        const response = await ddosGuardRequest(valuesToAdd.ImageUrl, {
          responseType: "arraybuffer",
        });
        data = response.data;
      } else {
        let Imageurl = valuesToAdd?.ImageUrl;
        if (Imageurl?.startsWith("/proxy/image?url=")) {
          Imageurl = decodeURIComponent(
            valuesToAdd.ImageUrl.replace("/proxy/image?url=", "")
          );
        }
        const response = await axios.get(Imageurl, {
          responseType: "arraybuffer",
        });
        data = response.data;
      }

      valuesToAdd.image = `data:image/png;base64,${Buffer.from(data).toString(
        "base64"
      )}`;
    }

    if (valuesToAdd?.title) {
      valuesToAdd.folder_name = valuesToAdd?.title?.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      );
    }

    try {
      const validColumns = Object.keys(tables[type]);
      const filteredValues = {};

      validColumns.forEach((column) => {
        if (valuesToAdd.hasOwnProperty(column)) {
          filteredValues[column] = valuesToAdd[column];
        } else {
          const columnType = tables[type][column];
          if (columnType.includes("TEXT")) {
            filteredValues[column] = "";
          } else if (columnType.includes("INTEGER")) {
            filteredValues[column] = 0;
          } else if (columnType.includes("BLOB")) {
            filteredValues[column] = null;
          }
        }
      });

      const fields = Object.keys(filteredValues).join(", ") + ", last_updated";
      const placeholders =
        Object.keys(filteredValues)
          .map(() => "?")
          .join(", ") + ", CURRENT_TIMESTAMP";
      const values = Object.values(filteredValues);

      db.prepare(
        `INSERT INTO ${type} (${fields}) VALUES (${placeholders})`
      ).run(...values);
    } catch (error) {
      throw new Error(`Error inserting into ${type}: ${error.message}`);
    }

    // Fetching all episodes from AnimePahe
    try {
      if (
        valuesToAdd?.provider === "pahe" &&
        valuesToAdd?.last_page &&
        valuesToAdd?.last_page > 1 &&
        Updating
      ) {
        FetchAllEpisodesAnimepaheAndSave(
          valuesToAdd?.id,
          valuesToAdd?.last_page
        );
      }
    } catch (err) {
      console.log(err);
    }
  }
}

// Remove metadata
function MetadataRemove(type, id) {
  if (!tables[type]) {
    throw new Error(`Invalid table: ${type}`);
  }

  try {
    db.exec(`DELETE FROM ${type} WHERE id = '${id}'`);
  } catch (error) {
    throw new Error(`Error deleting from ${type}: ${error.message}`);
  }
}

// Get All Metadata
async function getAllMetadata(type, baseDir, page = 1) {
  if (!tables[type]) {
    throw new Error(`Invalid table: ${type}`);
  }

  try {
    const typeDir = path.join(baseDir, type);
    let folders = [];

    const directories = await fs.promises.readdir(typeDir, {
      withFileTypes: true,
    });

    folders = directories
      .filter((dir) => dir.isDirectory())
      .map((dir) => dir.name);

    const storedMetadata = db
      .prepare(`SELECT * FROM ${type} ORDER BY last_updated DESC`)
      .all();

    const missingFolders = storedMetadata
      .filter((entry) => !folders.includes(entry.folder_name))
      .map((entry) => entry.folder_name);

    missingFolders.forEach((folder) => {
      db.exec(`DELETE FROM ${type} WHERE folder_name = '${folder}'`);
    });

    // Pagination logic
    const limit = 15;
    const totalItems = storedMetadata.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const paginatedMetadata = storedMetadata.slice(
      startIndex,
      startIndex + limit
    );
    const hasNextPage = page < totalPages;

    const updatedMetadata = [];

    for (const metadata of paginatedMetadata) {
      const folderPath = path.join(baseDir, type, metadata.folder_name);

      if (!fs.existsSync(folderPath)) {
        db.exec(`DELETE FROM ${type} WHERE id = '${metadata.id}'`);
        continue;
      }

      let content = [];
      const filesAndFolders = await fs.promises.readdir(folderPath, {
        withFileTypes: true,
      });

      if (type === "Anime") {
        content = filesAndFolders
          .filter(
            (file) =>
              file.isFile() &&
              file.name.endsWith(".mp4") &&
              file.name.toLowerCase().includes("ep")
          )
          .map((file) => parseInt(file?.name?.toLowerCase()?.split("ep")?.[0]))
          .filter(Boolean)
          .sort((a, b) => a - b);
      } else if (type === "Manga") {
        console.log("testing");
        content = filesAndFolders
          .filter(
            (file) =>
              file.isFile() &&
              file.name.endsWith(".cbz") &&
              file.name.toLowerCase().includes("chapter")
          )
          .map((file) =>
            parseInt(
              file?.name?.toLowerCase()?.split("chapter")?.[1]?.split(".cbz")[0]
            )
          )
          .filter(Boolean)
          .sort((a, b) => a - b);
      }

      updatedMetadata.push({
        ...metadata,
        Downloaded: content,
      });
    }

    return {
      totalPages,
      currentPage: page,
      hasNextPage,
      results: updatedMetadata,
    };
  } catch (err) {
    throw new Error(`Error fetching metadata: ${err.message}`);
  }
}

// Get Metadata By id
async function getMetadataById(type, baseDir, id) {
  if (!tables[type]) {
    throw new Error(`Invalid table: ${type}`);
  }

  try {
    const metadata = db.prepare(`SELECT * FROM ${type} WHERE id = ?`).get(id);
    if (!metadata) {
      throw new Error(`No metadata found for ID: ${id}`);
    }

    if (metadata?.last_updated) {
      metadata.last_updated = timeAgo(metadata?.last_updated);
    }

    if (metadata?.genres) {
      try {
        metadata.genres = metadata?.genres?.split(",") ?? [];
      } catch (error) {
        console.log("Failed to parse genres JSON:", error);
        metadata.genres = [];
      }
    }

    if (metadata?.episodes) {
      try {
        metadata.episodes = JSON.parse(metadata.episodes);
      } catch (error) {
        console.log("Failed to parse episodes JSON:", error);
        metadata.episodes = [];
      }
    }

    if (metadata?.chapters) {
      try {
        metadata.chapters = JSON.parse(metadata.chapters);
      } catch (error) {
        console.log("Failed to parse chapters JSON:", error);
        metadata.chapters = [];
      }
    }

    const folderPath = path.join(baseDir, type, metadata.folder_name);

    if (fs.existsSync(folderPath)) {
      const filesAndFolders = await fs.promises.readdir(folderPath, {
        withFileTypes: true,
      });

      if (type === "Anime") {
        metadata.DownloadedEpisodes = filesAndFolders
          .filter(
            (file) =>
              file.isFile() &&
              file.name.endsWith(".mp4") &&
              file.name.toLowerCase().includes("ep")
          )
          .map((file) => parseInt(file?.name?.toLowerCase()?.split("ep")?.[0]))
          .filter(Boolean)
          .sort((a, b) => a - b);
      } else if (type === "Manga") {
        metadata.DownloadedChapters = filesAndFolders
          .filter(
            (file) =>
              file.isFile() &&
              file.name.endsWith(".cbz") &&
              file.name.toLowerCase().includes("chapter")
          )
          .map((file) =>
            parseInt(file?.name?.toLowerCase()?.split("chapter")?.[1])
          )
          .filter(Boolean)
          .sort((a, b) => a - b);
      }
    }

    return metadata;
  } catch (err) {
    throw new Error(`Error fetching metadata by ID: ${err.message}`);
  }
}

// Get Local Source By id
async function getSourceById(type, baseDir, id, number) {
  if (!tables[type]) {
    throw new Error(`Invalid table: ${type}`);
  }

  try {
    const metadata = db.prepare(`SELECT * FROM ${type} WHERE id = ?`).get(id);
    if (!metadata) {
      throw new Error(`No metadata found for ID: ${id}`);
    }

    const folderPath = path.join(baseDir, type, metadata.folder_name);
    if (!fs.existsSync(folderPath)) {
      throw new Error(`Folder does not exist: ${folderPath}`);
    }

    DataToReturn = {};
    let fileName = null;

    if (type === "Anime") {
      fileName = `${number}Ep.mp4`;
    } else if (type === "Manga") {
      fileName = `Chapter ${number}.cbz`;
    }

    if (!fileName) {
      throw new Error(`File not found for ${type} ${number}`);
    }

    return {
      filepath: path.join(folderPath, fileName),
      ...DataToReturn,
    };
  } catch (err) {
    throw new Error(`Error fetching file by ID: ${err.message}`);
  }
}

// Get Pahe Fetch All Anime Episodes
async function FetchAllEpisodesAnimepaheAndSave(id, last_page) {
  let EpisodesLists = [];
  for (let i = 1; i <= last_page; i++) {
    let suffix = id.endsWith("both")
      ? "both"
      : id.endsWith("dub")
      ? "dub"
      : "sub";
    id = id.replace(/-(dub|sub|both)$/, "");

    const data = await fetchEpisodesPages(id, i, suffix);
    if (data && data.episodes && data.episodes.length > 0) {
      EpisodesLists.push(...data.episodes);
    }
  }

  if (EpisodesLists.length > 0) {
    await MetadataAdd(
      "Anime",
      {
        id: id,
        episodes: JSON.stringify(EpisodesLists),
      },
      true
    );
  }
}

// Helper function
function timeAgo(timestamp) {
  const now = new Date();
  const past = new Date(timestamp + " UTC");
  const diffInSeconds = Math.floor((now - past) / 1000);

  const units = [
    { name: "year", seconds: 31536000 },
    { name: "month", seconds: 2592000 },
    { name: "week", seconds: 604800 },
    { name: "day", seconds: 86400 },
    { name: "hour", seconds: 3600 },
    { name: "minute", seconds: 60 },
    { name: "second", seconds: 1 },
  ];

  for (const unit of units) {
    const amount = Math.floor(diffInSeconds / unit.seconds);
    if (amount >= 1) {
      return `${amount} ${unit.name}${amount > 1 ? "s" : ""} ago`;
    }
  }
  return "just now";
}

// get last mapping updated time
function getMappingLastRun() {
  try {
    const row = db
      .prepare(
        "SELECT last_ran, last_fetched FROM last_ran_Mapping WHERE id = 1"
      )
      .get();
    return {
      last_ran: row?.last_ran ?? "1970-01-01T00:00:00.000Z",
      last_fetched: row?.last_fetched ?? null,
    };
  } catch (error) {
    return {
      last_ran: "1970-01-01T00:00:00.000Z",
      last_fetched: null,
    };
  }
}

// save mapping data
function SaveMappingDatabase(data, last_ran) {
  db.exec("DROP TABLE IF EXISTS Mapping;");
  db.exec(
    `CREATE TABLE Mapping (${Object.entries(tables.Mapping)
      .map(([col, definition]) => `${col} ${definition}`)
      .join(", ")});`
  );

  const insert = db.prepare(
    `INSERT INTO Mapping (MalID, AnimeKai, HiAnime, AnimePahe) VALUES (?, ?, ?, ?)`
  );

  const insertMany = db.transaction((entries) => {
    for (const entry of entries) {
      insert.run(
        String(entry?.MalID) || null,
        JSON.stringify(entry?.AnimeKai || []),
        JSON.stringify(entry?.HiAnime || []),
        JSON.stringify(entry?.AnimePahe || [])
      );
    }
  });

  insertMany(data);

  db.prepare(
    "INSERT OR REPLACE INTO last_ran_Mapping (id, last_ran, last_fetched) VALUES (1, ?, ?)"
  ).run(last_ran, new Date().toISOString());
}

// fetch updates
async function fetchAndUpdateMappingDatabase() {
  const { last_ran, last_fetched } = getMappingLastRun();
  console.log(last_ran);
  console.log(last_fetched);

  let timeDiffInHours = null;

  if (last_fetched) {
    const now = new Date();
    const lastFetchedTime = new Date(last_fetched);
    timeDiffInHours = (now - lastFetchedTime) / (1000 * 60 * 60);
  }

  if (!timeDiffInHours || timeDiffInHours > 1) {
    try {
      const response = await axios.post("http://194.164.125.5:6145/last_ran", {
        last_ran: last_ran,
      });
      if (
        response.data &&
        response.data.data &&
        response.data.data.length > 0
      ) {
        SaveMappingDatabase(response.data.data, response.data.last_ran);
        console.log("saved");
        logger.info("Saved All MalIDs!");
      }
    } catch (error) {
      console.log(error);
      logger.error("Failed To Fetch MalIDs Update", error);
    }
  }
}

// find mapping ids
function FindMapping(id, provider_name, subDub = "sub") {
  try {
    const FoundRow = db
      .prepare(
        "SELECT * FROM Mapping WHERE MalID = ? OR AnimeKai LIKE ? OR HiAnime LIKE ? OR AnimePahe LIKE ?"
      )
      .get(id, `%${id}%`, `%${id}%`, `%${id}%`);

    if (!FoundRow) return null;

    console.log(FoundRow);

    const HiAnime = FoundRow.HiAnime ? JSON.parse(FoundRow.HiAnime) : [];
    const AnimePahe = FoundRow.AnimePahe ? JSON.parse(FoundRow.AnimePahe) : [];
    const AnimeKai = FoundRow.AnimeKai ? JSON.parse(FoundRow.AnimeKai) : [];

    switch (provider_name.toLowerCase()) {
      case "hianime":
        if (HiAnime.length > 0) return HiAnime[0].trim();
        return null;
      case "pahe":
        if (AnimePahe.length > 0) return `${AnimePahe[0].trim()}-${subDub}`;
        return null;
      case "animekai":
        if (AnimeKai.length > 0) return AnimeKai[0].trim();
        return null;
      default:
        return null;
    }
  } catch (err) {
    console.log(err);
    return null;
  }
}

module.exports = {
  MetadataAdd,
  MetadataRemove,
  getAllMetadata,
  getMetadataById,
  getSourceById,
  FetchAllEpisodesAnimepaheAndSave,
  fetchAndUpdateMappingDatabase,
  FindMapping,
};
