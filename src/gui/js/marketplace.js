async function Init(AnimeManga, AppVersion) {
  const grid = document.getElementById("providerGrid");

  const response = await fetch(
    "https://raw.githubusercontent.com/TheYogMehta/extensions/refs/heads/main/marketplace.json"
  );

  const data = await response.json();

  for (const provider of data[AnimeManga]) {
    const div = document.createElement("div");
    div.className = "provider";

    div.innerHTML = `
      <div class="provider-left">
        <div class="provider-name">${provider.name}</div>
        <div class="provider-version">v${provider.version}</div>
          ${CreateButton(
            AnimeManga,
            AppVersion,
            provider.name,
            provider.version,
            provider.disabled,
            provider.MinAppVersion
          )}
    </div>
    <div class="provider-logo">
        <img class="provider-img" src="https://raw.githubusercontent.com/TheYogMehta/extensions/refs/heads/main/ico/${
          provider.name
        }.ico" alt="${provider.name}" />
    </div>`;

    grid.appendChild(div);
  }
}

function CreateButton(
  AnimeManga,
  AppVersion,
  providerName,
  ProviderVersion,
  disabled = false,
  AppVersionNeeded
) {
  let ToRender = [];
  let AppUpdatedAvailable = IsUpdateAvailable(AppVersion, AppVersionNeeded);

  if (AppUpdatedAvailable) {
    ToRender.push(
      `<button class="btn btn-app-update" disabled>Update App</button>`
    );
  }

  let AppInstalled = InstalledProvider[AnimeManga]?.find(
    (p) => p.name === providerName
  );

  let ProviderUpdate = AppInstalled
    ? IsUpdateAvailable(AppInstalled?.version, ProviderVersion)
    : false;

  if (disabled) {
    if (AppInstalled) {
      ToRender.push(
        `<button class="btn btn-remove" onclick='handleExtensionAction("${AnimeManga}","remove", "${providerName}")'>Remove</button>`
      );
    }

    return `<div class="obsulute">OBSULUTE</div>
    <div class="provider-buttons">${ToRender.join("")}</div>`;
  }

  if (AppInstalled) {
    if (!AppUpdatedAvailable && ProviderUpdate) {
      ToRender.push(
        `<button class="btn btn-update" onclick='handleExtensionAction("${AnimeManga}","add", "${providerName}")'>Update</button>`
      );
    }
    ToRender.push(
      `<button class="btn btn-remove" onclick='handleExtensionAction("${AnimeManga}","remove", "${providerName}")'>Remove</button>`
    );
  } else if (!AppInstalled && !AppUpdatedAvailable) {
    ToRender.push(
      `<button class="btn btn-install" onclick='handleExtensionAction("${AnimeManga}","add", "${providerName}")'>Install</button>`
    );
  }

  return `<div class="provider-buttons">${ToRender.join("")}</div>`;
}

function IsUpdateAvailable(currentVersion, requiredVersion) {
  const curr = currentVersion.split(".").map(Number);
  const req = requiredVersion.split(".").map(Number);
  for (let i = 0; i < Math.max(curr.length, req.length); i++) {
    const c = curr[i] || 0;
    const r = req[i] || 0;
    if (c < r) return true;
  }
  return false;
}

async function handleExtensionAction(AnimeManga, type, providerName) {
  showMiniLoader(true);

  try {
    const response = await window.sharedStateAPI.extensions(
      type,
      AnimeManga,
      providerName
    );

    if (response) {
      Swal.fire({
        icon: response.type,
        title: response.title,
        text: response.msg,
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: "Empty response received.",
      });
    }
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Failed",
      text: err?.message || "Unknown error occurred",
    });
  }

  showMiniLoader(false);
  window.location.reload();
}

function showMiniLoader(show) {
  const loader = document.getElementById("miniLoaderOverlay");
  if (loader) {
    loader.style.display = show ? "flex" : "none";
  }
}
