import { openDB } from 'idb';

const DB_NAME = 'dessy-images';
const STORE_NAME = 'images';

const dbPromise = typeof window !== 'undefined'
  ? openDB(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE_NAME);
      },
    })
  : null;

export async function storeImage(blob: Blob): Promise<string> {
  const id = crypto.randomUUID();
  const db = await dbPromise!;
  await db.put(STORE_NAME, blob, id);
  return id;
}

export async function getImage(id: string): Promise<string | null> {
  const db = await dbPromise!;
  const blob = await db.get(STORE_NAME, id);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

export async function deleteImage(id: string): Promise<void> {
  const db = await dbPromise!;
  await db.delete(STORE_NAME, id);
}
