function createCharacterCard(character, index, openCard) {
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
	details.append(frame);
	card.append(details);

	card.addEventListener("click", () => openCard(card, character));
	card.addEventListener("keydown", (event) => {
		if (event.target !== card) return;
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			openCard(card, character);
		}
	});

	return card;
}

export function initializeCards({ grid, status, retryButton, characterLoader, openCard }) {
	const initialRows = 2;
	let userRequestedScroll = false;

	function getColumnCount() {
		const tracks = getComputedStyle(grid).gridTemplateColumns;
		return Math.max(1, tracks.split(/\s+/).filter(Boolean).length);
	}

	async function appendRow() {
		const rowSize = getColumnCount();
		const characters = await characterLoader.takeCharacters(rowSize);
		if (characters.length === 0) {
			status.textContent = "";
			return false;
		}

		const fragment = document.createDocumentFragment();
		characters.forEach((character, index) => {
			fragment.append(createCharacterCard(character, index, openCard));
		});
		grid.append(fragment);
		status.textContent = "";
		return true;
	}

	async function loadInitialRows() {
		try {
			for (let row = 0; row < initialRows; row += 1) {
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
		if (!userRequestedScroll || characterLoader.loading) return;
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
}
