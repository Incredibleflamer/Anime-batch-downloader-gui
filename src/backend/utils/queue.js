// libs
const { app } = require("electron");
const path = require("path");
const SimplDB = require("simpl.db");

// database create [ gets created in /user/your_name/AppData/Roaming ]
const userDataPath = app.getPath("userData");
const QueueFilePath = path.join(userDataPath, "queue.json");
const queue = new SimplDB({ dataFile: QueueFilePath });

let AnimeQueue = [];

// Add to Queue
async function addToQueue(item) {
  AnimeQueue.push(item);
  await saveQueue();
}

// load queue when the script start
async function loadQueue() {
  AnimeQueue = (await queue.get("queue")) || [];
  AnimeQueue.forEach((entry) => {
    entry.progress = 0;
  });
  await saveQueue();
}

// remove anime from queue
async function removeQueue(Title, EpNum, AnimeEpId) {
  const indexToRemove = AnimeQueue.findIndex(
    (item) =>
      item.Title === Title && item.EpNum === EpNum && item.epid === AnimeEpId
  );
  if (indexToRemove !== -1) {
    AnimeQueue.splice(indexToRemove, 1);
    await saveQueue();
  }
}

// Remove With Index
async function SaveQueueData(QueueData) {
  AnimeQueue = QueueData;
  await saveQueue();
}

// update the queue [ for storing how much downloaded ]
async function updateQueue(epid, totalSegments, currentSegments) {
  const indexToUpdate = AnimeQueue.findIndex((item) => item.epid === epid);
  if (indexToUpdate !== -1) {
    AnimeQueue[indexToUpdate].totalSegments = parseFloat(totalSegments);
    AnimeQueue[indexToUpdate].currentSegments = parseFloat(currentSegments);
    if (parseFloat(currentSegments) === parseFloat(totalSegments)) {
      AnimeQueue.splice(indexToUpdate, 1);
    }
    await saveQueue();
  }
}

// Get Queue
async function getQueue(currently_downloading = null) {
  return currently_downloading
    ? AnimeQueue.filter((item) => item.epid !== currently_downloading)
    : AnimeQueue;
}

// sync the queue with database
async function saveQueue() {
  try {
    await queue.set("queue", AnimeQueue);
    await queue.save();
  } catch (err) {
    console.log(err);
    logger.error(`Error message: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
  }
}

// check if it exists in queue
async function checkEpisodeDownload(epid) {
  const found = AnimeQueue.some((item) => item.epid === epid);
  return found;
}

module.exports = {
  addToQueue,
  loadQueue,
  removeQueue,
  saveQueue,
  updateQueue,
  getQueue,
  checkEpisodeDownload,
  SaveQueueData,
};
