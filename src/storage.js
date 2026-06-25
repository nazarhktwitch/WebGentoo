export class VmStorage {
  constructor(name) {
    this.name = name;
    this.db = null;
  }

  async open() {
    if (!("indexedDB" in globalThis)) {
      throw new Error("IndexedDB is not available in this browser");
    }

    this.db = await withTimeout(new Promise((resolve, reject) => {
      const request = indexedDB.open(this.name, 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("items")) {
          db.createObjectStore("items");
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }), 5000, "IndexedDB did not respond");

    return this;
  }

  async get(key) {
    return this.run("readonly", store => store.get(key));
  }

  async set(key, value) {
    return this.run("readwrite", store => store.put(value, key));
  }

  async delete(key) {
    return this.run("readwrite", store => store.delete(key));
  }

  async clear() {
    return this.run("readwrite", store => store.clear());
  }

  run(mode, action) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction("items", mode);
      const request = action(transaction.objectStore("items"));

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

function withTimeout(promise, ms, message) {
  let timer = 0;
  const timeout = new Promise((_, reject) => {
    timer = globalThis.setTimeout(() => reject(new Error(message)), ms);
  });

  return Promise.race([promise, timeout]).finally(() => {
    globalThis.clearTimeout(timer);
  });
}
