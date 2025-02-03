import { Plugin, Platform } from "obsidian";
import { ReaderSettings, NavigationDirection } from "./types/interfaces";
import { DEFAULT_SETTINGS, READER_CLASSES } from "./utils/constants";
import { BlockNavigator } from "./services/block-navigator";
import { MobileUI } from "./ui/mobile-ui";
import { ReaderSettingTab } from "./ui/settings-tab";
import { DOMUtils } from "./utils/dom-utils";

export default class ReaderPlugin extends Plugin {
	settings: ReaderSettings;
	private mobileUI: MobileUI;
	private blockNavigator: BlockNavigator;

	async onload() {
		await this.loadSettings();
		setTimeout(() => {
			this.initializePlugin();
		}, 500);
	}

	private async initializePlugin() {
		this.blockNavigator = new BlockNavigator(this);
		this.mobileUI = new MobileUI(this);

		this.registerPluginFeatures();
		await this.enableFunctionality();
		this.restoreReadingPosition();
	}

	private registerPluginFeatures(): void {
		this.addSettingTab(new ReaderSettingTab(this.app, this));
	}

	private handleKeydown = (evt: KeyboardEvent): void => {
		if (this.shouldIgnoreKeyEvent(evt)) return;

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
		if (Platform.isMobile) {
			this.mobileUI.create();
		}

		document.addEventListener(
			"click",
			this.blockNavigator.handleClick.bind(this.blockNavigator)
		);
		document.addEventListener("keydown", this.handleKeydown);

		const previewView = DOMUtils.getMarkdownPreviewView();
		previewView?.addClass(READER_CLASSES.active);
	}

	private disableFunctionality(): void {
		this.mobileUI.remove();
		document.removeEventListener(
			"click",
			this.blockNavigator.handleClick.bind(this.blockNavigator)
		);
		document.removeEventListener("keydown", this.handleKeydown);

		this.blockNavigator.clearHighlights();

		const previewView = DOMUtils.getMarkdownPreviewView();
		previewView?.removeClass(READER_CLASSES.active);
	}

	private async restoreReadingPosition(): Promise<void> {
		this.blockNavigator.restorePosition();
	}

	async onunload() {
		this.disableFunctionality();
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
