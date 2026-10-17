const API_URL = "https://dragonball-api.com/api/characters";
const API_LIMIT = 10;

export function createCharacterLoader() {
	let nextPageUrl = `${API_URL}?page=1&limit=${API_LIMIT}`;
	let queuedCharacters = [];
	let pendingFetch = null;
	const characterDetails = new Map();

	function getCharacterDetails(id) {
		if (id == null) return Promise.resolve(null);
		if (!characterDetails.has(id)) {
			const request = fetch(`${API_URL}/${encodeURIComponent(id)}`)
				.then((response) => {
					if (!response.ok) {
						throw new Error(`Character API returned ${response.status}`);
					}
					return response.json();
				})
				.catch((error) => {
					characterDetails.delete(id);
					throw error;
				});
			characterDetails.set(id, request);
		}
		return characterDetails.get(id);
	}

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

	return { takeCharacters, getCharacterDetails, get loading() { return pendingFetch !== null; } };
}
