import { Plugin, Platform, Menu } from "obsidian";
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
	private isEnabled: boolean = false;

	async onload() {
		await this.loadSettings();
		setTimeout(() => {
			this.initializePlugin();
		}, 500);
	}

	private async initializePlugin() {
		this.blockNavigator = new BlockNavigator(this);
		this.mobileUI = new MobileUI(this);

		this.isEnabled = this.settings.isEnabled;

		this.registerPluginFeatures();

		if (this.isEnabled) {
			await this.enableFunctionality();
			this.restoreReadingPosition();
		}
	}

	private registerPluginFeatures(): void {
		this.addSettingTab(new ReaderSettingTab(this.app, this));
		this.registerEvent(
			this.app.workspace.on("file-menu", this.addMenuOption.bind(this))
		);
	}

	private addMenuOption(menu: Menu): void {
		menu.addItem((item) => {
			item.setTitle("Toggle Reader Mode")
				.setIcon("book-open-text")
				.setChecked(this.isEnabled)
				.onClick(async () => {
					await this.toggleReaderMode();
				});
		});
	}

	private async toggleReaderMode(): Promise<void> {
		this.isEnabled = !this.isEnabled;
		this.settings.isEnabled = this.isEnabled;
		await this.saveSettings();

		if (this.isEnabled) {
			await this.enableFunctionality();
		} else {
			this.disableFunctionality();
		}
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
