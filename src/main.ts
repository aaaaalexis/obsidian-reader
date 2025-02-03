import { Plugin, Platform } from "obsidian";
import { ReaderSettings, NavigationDirection } from "./types/interfaces";
import { DEFAULT_SETTINGS, READER_CLASSES } from "./utils/constants";
import { BlockNavigator } from "./services/block-navigator";
import { ReaderSettingTab } from "./ui/settings-tab";

export default class ReaderPlugin extends Plugin {
	settings: ReaderSettings;
	private blockNavigator: BlockNavigator;

	async onload() {
		await this.loadSettings();
		this.blockNavigator = new BlockNavigator(this);
		this.addSettingTab(new ReaderSettingTab(this.app, this));
		await this.enableFunctionality();

		// Restore position on initial load
		this.blockNavigator.restorePosition();

		// Restore (or initialize) reading progress on file-open
		this.registerEvent(
			this.app.workspace.on("file-open", () => {
				this.blockNavigator.restorePosition();
			})
		);
	}

	private handleKeydown = (evt: KeyboardEvent): void => {
		if (this.shouldIgnoreKeyEvent(evt)) return;

		// Only handle keys if there's a highlighted block
		const hasHighlight = document.querySelector(
			`.${READER_CLASSES.highlight}`
		);
		if (!hasHighlight) return;

		if (this.settings.previousBlockKeys.includes(evt.key)) {
			evt.preventDefault();
			this.navigateBlocks("previous");
		} else if (this.settings.nextBlockKeys.includes(evt.key)) {
			evt.preventDefault();
			this.navigateBlocks("next");
		}
	};

	private shouldIgnoreKeyEvent(evt: KeyboardEvent): boolean {
		return (
			evt.target instanceof HTMLInputElement ||
			evt.target instanceof HTMLTextAreaElement
		);
	}

	navigateBlocks(direction: NavigationDirection): void {
		this.blockNavigator.navigateToBlock(direction);
	}

	private async enableFunctionality(): Promise<void> {
		document.addEventListener(
			"click",
			this.blockNavigator.handleClick.bind(this.blockNavigator)
		);
		document.addEventListener("keydown", this.handleKeydown);
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
