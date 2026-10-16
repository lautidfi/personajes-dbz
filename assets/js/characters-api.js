const API_URL = "https://dragonball-api.com/api/characters";
const API_LIMIT = 10;

export function createCharacterLoader() {
	let nextPageUrl = `${API_URL}?page=1&limit=${API_LIMIT}`;
	let queuedCharacters = [];
	let pendingFetch = null;

	async function fetchNextPage() {
		if (!nextPageUrl) return;
		if (pendingFetch) return pendingFetch;

		pendingFetch = (async () => {
			const response = await fetch(nextPageUrl);
			if (!response.ok) {
				throw new Error(`Character API returned ${response.status}`);
			}

			const data = await response.json();
			queuedCharacters.push(...(Array.isArray(data.items) ? data.items : []));
			nextPageUrl = data.links?.next || null;
		})();
		try {
			await pendingFetch;
		} finally {
			pendingFetch = null;
		}
	}

	async function ensureQueuedCharacters(count) {
		while (queuedCharacters.length < count && nextPageUrl) {
			await fetchNextPage();
		}
	}

	async function takeCharacters(count) {
		await ensureQueuedCharacters(count);
		return queuedCharacters.splice(0, count);
	}

	return { takeCharacters, get loading() { return pendingFetch !== null; } };
}
