import type { CanvasDocument, CustomFont } from '../types/editor.ts';

const DB_NAME = 'lumio_studio_db';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';
const STORE_FONTS = 'fonts';
const STORE_SETTINGS = 'settings';

// Reuse a single connection instead of opening a new one for every read/write.
let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = openDBInternal();
    dbPromise.catch(() => {
      dbPromise = null; // allow a retry after a failure
    });
  }
  return dbPromise;
}

function openDBInternal(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_FONTS)) {
        db.createObjectStore(STORE_FONTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };
    request.onerror = () => reject(request.error);
  });
}

// Projects
export async function saveProject(doc: CanvasDocument): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readwrite');
    const store = tx.objectStore(STORE_PROJECTS);
    const updatedDoc: CanvasDocument = {
      ...doc,
      updatedAt: Date.now(),
    };
    const req = store.put(updatedDoc);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getAllProjects(): Promise<CanvasDocument[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readonly');
    const store = tx.objectStore(STORE_PROJECTS);
    const req = store.getAll();
    req.onsuccess = () => {
      const results: CanvasDocument[] = req.result || [];
      // Sort by updatedAt descending
      results.sort((a, b) => b.updatedAt - a.updatedAt);
      resolve(results);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getProjectById(id: string): Promise<CanvasDocument | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readonly');
    const store = tx.objectStore(STORE_PROJECTS);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteProject(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readwrite');
    const store = tx.objectStore(STORE_PROJECTS);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Fonts
export async function saveCustomFont(font: CustomFont): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_FONTS, 'readwrite');
    const store = tx.objectStore(STORE_FONTS);
    const req = store.put(font);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getAllCustomFonts(): Promise<CustomFont[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_FONTS, 'readonly');
    const store = tx.objectStore(STORE_FONTS);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteCustomFont(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_FONTS, 'readwrite');
    const store = tx.objectStore(STORE_FONTS);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function loadFontToDocument(font: CustomFont): Promise<boolean> {
  try {
    const fontFace = new FontFace(font.name, `url(${font.dataUrl})`);
    const loaded = await fontFace.load();
    (document.fonts as any).add(loaded);
    return true;
  } catch (err) {
    console.warn(`Could not load font ${font.name}:`, err);
    return false;
  }
}

export async function initializeAllCustomFonts(): Promise<CustomFont[]> {
  const fonts = await getAllCustomFonts();
  for (const font of fonts) {
    await loadFontToDocument(font);
  }
  return fonts;
}

// Settings
export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_SETTINGS, 'readonly');
      const store = tx.objectStore(STORE_SETTINGS);
      const req = store.get(key);
      req.onsuccess = () => {
        if (req.result && 'value' in req.result) {
          resolve(req.result.value as T);
        } else {
          // fallback to localStorage
          const local = localStorage.getItem(`lumio_${key}`);
          if (local !== null) {
            try {
              resolve(JSON.parse(local));
            } catch {
              resolve(local as unknown as T);
            }
          } else {
            resolve(defaultValue);
          }
        }
      };
      req.onerror = () => resolve(defaultValue);
    });
  } catch {
    return defaultValue;
  }
}

export async function saveSetting<T>(key: string, value: T): Promise<void> {
  try {
    localStorage.setItem(`lumio_${key}`, JSON.stringify(value));
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SETTINGS, 'readwrite');
      const store = tx.objectStore(STORE_SETTINGS);
      const req = store.put({ key, value });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error('Error saving setting:', e);
  }
}
