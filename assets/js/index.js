import { initializeCards } from "./cards.js";
import { createCharacterModal } from "./modal.js";
import { createCharacterLoader } from "./characters-api.js";

const main = document.querySelector(".main-container");
const modal = createCharacterModal(main);
const characterLoader = createCharacterLoader();

initializeCards({
	grid: document.querySelector(".cards-grid"),
	status: document.querySelector(".loading-status"),
	retryButton: document.querySelector(".retry-button"),
	characterLoader,
	openCard: modal.openCard,
});
