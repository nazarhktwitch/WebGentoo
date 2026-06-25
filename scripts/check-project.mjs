import { access, readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const requiredFiles = [
  "index.html",
  "src/app.js",
  "src/config.js",
  "src/storage.js",
  "src/vm.js",
  "src/styles.css",
  "public/vendor/v86/libv86.mjs",
  "public/vendor/v86/v86.wasm",
  "public/vendor/xterm/xterm.mjs",
  "public/vendor/xterm/xterm.css",
  "public/vendor/xterm/addon-fit.mjs",
  "public/bios/seabios.bin",
  "public/bios/vgabios.bin",
  "README.md",
  "docs/gentoo-image.md",
  "docs/github-pages.md",
  "LICENSE"
];

const docs = ["README.md", "docs/gentoo-image.md", "docs/github-pages.md"];
const bannedWords = [
  "Modern",
  "intuitive",
  "polished",
  "seamless",
  "instant",
  "robust",
  "scalable",
  "high performance",
  "easy to use",
  "powerful features",
  "out of the box",
  "state of the art"
];

for (const file of requiredFiles) {
  await access(file);
}

for (const file of docs) {
  const text = await readFile(file, "utf8");

  if (!text.endsWith("\n")) {
    throw new Error(`${file} must end with a newline`);
  }

  for (const word of bannedWords) {
    if (text.includes(word)) {
      throw new Error(`${file} contains blocked wording: ${word}`);
    }
  }

  const lines = text.split("\n");
  const h1Count = lines.filter(line => line.startsWith("# ")).length;
  if (h1Count !== 1) {
    throw new Error(`${file} must have one top-level heading`);
  }
}

const generatedFiles = await listFiles(".");
for (const file of generatedFiles) {
  if (
    file.includes("node_modules") ||
    file.includes("package-lock.json") ||
    file.includes(join("public", "vendor")) ||
    file.includes(join("public", "bios")) ||
    file.endsWith("INSTRUCTIONS.md")
  ) {
    continue;
  }

  const info = await stat(file);
  if (info.size > 1024 * 1024) {
    continue;
  }

  const text = await readFile(file, "utf8").catch(() => "");
  if (/[\u2014\u2013\u201c\u201d\u2018\u2019\u2026\u00d7\u2022]/.test(text)) {
    throw new Error(`${file} contains non-ASCII typography`);
  }
}

console.log("Project checks passed");

async function listFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(path));
    } else {
      files.push(path);
    }
  }

  return files;
}
