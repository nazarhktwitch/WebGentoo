import { Terminal } from "../public/vendor/xterm/xterm.mjs";
import { FitAddon } from "../public/vendor/xterm/addon-fit.mjs";
import { vmConfig, isImageConfigured } from "./config.js";
import { VmStorage } from "./storage.js";
import { GentooVm } from "./vm.js";

const elements = {
  app: document.getElementById("app"),
  bootButton: document.getElementById("bootButton"),
  resetButton: document.getElementById("resetButton"),
  fullscreenButton: document.getElementById("fullscreenButton"),
  terminal: document.getElementById("terminal"),
  loader: document.getElementById("loader"),
  loaderTitle: document.getElementById("loaderTitle"),
  loaderDetail: document.getElementById("loaderDetail"),
  progressBar: document.getElementById("progressBar"),
  statusText: document.getElementById("statusText"),
  storageStatus: document.getElementById("storageStatus"),
  imageStatus: document.getElementById("imageStatus"),
  saveStatus: document.getElementById("saveStatus")
};

const fitAddon = new FitAddon();
const terminal = new Terminal({
  cursorBlink: true,
  convertEol: true,
  fontFamily: "ui-monospace, SFMono-Regular, Consolas, Liberation Mono, monospace",
  fontSize: 14,
  scrollback: 3000,
  theme: {
    background: "#101317",
    foreground: "#dce3e8",
    cursor: "#9ed072",
    selectionBackground: "#35506b"
  }
});

terminal.loadAddon(fitAddon);
terminal.open(elements.terminal);
fitAddon.fit();

let storage;
let vm;
let booting = false;

function setProgress(title, detail, percent) {
  elements.loader.hidden = false;
  elements.loaderTitle.textContent = title;
  elements.loaderDetail.textContent = detail;
  elements.progressBar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
  elements.statusText.textContent = detail;
}

function hideProgress() {
  elements.loader.hidden = true;
}

function writeNotice(lines) {
  terminal.writeln("");
  for (const line of lines) {
    terminal.writeln(line);
  }
}

async function readSavedState() {
  const saved = await storage.get(vmConfig.stateKey);

  if (!saved || saved.imageUrl !== vmConfig.disk.url || saved.imageSize !== vmConfig.disk.size) {
    return null;
  }

  return saved.state;
}

async function bootVm({ clean = false } = {}) {
  if (booting) {
    return;
  }

  booting = true;
  elements.bootButton.disabled = true;
  setProgress("Starting WebGentoo", "Checking VM image config", 8);

  try {
    if (!isImageConfigured(vmConfig)) {
      elements.imageStatus.textContent = "Image: configure release URL";
      writeNotice([
        "Gentoo image is not configured yet.",
        "Set GENTOO_IMAGE_URL and GENTOO_IMAGE_SIZE in src/config.js,",
        "or pass ?image=URL&size=BYTES in the page URL."
      ]);
      setProgress("Image required", "Add the Gentoo release asset URL and size", 100);
      return;
    }

    elements.imageStatus.textContent = "Image: configured";
    await storage.set(vmConfig.imageMetaKey, {
      url: vmConfig.disk.url,
      size: vmConfig.disk.size,
      checkedAt: Date.now()
    });

    if (clean) {
      setProgress("Resetting VM", "Clearing saved browser state", 12);
      await vm.restartClean();
    }

    const savedState = clean ? null : await readSavedState();
    elements.saveStatus.textContent = savedState ? "State: restoring" : "State: clean boot";

    terminal.clear();
    terminal.focus();
    await vm.boot(savedState);
  } catch (error) {
    elements.statusText.textContent = "Boot failed";
    writeNotice([`Boot failed: ${error.message}`]);
  } finally {
    booting = false;
    elements.bootButton.disabled = false;
  }
}

async function init() {
  setProgress("Starting WebGentoo", "Opening IndexedDB", 4);

  storage = await new VmStorage(vmConfig.storageName).open();
  elements.storageStatus.textContent = "Storage: IndexedDB ready";

  vm = new GentooVm(vmConfig, terminal, storage, {
    onPhase(_name, detail, percent) {
      setProgress("Booting Gentoo", detail, percent);
    },
    onBooted() {
      elements.statusText.textContent = "Gentoo console ready";
      hideProgress();
      fitAddon.fit();
    },
    onSaved(date) {
      elements.saveStatus.textContent = `State: saved ${date.toLocaleTimeString()}`;
    },
    onSaveSkipped(error) {
      elements.saveStatus.textContent = `State: save skipped (${error.message})`;
    },
    onError(message) {
      elements.statusText.textContent = message;
      writeNotice([message]);
    }
  });

  setProgress("Starting WebGentoo", "Ready to boot", 100);
  elements.bootButton.disabled = false;
  await bootVm();
}

elements.bootButton.addEventListener("click", () => bootVm());
elements.resetButton.addEventListener("click", () => bootVm({ clean: true }));
elements.fullscreenButton.addEventListener("click", async () => {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
  } else {
    await elements.app.requestFullscreen();
  }

  window.setTimeout(() => fitAddon.fit(), 120);
});

window.addEventListener("resize", () => fitAddon.fit());
window.addEventListener("beforeunload", () => {
  if (vm) {
    vm.saveState().catch(() => {});
  }
});

init().catch(error => {
  elements.storageStatus.textContent = "Storage: unavailable";
  elements.statusText.textContent = "Startup failed";
  writeNotice([`Startup failed: ${error.message}`]);
  setProgress("Startup failed", error.message, 100);
});
