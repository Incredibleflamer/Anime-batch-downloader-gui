const { ipcMain } = require("electron");
const { UpdateDiscordRPC } = require("./utils/discord");

let PageHistory = [];
let OldRpcStatus = null;

function registerSharedStateHandlers() {
  ipcMain.handle("get-shared-state", () => {
    return PageHistory;
  });

  ipcMain.handle("set-shared-state", (event, newPageHistory) => {
    PageHistory = newPageHistory;
    if (OldRpcStatus) {
      UpdateDiscordRPC();
      OldRpcStatus = null;
    }
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
