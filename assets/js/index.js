const API_URL = "https://dragonball-api.com/api/characters";
const API_LIMIT = 10;
const INITIAL_ROWS = 2;

const grid = document.querySelector(".cards-grid");
const status = document.querySelector(".loading-status");
const retryButton = document.querySelector(".retry-button");

let nextPageUrl = `${API_URL}?page=1&limit=${API_LIMIT}`;
let queuedCharacters = [];
let loadingPage = false;
let userRequestedScroll = false;

function getColumnCount() {
	const tracks = getComputedStyle(grid).gridTemplateColumns;
	return Math.max(1, tracks.split(/\s+/).filter(Boolean).length);
}

async function fetchNextPage() {
	if (loadingPage || !nextPageUrl) {
		return;
	}

	loadingPage = true;
	try {
		const response = await fetch(nextPageUrl);
		if (!response.ok) {
			throw new Error(`Character API returned ${response.status}`);
		}

		const data = await response.json();
		queuedCharacters.push(...(Array.isArray(data.items) ? data.items : []));
		nextPageUrl = data.links?.next || null;
	} finally {
		loadingPage = false;
	}
}

function createCharacterCard(character, index) {
	const card = document.createElement("article");
	card.className = "character-card";
	card.style.animationDelay = `${Math.min(index * 45, 270)}ms`;

	const title = document.createElement("h2");
	title.textContent = character.name || "Personaje desconocido";
	card.append(title);

	const frame = document.createElement("div");
	frame.className = "character-image-frame";
	const image = document.createElement("img");
	image.className = "character-image";
	image.src = character.image;
	image.alt = character.name ? `Imagen de ${character.name}` : "Imagen del personaje";
	image.loading = "lazy";
	image.decoding = "async";
	frame.append(image);
	card.append(frame);

	return card;
}

async function ensureQueuedCharacters(count) {
	while (queuedCharacters.length < count && nextPageUrl) {
		await fetchNextPage();
	}
}

async function appendRow() {
	const rowSize = getColumnCount();
	await ensureQueuedCharacters(rowSize);
	const characters = queuedCharacters.splice(0, rowSize);
	if (characters.length === 0) {
		status.textContent = "";
		return false;
	}

	const fragment = document.createDocumentFragment();
	characters.forEach((character, index) => {
		fragment.append(createCharacterCard(character, index));
	});
	grid.append(fragment);
	status.textContent = "";
	return true;
}

async function loadInitialRows() {
	try {
		const initialCount = getColumnCount() * INITIAL_ROWS;
		await ensureQueuedCharacters(initialCount);
		for (let row = 0; row < INITIAL_ROWS && queuedCharacters.length > 0; row += 1) {
			const added = await appendRow();
			if (!added) break;
		}
	} catch (error) {
		console.error("Unable to load characters:", error);
		status.textContent = "No se pudieron cargar los personajes.";
		retryButton.hidden = false;
	}
}

async function loadMoreOnScroll() {
	if (!userRequestedScroll || loadingPage) return;
	const distanceToBottom = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
	if (distanceToBottom > 140) return;

	userRequestedScroll = false;
	try {
		await appendRow();
	} catch (error) {
		console.error("Unable to load more characters:", error);
		status.textContent = "No se pudieron cargar más personajes.";
		retryButton.hidden = false;
	}
}

function requestMoreOnScroll() {
	userRequestedScroll = true;
	loadMoreOnScroll();
}

retryButton.addEventListener("click", async () => {
	retryButton.hidden = true;
	status.textContent = "Cargando personajes...";
	if (grid.children.length === 0) {
		await loadInitialRows();
		return;
	}

	userRequestedScroll = true;
	await loadMoreOnScroll();
});

window.addEventListener("scroll", loadMoreOnScroll, { passive: true });
window.addEventListener("wheel", requestMoreOnScroll, { passive: true });
window.addEventListener("touchmove", requestMoreOnScroll, { passive: true });
window.addEventListener("keydown", (event) => {
	if (["ArrowDown", "PageDown", " "].includes(event.key)) requestMoreOnScroll();
});

loadInitialRows();
