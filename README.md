# WebGentoo

[![Release](https://img.shields.io/github/v/release/nazarhktwitch/WebGentoo?label=release)](https://github.com/nazarhktwitch/WebGentoo/releases)
[![License](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)
[![v86](https://img.shields.io/badge/v86-0.5.379-5eb7b7)](https://github.com/copy/v86)
[![xterm.js](https://img.shields.io/badge/xterm.js-6.0.0-9ed072)](https://xtermjs.org/)

Gentoo Linux running in the browser with v86 and xterm.js

WebGentoo is a static GitHub Pages project for booting a 32-bit Gentoo disk image in v86. It gives the browser a serial terminal, IndexedDB state storage, reset controls, and fullscreen support without a backend

## Getting Started

[Live Demo](https://nazarhktwitch.github.io/WebGentoo/)

Login: root
Password: password

## Features

- Browser VM: Boots a Gentoo disk image with v86 and WebAssembly
- Terminal access: Connects xterm.js to the VM serial console
- Persistent state: Saves compatible VM snapshots in IndexedDB
- Reset control: Clears browser VM storage and starts from the clean image
- Fullscreen mode: Expands the VM shell with the browser fullscreen API
- Static hosting: Runs from GitHub Pages or any static file host

## Requirements

- Node.js 18 or newer for local setup
- A browser with WebAssembly and IndexedDB support
- A 32-bit Gentoo raw disk image built for v86
- GitHub Pages or another static host for deployment

## Build

### Install dependencies

```bash
npm install
```

### Run vendor to download required files

```bash
npm run vendor
```

### Run

```bash
npx http-server . -c-1 -p 4173
```

## Image Setup

The VM image is not committed to this repository. Its built by me locally and uploaded to the GitHub Releases and is downloaded automatically when the site is loaded

## License

Released under the [MIT License](LICENSE)
