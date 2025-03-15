// libs
const { ddosGuardRequest, fetchEpisode } = require("../Scrappers/animepahe");
const BetterSqlite3 = require("better-sqlite3");
const { logger } = require("./AppLogger");
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
    EpisodesDataId: "TEXT",
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
    NextEpisodes: "TEXT",
  },
  MyAnimeList: {
    id: "TEXT UNIQUE",
    title: "TEXT",
    image: "TEXT",
    totalEpisodes: "INTEGER",
    watched: "INTEGER",
    sortOrder: "INTEGER",
  },
  last_ran_Mapping: {
    id: "INTEGER PRIMARY KEY AUTOINCREMENT",
    last_ran: "TEXT",
    last_fetched: "TEXT",
    last_Sync_Mal: "TEXT",
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
      logger.error(`Failed To Update Metadata`);
      logger.error(`Error message: ${err.message}`);
      logger.error(`Stack trace: ${err.stack}`);
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

    if (valuesToAdd?.EpisodesDataId) {
      try {
        await FetchAllEpisodes(valuesToAdd.EpisodesDataId);
      } catch (err) {
        logger.error(`Error Fetching All Episodes`);
        logger.error(`Error message: ${err.message}`);
        logger.error(`Stack trace: ${err.stack}`);
      }
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
        metadata.genres = [];
      }
    }

    if (metadata?.episodes) {
      try {
        metadata.episodes = JSON.parse(metadata.episodes);
      } catch (error) {
        metadata.episodes = [];
      }
    }

    if (metadata?.chapters) {
      try {
        metadata.chapters = JSON.parse(metadata.chapters);
      } catch (error) {
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

// Fetch All Anime Episodes
async function FetchAllEpisodes(EpisodesDataId) {
  let Episodes = await fetchEpisode(EpisodesDataId, 1);

  if (Episodes && Episodes?.episodes?.length > 0) {
    if (Episodes?.last_page && Episodes?.last_page > 1) {
      for (let i = 2; i <= Episodes.last_page; i++) {
        let nextPageData = await fetchEpisode(EpisodesDataId, i);
        if (nextPageData?.episodes?.length > 0) {
          Episodes.episodes?.push(...nextPageData?.episodes);
        } else {
          break;
        }
      }
    }

    await MetadataAdd(
      "Anime",
      {
        last_page: Episodes.last_page,
        totalEpisodes: Episodes.episodes.length ?? 0,
        episodes: Episodes?.episodes,
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

// get last malsync updated time
async function getMALLastSync() {
  try {
    const row = db
      .prepare("SELECT last_Sync_Mal FROM last_ran_Mapping WHERE id = 1")
      .get();

    return row?.last_Sync_Mal ?? null;
  } catch (error) {
    return null;
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
  db.exec("DELETE FROM sqlite_sequence WHERE name = 'Mapping';");
  const insert = db.prepare(
    `INSERT INTO Mapping (MalID , AnimeKai, HiAnime, AnimePahe, NextEpisodes) VALUES (?, ?, ?, ?, ?)`
  );

  const insertMany = db.transaction((entries) => {
    for (const entry of entries) {
      insert.run(
        String(entry?.MalId) || null,
        JSON.stringify(entry?.AnimeKai || []),
        JSON.stringify(entry?.HiAnime || []),
        JSON.stringify(entry?.AnimePahe || []),
        JSON.stringify(entry?.NextEpisodes || [])
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
        logger.info("[MAL-LIST] NEW MAPPING FOUND");
        SaveMappingDatabase(response.data.data, response.data.last_ran);
        logger.info("[MAL-LIST] MAPPING UPDATED");
      }
    } catch (error) {
      logger.error("[MAL-LIST] MAPPING FAILED");
      logger.error(`Error message: ${err.message}`);
      logger.error(`Stack trace: ${err.stack}`);
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
    logger.error(`Error Fetching Mapping`);
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    return null;
  }
}

// Map MAL
async function MalEpMap(data = []) {
  try {
    if (!data.length) return;

    let InsertOrUpdateQuery = db.prepare(`
      INSERT INTO MyAnimeList (id, title, image, totalEpisodes, watched)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET 
        title = excluded.title,
        image = excluded.image,
        totalEpisodes = excluded.totalEpisodes,
        watched = excluded.watched
    `);

    const insertMany = db.transaction((entries) => {
      for (const entry of entries) {
        InsertOrUpdateQuery.run(
          entry.id.toString(),
          entry.title,
          entry.image,
          parseInt(entry.totalEpisodes ?? 0),
          parseInt(entry.watched ?? 0)
        );
      }
    });

    insertMany(data);
  } catch (err) {
    logger.error(`Failed To Update MyAnimeList`);
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
  }
}

// Mal Sort
async function processAndSortMyAnimeList() {
  try {
    let animeList = db.prepare(`SELECT * FROM MyAnimeList`).all();
    if (animeList.length === 0) return;

    let malIds = animeList.map((anime) => anime.id);

    let mappingData = db
      .prepare(
        `SELECT MalID, NextEpisodes FROM Mapping WHERE MalID IN (${malIds
          .map(() => "?")
          .join(",")})`
      )
      .all(...malIds);

    let mappingMap = new Map();
    for (let { MalID, NextEpisodes } of mappingData) {
      if (NextEpisodes && NextEpisodes !== "[]") {
        try {
          let parsedEpisodes = JSON.parse(NextEpisodes);
          if (parsedEpisodes.length) {
            mappingMap.set(MalID, parsedEpisodes);
          }
        } catch (e) {
          // skip :3
        }
      }
    }

    let now = Date.now();

    let animeData = animeList.map((anime) => {
      let totalEpisodes = parseInt(anime.totalEpisodes) || 0;

      let NextEpisodes =
        mappingMap
          ?.get(anime.id)
          ?.filter((item) => item?.Episode > totalEpisodes) ?? [];

      if (NextEpisodes.length > 0) {
        let lastEpisode = NextEpisodes[0].Episode - 1;
        let lastDate = parseInt(NextEpisodes[0].date) * 1000;
        return {
          ...anime,
          hasNext: true,
          lastEpisode: lastEpisode,
          lastDate: lastDate,
          daysLeft: Math.floor((lastDate - now) / (1000 * 60 * 60 * 24)),
          watchedLast: anime.watched === lastEpisode,
          isCompleted: anime.watched >= totalEpisodes,
        };
      } else {
        return {
          ...anime,
          hasNext: false,
        };
      }
    });

    animeData.sort((a, b) => {
      if (a.hasNext !== b.hasNext) return Number(b.hasNext) - Number(a.hasNext);
      if (a.watchedLast !== b.watchedLast)
        return Number(b.watchedLast) - Number(a.watchedLast);

      if (a.lastDate && b.lastDate) {
        let isWithin14DaysA = a.daysLeft >= 1 && a.daysLeft <= 14;
        let isWithin14DaysB = b.daysLeft >= 1 && b.daysLeft <= 14;

        if (isWithin14DaysA !== isWithin14DaysB)
          return Number(isWithin14DaysB) - Number(isWithin14DaysA);

        return a.daysLeft - b.daysLeft;
      } else if (a.lastDate) {
        return -1;
      } else if (b.lastDate) {
        return 1;
      }

      if (a.isCompleted !== b.isCompleted)
        return Number(a.isCompleted) - Number(b.isCompleted);

      return 0;
    });

    let updateQuery = db.prepare(`
      UPDATE MyAnimeList 
      SET title = ?, image = ?, totalEpisodes = ?, watched = ?, sortOrder = ? 
      WHERE id = ?
    `);

    animeData.forEach((entry, index) => {
      updateQuery.run(
        entry.title,
        entry.image,
        entry.totalEpisodes,
        entry.watched,
        index,
        entry.id
      );
    });

    db.prepare(
      "INSERT OR REPLACE INTO last_ran_Mapping (id, last_Sync_Mal) VALUES (1, ?)"
    ).run(new Date().toISOString());

    logger.info(`[MyAnimeList] Successfully Sorted!`);
  } catch (err) {
    logger.error(`Error processing MyAnimeList`);
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
  }
}

// Mal Retrive Pages
async function MalPage(provider_name) {
  try {
    let animeList = db.prepare(`SELECT * FROM MyAnimeList`).all();

    if (animeList.length === 0) return [];

    let malIds = animeList.map((anime) => anime.id);

    let mappingData = db
      .prepare(
        `SELECT MalID, AnimeKai, HiAnime, AnimePahe FROM Mapping WHERE MalID IN (${malIds
          .map(() => "?")
          .join(",")})`
      )
      .all(...malIds);

    let filteredAnime = animeList.map((anime) => {
      let mapping = mappingData.find((map) => map.MalID === anime.id);
      if (!mapping) return null;

      let providerId = null;

      switch (provider_name) {
        case "animekai":
          providerId = mapping.AnimeKai;
          break;
        case "hianime":
          providerId = mapping.HiAnime;
          break;
        case "pahe":
          providerId = mapping.AnimePahe;
          break;
      }

      if (providerId && providerId !== "[]") {
        providerId = JSON.parse(providerId);
        if (providerId?.length > 0) {
          providerId = providerId[0];
        } else {
          providerId = null;
        }
      } else {
        providerId = null;
      }

      return providerId ? { ...anime, id: providerId } : null;
    });

    let lists = filteredAnime.filter((anime) => anime !== null);

    return {
      totalPages: 1,
      currentPage: 1,
      hasNextPage: false,
      totalItems: lists.length,
      results: lists,
    };
  } catch (err) {
    console.log("Error in MalPage:", err);
    return {
      totalPages: 0,
      currentPage: 1,
      hasNextPage: false,
      totalItems: 0,
      results: [],
    };
  }
}

module.exports = {
  MetadataAdd,
  MetadataRemove,
  getAllMetadata,
  getMetadataById,
  getSourceById,
  fetchAndUpdateMappingDatabase,
  FindMapping,
  MalEpMap,
  processAndSortMyAnimeList,
  getMALLastSync,
  MalPage,
};
