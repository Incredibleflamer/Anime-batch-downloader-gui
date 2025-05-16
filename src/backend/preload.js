const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("sharedStateAPI", {
  get: () => ipcRenderer.invoke("get-shared-state"),
  set: (newState) => ipcRenderer.invoke("set-shared-state", newState),
  discordrpc: (AnimeName, Episode) =>
    ipcRenderer.invoke("update-discordrpc", AnimeName, Episode),
  on: (channel, callback) => {
    ipcRenderer.on(channel, (_event, data) => callback(data));
  },
});
