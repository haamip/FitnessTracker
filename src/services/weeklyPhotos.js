import { supabase } from "./supabase";
// Progress pictures stay on the user's device. Do not store images in localStorage
// or send them to a server without explicit user consent and private storage.
const DB = "trackfit-private-photos";
const STORE = "weekly-progress";
const MAX_BYTES = 8 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

async function accountNamespace() {
  if (!supabase) return "offline-device";
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user?.id) throw new Error("Sign in to keep progress photos separated by account.");
  return data.session.user.id;
}

function openDb() {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("Photo storage is unavailable on this device."));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE)) database.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Unable to access photo storage."));
  });
}

async function transaction(mode, callback) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = callback(tx.objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => db.close();
    tx.onabort = () => db.close();
  });
}

export async function putWeeklyPhoto(weekStart, angle, file) {
  if (!TYPES.has(file?.type)) throw new Error("Choose a JPEG, PNG or WebP photo.");
  if (!file.size || file.size > MAX_BYTES) throw new Error("Photo must be under 8MB.");
  const id = `${await accountNamespace()}:${weekStart}:${angle}`;
  await transaction("readwrite", (store) => store.put({
    id, weekStart, angle, image: file, updatedAt: new Date().toISOString(),
  }));
  return id;
}

export async function getWeeklyPhoto(weekStart, angle) {
  const id = `${await accountNamespace()}:${weekStart}:${angle}`;
  return (await transaction("readonly", (store) => store.get(id))) || null;
}

export async function deleteWeeklyPhoto(weekStart, angle) {
  const id = `${await accountNamespace()}:${weekStart}:${angle}`;
  await transaction("readwrite", (store) => store.delete(id));
}
