import { ReaderSettings } from "../types/interfaces";

export const DEFAULT_SETTINGS: ReaderSettings = {
	previousBlockKeys: ["ArrowUp", "ArrowLeft"],
	nextBlockKeys: ["ArrowDown", "ArrowRight"],
};

export const READER_CLASSES = {
	highlight: "reader-highlight",
	blockButtons: "reader-block-buttons",
	active: "reader-active",
} as const;

// Add these new constants
export const STORAGE = {
	FILE_NAME: "progress.json",
	CONFIG_PATH: "plugins/obsidian-reader",
} as const;

// Add DOM selectors
export const DOM_SELECTORS = {
	MARKDOWN_PREVIEW: ".markdown-preview-view",
	MARKDOWN_SECTION: ".markdown-preview-section > *",
	BLOCK_BUTTONS: ".reader-block-buttons",
} as const;
