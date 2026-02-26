/*
 * @Descripttion:
 * @Author: xianghaifeng
 * @Date: 2026-02-26 13:54:46
 * @LastEditors: xianghaifeng
 * @LastEditTime: 2026-02-26 14:20:22
 */
import type { LinkItem } from "./types";

const DB_NAME = "linkset-db";
const STORE = "links";
const FOLDER_STORE = "folders";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 3);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("url", "url", { unique: false });
        store.createIndex("name", "name", { unique: false });
        try {
          store.createIndex("path", "path", {
            unique: false,
            multiEntry: true,
          });
        } catch {}
      } else {
        const store = req.transaction?.objectStore(STORE);
        if (store) {
          try {
            store.createIndex("path", "path", {
              unique: false,
              multiEntry: true,
            });
          } catch {}
        }
      }
      if (!db.objectStoreNames.contains(FOLDER_STORE)) {
        db.createObjectStore(FOLDER_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function loadLinks(): Promise<LinkItem[]> {
  try {
    const db = await openDB();
    return await new Promise<LinkItem[]>((resolve) => {
      const tx = db.transaction(STORE, "readonly");
      const st = tx.objectStore(STORE);
      const req = st.getAll();
      req.onsuccess = () => resolve((req.result || []) as LinkItem[]);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function saveLinks(items: LinkItem[]): Promise<boolean> {
  try {
    const db = await openDB();
    return await new Promise<boolean>((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      const st = tx.objectStore(STORE);
      const clearReq = st.clear();
      clearReq.onerror = () => resolve(false);
      clearReq.onsuccess = () => {
        for (const it of items) st.put(it);
      };
      tx.oncomplete = () => resolve(true);
      tx.onabort = () => resolve(false);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

export async function loadFolders(): Promise<string[][]> {
  try {
    const db = await openDB();
    return await new Promise<string[][]>((resolve) => {
      const tx = db.transaction(FOLDER_STORE, "readonly");
      const st = tx.objectStore(FOLDER_STORE);
      const req = st.getAll();
      req.onsuccess = () => {
        const rows = (req.result || []) as Array<{ id: string }>;
        const paths = rows
          .map((r) => r.id)
          .filter((s) => typeof s === "string" && s.length)
          .map((s) => s.split("/").filter(Boolean));
        resolve(paths);
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function saveFolders(paths: string[][]): Promise<boolean> {
  try {
    const db = await openDB();
    return await new Promise<boolean>((resolve) => {
      const tx = db.transaction(FOLDER_STORE, "readwrite");
      const st = tx.objectStore(FOLDER_STORE);
      const clearReq = st.clear();
      clearReq.onerror = () => resolve(false);
      clearReq.onsuccess = () => {
        for (const p of paths) {
          const id = p.join("/");
          st.put({ id });
        }
      };
      tx.oncomplete = () => resolve(true);
      tx.onabort = () => resolve(false);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

export function exportJSON(items: LinkItem[]) {
  const blob = new Blob([JSON.stringify(items, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "linkset.json";
  a.click();
  URL.revokeObjectURL(url);
}

export async function importJSON(file: File): Promise<LinkItem[]> {
  const text = await file.text();
  const data = JSON.parse(text);
  if (!Array.isArray(data)) return [];
  return data
    .filter((v) => v && typeof v.url === "string")
    .map((v) => ({
      id: crypto.randomUUID(),
      name: typeof v.name === "string" ? v.name : v.url,
      url: v.url,
      tags: Array.isArray(v.tags) ? v.tags : undefined,
    }));
}
