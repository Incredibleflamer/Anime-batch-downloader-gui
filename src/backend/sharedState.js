const { ipcMain } = require("electron");
const { UpdateDiscordRPC } = require("./utils/discord");

let PageHistory = [];
let OldRpcStatus = "";

function registerSharedStateHandlers() {
  ipcMain.handle("get-shared-state", () => {
    return PageHistory;
  });

  ipcMain.handle("set-shared-state", (event, newPageHistory) => {
    PageHistory = newPageHistory;
    return PageHistory;
  });

  ipcMain.handle("update-discordrpc", (event, AnimeName, Episode) => {
    NewRpcStatus = `${AnimeName}${Episode}`;
    if (OldRpcStatus !== NewRpcStatus) {
      OldRpcStatus = NewRpcStatus;
      UpdateDiscordRPC(AnimeName, Episode);
    }
  });
}

module.exports = { registerSharedStateHandlers };
