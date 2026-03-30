import { openDB } from 'idb';

const DB_NAME = 'dessy-thumbnails';
const STORE_NAME = 'thumbnails';

const dbPromise = typeof window !== 'undefined'
  ? openDB(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE_NAME);
      },
    })
  : null;

export async function saveThumbnail(projectId: string, dataUrl: string): Promise<void> {
  if (!dbPromise) return;
  try {
    const blob = await fetch(dataUrl).then((r) => r.blob());
    const db = await dbPromise;
    await db.put(STORE_NAME, blob, projectId);
  } catch {
    // Thumbnail save failure is non-critical
  }
}

export async function getThumbnail(projectId: string): Promise<string | null> {
  if (!dbPromise) return null;
  try {
    const db = await dbPromise;
    const blob = await db.get(STORE_NAME, projectId);
    if (!blob) return null;
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

export async function deleteThumbnail(projectId: string): Promise<void> {
  if (!dbPromise) return;
  try {
    const db = await dbPromise;
    await db.delete(STORE_NAME, projectId);
  } catch {
    // Thumbnail delete failure is non-critical
  }
}
