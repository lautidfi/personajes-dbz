export function createCharacterModal(main, getCharacterDetails) {
	const backdrop = document.createElement("div");
	backdrop.className = "card-backdrop";
	backdrop.hidden = true;
	backdrop.setAttribute("aria-hidden", "true");
	document.body.append(backdrop);

	let activeCard = null;
	let activePlaceholder = null;
	let previousFocus = null;
	let previousScrollX = 0;
	let previousScrollY = 0;
	let previousBodyOverflow = "";
	let previousBodyPaddingRight = "";
	let baseImage = "";
	let baseImageAlt = "";
	let closeTimer = null;

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

	function addModalDetails(card, character) {
		const header = card.querySelector(".character-card-header");
		const details = card.querySelector(".character-details");

		const stats = document.createElement("div");
		stats.className = "character-stats";
		const ki = document.createElement("span");
		ki.textContent = `Ki: ${character.ki ?? "Desconocido"}`;
		const maxKi = document.createElement("span");
		maxKi.textContent = `Max Ki: ${character.maxKi ?? "Desconocido"}`;
		stats.append(ki, maxKi);
		header.append(stats);

		const infoPanel = document.createElement("div");
		infoPanel.className = "character-info-panel";
		const description = document.createElement("p");
		description.className = "character-description";
		description.textContent = character.description || "Sin descripción disponible.";
		infoPanel.append(description);

		const transformations = document.createElement("section");
		transformations.className = "character-transformations";
		transformations.hidden = true;
		transformations.setAttribute("aria-label", "Transformaciones");
		infoPanel.append(transformations);
		details.append(infoPanel);

		const closeButton = document.createElement("button");
		closeButton.className = "card-close-button";
		closeButton.type = "button";
		closeButton.setAttribute("aria-label", "Cerrar detalles");
		closeButton.textContent = "×";
		closeButton.addEventListener("click", (event) => {
			event.stopPropagation();
			closeCard();
		});
		card.append(closeButton);
		return { ki, maxKi, description, transformations };
	}

	function removeModalDetails(card) {
		card.querySelector(".character-stats")?.remove();
		card.querySelector(".character-info-panel")?.remove();
		card.querySelector(".card-close-button")?.remove();
	}

	function setCharacterImage(image, src, alt) {
		image.classList.remove("is-changing");
		void image.offsetWidth;
		image.src = src;
		image.alt = alt;
		image.classList.add("is-changing");
	}

	function preloadImage(src) {
		return new Promise((resolve) => {
			const preload = new Image();
			let settled = false;
			const finish = async (loaded) => {
				if (settled) return;
				settled = true;
				if (loaded && typeof preload.decode === "function") {
					try {
						await preload.decode();
					} catch {
						// The load event is sufficient when decode is unsupported or fails.
					}
				}
				resolve(loaded);
			};
			preload.addEventListener("load", () => finish(true), { once: true });
			preload.addEventListener("error", () => finish(false), { once: true });
			preload.src = src;
			if (preload.complete) void finish(preload.naturalWidth > 0);
		});
	}

	function renderTransformations(card, character, transformations) {
		const section = card.querySelector(".character-transformations");
		section.replaceChildren();
		if (!Array.isArray(transformations) || transformations.length === 0) {
			section.hidden = true;
			return;
		}

		section.hidden = false;
		const heading = document.createElement("h3");
		heading.textContent = "Transformaciones";
		const buttons = document.createElement("div");
		buttons.className = "transformation-buttons";
		const image = card.querySelector(".character-image");
		let latestSelection = 0;
		const options = [
			{ name: "Forma base", image: baseImage, alt: baseImageAlt },
			...transformations.filter((transformation) => transformation.image).map((transformation) => ({
				name: transformation.name || "Transformación",
				image: transformation.image,
				alt: `${character.name || "Personaje"} - ${transformation.name || "Transformación"}`,
			})),
		];

		options.forEach((option, index) => {
			const button = document.createElement("button");
			button.className = "transformation-button";
			button.type = "button";
			button.textContent = option.name;
			button.setAttribute("aria-pressed", String(index === 0));
			button.addEventListener("click", async () => {
				if (activeCard !== card || card.classList.contains("is-closing")) return;
				const selection = ++latestSelection;
				const loaded = await preloadImage(option.image);
				if (!loaded || selection !== latestSelection || activeCard !== card || card.classList.contains("is-closing")) return;
				buttons.querySelector('[aria-pressed="true"]')?.setAttribute("aria-pressed", "false");
				button.setAttribute("aria-pressed", "true");
				setCharacterImage(image, option.image, option.alt);
			});
			buttons.append(button);
		});
		section.append(heading, buttons);
	}

	async function loadCharacterDetails(card, character, details) {
		try {
			const fullCharacter = await getCharacterDetails(character.id);
			if (!fullCharacter || activeCard !== card) return;

			details.ki.textContent = `Ki: ${fullCharacter.ki ?? character.ki ?? "Desconocido"}`;
			details.maxKi.textContent = `Max Ki: ${fullCharacter.maxKi ?? character.maxKi ?? "Desconocido"}`;
			details.description.textContent = fullCharacter.description || character.description || "Sin descripción disponible.";
			const image = card.querySelector(".character-image");
			baseImage = fullCharacter.image || character.image || baseImage;
			baseImageAlt = character.name ? `Imagen de ${character.name}` : "Imagen del personaje";
			if (!card.querySelector('.transformation-button[aria-pressed="true"]') ||
				card.querySelector('.transformation-button[aria-pressed="true"]')?.textContent === "Forma base") {
				image.src = baseImage;
				image.alt = baseImageAlt;
			}
			renderTransformations(card, character, fullCharacter.transformations);
		} catch (error) {
			console.error("Unable to load character details:", error);
		}
	}

	function openCard(card, character) {
		if (activeCard) return;
		const originalRect = card.getBoundingClientRect();
		const details = addModalDetails(card, character);
		activeCard = card;
		const image = card.querySelector(".character-image");
		baseImage = image.src;
		baseImageAlt = image.alt;
		previousFocus = document.activeElement;
		previousScrollX = window.scrollX;
		previousScrollY = window.scrollY;
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
		void loadCharacterDetails(card, character, details);
	}

	function closeCard() {
		if (!activeCard || activeCard.classList.contains("is-closing")) return;
		const card = activeCard;
		const image = card.querySelector(".character-image");
		image.src = baseImage;
		image.alt = baseImageAlt;
		image.classList.remove("is-changing");
		const targetRect = activePlaceholder.getBoundingClientRect();
		const currentRect = card.getBoundingClientRect();
		setCardRect(card, currentRect);
		card.getBoundingClientRect();
		card.classList.add("is-closing");
		card.classList.remove("is-expanded");
		setCardRect(card, targetRect);
		backdrop.classList.remove("is-visible");

		const finishClosing = () => {
			if (activeCard !== card) return;
			clearTimeout(closeTimer);
			card.removeEventListener("transitionend", onTransitionEnd);
			activePlaceholder.parentNode.insertBefore(card, activePlaceholder);
			activePlaceholder.remove();
			removeModalDetails(card);
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
			if (previousFocus instanceof HTMLElement) {
				previousFocus.focus({ preventScroll: true });
			}
			window.scrollTo(previousScrollX, previousScrollY);
		};
		const onTransitionEnd = (event) => {
			if (event.target !== card || !["top", "left", "width", "height"].includes(event.propertyName)) return;
			card.removeEventListener("transitionend", onTransitionEnd);
			finishClosing();
		};
		card.addEventListener("transitionend", onTransitionEnd);
		closeTimer = window.setTimeout(finishClosing, 500);
	}

	backdrop.addEventListener("click", closeCard);
	document.addEventListener("keydown", (event) => {
		if (event.key === "Escape") closeCard();
	});

	return { openCard, closeCard };
}
