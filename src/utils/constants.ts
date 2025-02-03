import { ReaderSettings } from "../types/interfaces";

export const DEFAULT_SETTINGS: ReaderSettings = {
    previousBlockKeys: ["ArrowUp", "ArrowLeft"],
    nextBlockKeys: ["ArrowDown", "ArrowRight"],
};

export const READER_CLASSES = {
    highlight: "reader-highlight",
    blockButtons: "reader-block-buttons",
    enabled: "reader-mode",
    active: "reader-active",
} as const;

export const STORAGE_FILE = "progress.json";
