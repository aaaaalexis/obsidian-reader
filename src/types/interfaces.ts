import { Plugin } from "obsidian";

export interface ReadingPosition {
	filePath: string;
	blockIndex: number;
	lastRead: number;
	enabled: boolean;
}

export interface ReaderSettings {
	previousBlockKeys: string[];
	nextBlockKeys: string[];
}

export type NavigationDirection = "previous" | "next";

// Extending the Plugin type for better type safety
export interface ReaderPlugin extends Plugin {
	settings: ReaderSettings;
	navigateBlocks(direction: NavigationDirection): void;
	saveSettings(): Promise<void>;
}
