const API_URL = "https://dragonball-api.com/api/characters";
const API_LIMIT = 10;
const INITIAL_ROWS = 2;

const grid = document.querySelector(".cards-grid");
const status = document.querySelector(".loading-status");
const retryButton = document.querySelector(".retry-button");
const main = document.querySelector(".main-container");
const backdrop = document.createElement("div");
backdrop.className = "card-backdrop";
backdrop.hidden = true;
backdrop.setAttribute("aria-hidden", "true");
document.body.append(backdrop);

let nextPageUrl = `${API_URL}?page=1&limit=${API_LIMIT}`;
let queuedCharacters = [];
let loadingPage = false;
let userRequestedScroll = false;
let activeCard = null;
let activePlaceholder = null;
let previousFocus = null;
let previousBodyOverflow = "";
let previousBodyPaddingRight = "";
let closeTimer = null;

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
	card.tabIndex = 0;
	card.setAttribute("role", "button");
	card.setAttribute("aria-haspopup", "dialog");

	const header = document.createElement("div");
	header.className = "character-card-header";
	const title = document.createElement("h2");
	title.textContent = character.name || "Personaje desconocido";
	header.append(title);

	const stats = document.createElement("div");
	stats.className = "character-stats";
	const ki = document.createElement("span");
	ki.textContent = `Ki: ${character.ki ?? "Desconocido"}`;
	const maxKi = document.createElement("span");
	maxKi.textContent = `Max Ki: ${character.maxKi ?? "Desconocido"}`;
	stats.append(ki, maxKi);
	header.append(stats);
	card.append(header);

	const details = document.createElement("div");
	details.className = "character-details";
	const frame = document.createElement("div");
	frame.className = "character-image-frame";
	const image = document.createElement("img");
	image.className = "character-image";
	image.src = character.image;
	image.alt = character.name ? `Imagen de ${character.name}` : "Imagen del personaje";
	image.loading = "lazy";
	image.decoding = "async";
	frame.append(image);
	const description = document.createElement("p");
	description.className = "character-description";
	description.textContent = character.description || "Sin descripción disponible.";
	details.append(frame, description);
	card.append(details);

	const closeButton = document.createElement("button");
	closeButton.className = "card-close-button";
	closeButton.type = "button";
	closeButton.setAttribute("aria-label", "Cerrar detalles");
	closeButton.textContent = "×";
	closeButton.addEventListener("click", (event) => {
		event.stopPropagation();
		closeCharacterCard();
	});
	card.append(closeButton);

	card.addEventListener("click", () => openCharacterCard(card));
	card.addEventListener("keydown", (event) => {
		if (event.target !== card || activeCard) return;
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			openCharacterCard(card);
		}
	});

	return card;
}

function getExpandedCardRect() {
	const mainRect = main.getBoundingClientRect();
	const compactViewport = window.innerWidth <= 700;
	const width = compactViewport
		? Math.max(0, mainRect.width - 32)
		: Math.min(720, mainRect.width / 2 - 36);
	const height = compactViewport
		? Math.max(0, window.innerHeight - 116)
		: Math.min(window.innerHeight - 120, Math.max(320, window.innerHeight * 0.72));
	const left = compactViewport
		? mainRect.left + 16
		: mainRect.left + mainRect.width / 2 + 12;
	const top = compactViewport
		? 100
		: 84 + (window.innerHeight - 84 - height) / 2;
	return { left, top, width, height };
}

function setCardRect(card, rect) {
	card.style.left = `${rect.left}px`;
	card.style.top = `${rect.top}px`;
	card.style.width = `${rect.width}px`;
	card.style.height = `${rect.height}px`;
}

function openCharacterCard(card) {
	if (activeCard) return;
	const originalRect = card.getBoundingClientRect();
	activeCard = card;
	previousFocus = document.activeElement;
	previousBodyOverflow = document.body.style.overflow;
	previousBodyPaddingRight = document.body.style.paddingRight;
	const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
	if (scrollbarWidth > 0) {
		const bodyPaddingRight = Number.parseFloat(getComputedStyle(document.body).paddingRight) || 0;
		document.body.style.paddingRight = `${bodyPaddingRight + scrollbarWidth}px`;
	}
	document.body.style.overflow = "hidden";

	activePlaceholder = document.createElement("div");
	activePlaceholder.className = "card-placeholder";
	activePlaceholder.setAttribute("aria-hidden", "true");
	activePlaceholder.style.width = `${originalRect.width}px`;
	activePlaceholder.style.height = `${originalRect.height}px`;
	card.parentNode.insertBefore(activePlaceholder, card);
	document.body.append(card);

	card.style.position = "fixed";
	card.style.zIndex = "6";
	card.style.margin = "0";
	card.style.animation = "none";
	card.style.opacity = "1";
	card.style.transform = "none";
	card.classList.add("has-opened");
	setCardRect(card, originalRect);
	card.setAttribute("role", "dialog");
	card.setAttribute("aria-modal", "true");
	card.setAttribute("aria-label", card.querySelector("h2").textContent);
	card.removeAttribute("aria-haspopup");
	card.classList.add("is-expanded");
	backdrop.hidden = false;
	requestAnimationFrame(() => {
		backdrop.classList.add("is-visible");
		setCardRect(card, getExpandedCardRect());
		card.querySelector(".card-close-button").focus();
	});
}

function closeCharacterCard() {
	if (!activeCard || activeCard.classList.contains("is-closing")) return;
	const card = activeCard;
	const targetRect = activePlaceholder.getBoundingClientRect();
	const currentRect = card.getBoundingClientRect();
	setCardRect(card, currentRect);
	card.getBoundingClientRect();
	card.classList.add("is-closing");
	card.classList.remove("is-expanded");
	setCardRect(card, targetRect);
	backdrop.classList.remove("is-visible");
	if (previousFocus instanceof HTMLElement) previousFocus.focus();

	const finishClosing = () => {
		if (activeCard !== card) return;
		clearTimeout(closeTimer);
		card.removeEventListener("transitionend", onTransitionEnd);
		activePlaceholder.parentNode.insertBefore(card, activePlaceholder);
		activePlaceholder.remove();
		card.classList.remove("is-closing");
		card.removeAttribute("aria-modal");
		card.removeAttribute("aria-label");
		card.setAttribute("role", "button");
		card.setAttribute("aria-haspopup", "dialog");
		card.removeAttribute("style");
		activeCard = null;
		activePlaceholder = null;
		document.body.style.overflow = previousBodyOverflow;
		document.body.style.paddingRight = previousBodyPaddingRight;
		backdrop.hidden = true;
	};
	const onTransitionEnd = (event) => {
		if (event.target !== card || !["top", "left", "width", "height"].includes(event.propertyName)) return;
		card.removeEventListener("transitionend", onTransitionEnd);
		finishClosing();
	};
	card.addEventListener("transitionend", onTransitionEnd);
	closeTimer = window.setTimeout(finishClosing, 500);
}

backdrop.addEventListener("click", closeCharacterCard);
document.addEventListener("keydown", (event) => {
	if (event.key === "Escape") closeCharacterCard();
});

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
