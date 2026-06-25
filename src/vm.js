import V86 from "../public/vendor/v86/libv86.mjs";

export class GentooVm {
  constructor(config, terminal, storage, callbacks) {
    this.config = config;
    this.terminal = terminal;
    this.storage = storage;
    this.callbacks = callbacks;
    this.emulator = null;
    this.saveTimer = 0;
    this.bootText = "";
  }

  async boot(savedState) {
    await this.stop();
    this.callbacks.onPhase("init", "Creating emulator", 18);

    this.emulator = new V86({
      wasm_path: this.config.paths.wasm,
      memory_size: this.config.memorySize,
      vga_memory_size: this.config.vgaMemorySize,
      bios: { url: this.config.paths.bios },
      vga_bios: { url: this.config.paths.vgaBios },
      hda: this.createDiskImage(),
      initial_state: savedState ? { buffer: savedState } : undefined,
      screen: {
        container: document.getElementById("screenContainer")
      },
      autostart: true,
      fastboot: true,
      disable_mouse: true,
      disable_speaker: true
    });

    this.bindEvents();
    this.bindTerminal();
    this.startSaving();
  }

  async stop() {
    window.clearInterval(this.saveTimer);
    this.saveTimer = 0;

    if (!this.emulator) {
      return;
    }

    try {
      await this.emulator.stop();
      await this.emulator.destroy();
    } finally {
      this.emulator = null;
    }
  }

  async restartClean() {
    await this.stop();
    await this.storage.clear();
    this.bootText = "";
  }

  async saveState() {
    if (!this.emulator) {
      return false;
    }

    const state = await this.emulator.save_state();
    await this.storage.set(this.config.stateKey, {
      createdAt: Date.now(),
      imageUrl: this.config.disk.url,
      imageSize: this.config.disk.size,
      state
    });

    return true;
  }

  createDiskImage() {
    const image = {
      url: this.config.disk.url,
      async: true,
      size: this.config.disk.size
    };

    if (this.config.disk.useParts) {
      image.use_parts = true;
      image.fixed_chunk_size = this.config.disk.fixedChunkSize;
    }

    return image;
  }

  bindEvents() {
    this.emulator.add_listener("download-progress", event => {
      const percent = event.lengthComputable && event.total
        ? Math.round((event.loaded / event.total) * 100)
        : 30;
      this.callbacks.onPhase("download", `Loading ${event.file_name}`, percent);
    });

    this.emulator.add_listener("download-error", event => {
      this.callbacks.onError(`Could not load ${event.file_name}`);
    });

    this.emulator.add_listener("emulator-ready", () => {
      this.callbacks.onPhase("ready", "Emulator ready", 88);
    });

    this.emulator.add_listener("emulator-started", () => {
      this.callbacks.onPhase("boot", "Gentoo is booting", 94);
    });

    this.emulator.add_listener("serial0-output-byte", byte => {
      const char = String.fromCharCode(byte);
      this.bootText += char;
      this.terminal.write(char);

      if (this.bootText.includes("login:") || this.bootText.includes("# ")) {
        this.callbacks.onBooted();
      }
    });
  }

  bindTerminal() {
    this.terminal.onData(data => {
      if (this.emulator) {
        this.emulator.serial0_send(data);
      }
    });
  }

  startSaving() {
    this.saveTimer = window.setInterval(async () => {
      try {
        const saved = await this.saveState();
        if (saved) {
          this.callbacks.onSaved(new Date());
        }
      } catch (error) {
        this.callbacks.onSaveSkipped(error);
      }
    }, this.config.stateSaveMs);
  }
}
