import { ReaderSettings } from "../types/interfaces";

export const DEFAULT_SETTINGS: ReaderSettings = {
	previousBlockKeys: ["ArrowUp", "ArrowLeft"],
	nextBlockKeys: ["ArrowDown", "ArrowRight"],
};

export const READER_CLASSES = {
	highlight: "reader-highlight",
	blockButtons: "reader-mobile-nav",
	active: "reader-active",
} as const;

// Add DOM selectors
export const DOM_SELECTORS = {
	MARKDOWN_PREVIEW: ".markdown-preview-view",
	MARKDOWN_SECTION: ".markdown-preview-section > *",
	BLOCK_BUTTONS: ".reader-mobile-nav",
} as const;
