import { makeId } from "./id";

const DB_NAME = "household-manager-attachments";
const STORE_NAME = "files";
const DB_VERSION = 1;

export interface AttachmentMeta {
  id: string;
  name: string;
  type: string;
  size: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const req = fn(tx.objectStore(STORE_NAME));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export async function saveAttachment(file: File): Promise<AttachmentMeta> {
  const id = makeId();
  await withStore("readwrite", (store) => store.put(file, id));
  return { id, name: file.name, type: file.type, size: file.size };
}

export function getAttachmentBlob(id: string): Promise<Blob | undefined> {
  return withStore("readonly", (store) => store.get(id));
}

export async function putAttachmentBlob(id: string, blob: Blob): Promise<void> {
  await withStore("readwrite", (store) => store.put(blob, id));
}

export async function deleteAttachment(id: string): Promise<void> {
  await withStore("readwrite", (store) => store.delete(id));
}

export function stripExtension(filename: string): string {
  const idx = filename.lastIndexOf(".");
  return idx > 0 ? filename.slice(0, idx) : filename;
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}
