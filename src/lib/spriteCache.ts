const TTL_MS = 12 * 60 * 60 * 1000;
const DB_NAME = 'lumedex-sprite-cache';
const STORE = 'sprites';
const DB_VERSION = 1;

const spritePath = (id: number) =>
	`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

type Row = { buf: ArrayBuffer; t: number };

let dbPromise: Promise<IDBDatabase> | null = null;
let fetchChain: Promise<unknown> = Promise.resolve();

function openDb(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, DB_VERSION);
		req.onerror = () => reject(req.error);
		req.onsuccess = () => resolve(req.result);
		req.onupgradeneeded = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains(STORE)) {
				db.createObjectStore(STORE);
			}
		};
	});
}

function getDb(): Promise<IDBDatabase> {
	return (dbPromise ??= openDb());
}

function idbGet(id: number): Promise<Row | undefined> {
	return getDb().then(
		(db) =>
			new Promise((resolve, reject) => {
				const tx = db.transaction(STORE, 'readonly');
				const r = tx.objectStore(STORE).get(id);
				r.onerror = () => reject(r.error);
				r.onsuccess = () => resolve(r.result as Row | undefined);
			})
	);
}

function idbPut(id: number, row: Row): Promise<void> {
	return getDb().then(
		(db) =>
			new Promise((resolve, reject) => {
				const tx = db.transaction(STORE, 'readwrite');
				tx.oncomplete = () => resolve();
				tx.onerror = () => reject(tx.error);
				tx.objectStore(STORE).put(row, id);
			})
	);
}

function queuedFetch(input: string): Promise<Response> {
	const run = () => fetch(input);
	const next = fetchChain.then(run, run);
	fetchChain = next.then(
		() => {},
		() => {}
	);
	return next;
}

export function publicSpriteUrl(id: number): string {
	return spritePath(id);
}

export async function getSpriteObjectUrl(id: number): Promise<string> {
	const httpUrl = spritePath(id);
	if (typeof indexedDB === 'undefined') {
		return httpUrl;
	}

	const now = Date.now();
	try {
		const row = await idbGet(id);
		if (row && now - row.t < TTL_MS) {
			return URL.createObjectURL(new Blob([row.buf], { type: 'image/png' }));
		}
	} catch {
	}

	try {
		const res = await queuedFetch(httpUrl);
		if (!res.ok) {
			return httpUrl;
		}
		const buf = await res.arrayBuffer();
		try {
			await idbPut(id, { buf, t: now });
		} catch {
		}
		return URL.createObjectURL(new Blob([buf], { type: 'image/png' }));
	} catch {
		return httpUrl;
	}
}
