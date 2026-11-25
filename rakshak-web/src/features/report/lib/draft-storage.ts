import type { ReportDraft } from "../types";

const DB_NAME = "rakshak-drafts";
const STORE_NAME = "sos-drafts";
const DRAFT_KEY = "active-sos-draft";

function openDraftDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("IndexedDB unavailable"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
  });
}

export async function saveDraftLocally(draft: ReportDraft): Promise<void> {
  try {
    const db = await openDraftDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.put(draft, DRAFT_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("IndexedDB write failed"));
    });
    db.close();
  } catch {
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch {
        // Storage quota or privacy mode blocked; ignore cleanly.
      }
    }
  }
}

export async function loadDraftLocally(): Promise<ReportDraft | null> {
  try {
    const db = await openDraftDb();
    const result = await new Promise<ReportDraft | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(DRAFT_KEY);
      req.onsuccess = () => resolve((req.result as ReportDraft | undefined) ?? null);
      req.onerror = () => reject(req.error ?? new Error("IndexedDB read failed"));
    });
    db.close();
    if (result) return result;
  } catch {
    // Fallback to sessionStorage below
  }

  if (typeof window !== "undefined") {
    try {
      const raw = window.sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        return JSON.parse(raw) as ReportDraft;
      }
    } catch {
      return null;
    }
  }

  return null;
}

export async function clearDraftLocally(): Promise<void> {
  try {
    const db = await openDraftDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(DRAFT_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("IndexedDB delete failed"));
    });
    db.close();
  } catch {
    // Ignore IndexedDB cleanup failures
  }

  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      // Ignore
    }
  }
}
