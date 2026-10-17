import { initializeCards } from "./cards.js";
import { createCharacterModal } from "./modal.js";
import { createCharacterLoader } from "./characters-api.js";

const main = document.querySelector(".main-container");
const characterLoader = createCharacterLoader();
const modal = createCharacterModal(main, characterLoader.getCharacterDetails);

initializeCards({
	grid: document.querySelector(".cards-grid"),
	status: document.querySelector(".loading-status"),
	retryButton: document.querySelector(".retry-button"),
	characterLoader,
	openCard: modal.openCard,
});
