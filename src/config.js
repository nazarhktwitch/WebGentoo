const query = new URLSearchParams(globalThis.location.search);

const releaseImageUrl =
  "https://github.com/nazarhktwitch/WebGentoo/releases/download/gentoo-v1/gentoo-i686.img.zst";
const releaseImageSize = 493697606;

function readNumber(name, fallback) {
  const value = query.get(name) || globalThis[name];
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readBoolean(name, fallback) {
  const value = query.get(name) || globalThis[name];
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return value === true || value === "true" || value === "1";
}

export const vmConfig = {
  appName: "WebGentoo",
  storageName: "webgentoo-vm",
  stateKey: "gentoo-state",
  imageMetaKey: "gentoo-image-meta",
  stateSaveMs: 45000,
  bootWaitMs: 12000,
  memorySize: 256 * 1024 * 1024,
  vgaMemorySize: 16 * 1024 * 1024,
  paths: {
    wasm: "./public/vendor/v86/v86.wasm",
    bios: "./public/bios/seabios.bin",
    vgaBios: "./public/bios/vgabios.bin"
  },
  disk: {
    url: query.get("image") || globalThis.GENTOO_IMAGE_URL || releaseImageUrl,
    size: readNumber("size", Number(globalThis.GENTOO_IMAGE_SIZE) || releaseImageSize),
    useParts: readBoolean("parts", false),
    fixedChunkSize: readNumber("chunk", 2 * 1024 * 1024)
  }
};

export function isImageConfigured(config = vmConfig) {
  return Boolean(config.disk.url && config.disk.size && config.disk.size > 0);
}
