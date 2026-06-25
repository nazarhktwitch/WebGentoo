import { copyFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const files = [
  ["node_modules/v86/build/libv86.mjs", "public/vendor/v86/libv86.mjs"],
  ["node_modules/v86/build/v86.wasm", "public/vendor/v86/v86.wasm"],
  ["node_modules/@xterm/xterm/lib/xterm.mjs", "public/vendor/xterm/xterm.mjs"],
  ["node_modules/@xterm/xterm/css/xterm.css", "public/vendor/xterm/xterm.css"],
  ["node_modules/@xterm/addon-fit/lib/addon-fit.mjs", "public/vendor/xterm/addon-fit.mjs"]
];

for (const [source, target] of files) {
  await mkdir(dirname(target), { recursive: true });
  await copyFile(source, target);
  console.log(`${source} -> ${target}`);
}
