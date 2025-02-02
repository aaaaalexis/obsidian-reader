import {
	App,
	Plugin,
	PluginSettingTab,
	Setting,
	Platform,
	setIcon,
	Menu,
} from "obsidian";
import { ProgressStorage } from "progressStorage";

interface ReaderSettings {
	previousBlockKeys: string[];
	nextBlockKeys: string[];
	isEnabled: boolean;
}

// Constants
const DEFAULT_SETTINGS: ReaderSettings = {
	previousBlockKeys: ["ArrowUp", "ArrowLeft"],
	nextBlockKeys: ["ArrowDown", "ArrowRight"],
	isEnabled: false,
};

const READER_CLASSES = {
	highlight: "reader-highlight",
	blockButtons: "reader-block-buttons",
	active: "reader-mode",
};

class BlockNavigator {
	private static isValidBlock(block: Element): boolean {
		const hasElClass = Array.from(block.classList).some((cls) =>
			cls.startsWith("el-")
		);
		const hasModUI = block.classList.contains("mod-ui");
		return hasElClass && !hasModUI;
	}

	static getValidBlocks(): HTMLElement[] {
		return Array.from(
			document.querySelectorAll(".markdown-preview-section > *")
		).filter((block) => this.isValidBlock(block)) as HTMLElement[];
	}

	static getCurrentBlockIndex(): number {
		const blocks = this.getValidBlocks();
		const currentBlock = document.querySelector(
			`.${READER_CLASSES.highlight}`
		) as HTMLElement;
		return currentBlock ? blocks.indexOf(currentBlock) : -1;
	}

	static clearHighlights(): void {
		document
			.querySelectorAll(`.${READER_CLASSES.highlight}`)
			.forEach((el) => el.classList.remove(READER_CLASSES.highlight));
	}

	static highlightBlock(block: HTMLElement | null): void {
		if (!block || !this.isValidBlock(block)) return;

		this.clearHighlights();
		block.classList.add(READER_CLASSES.highlight);
	}

	static scrollToBlock(block: HTMLElement): void {
		const previewContainer = document.querySelector(
			".markdown-preview-view"
		);
		if (!previewContainer) return;

		const containerRect = previewContainer.getBoundingClientRect();
		const blockRect = block.getBoundingClientRect();
		const scrollTop =
			blockRect.top -
			containerRect.top -
			(containerRect.height - blockRect.height) / 2;

		previewContainer.scrollTo({
			top: previewContainer.scrollTop + scrollTop,
			behavior: "smooth",
		});
	}

	static async restorePosition(plugin: any): Promise<void> {
		const activeFile = plugin.app.workspace.getActiveFile();
		if (!activeFile) return;

		const position = await ProgressStorage.loadPosition(
			plugin,
			activeFile.path
		);
		if (!position) return;

		const blocks = this.getValidBlocks();
		if (position.blockIndex < blocks.length) {
			const block = blocks[position.blockIndex];
			this.highlightBlock(block);
			this.scrollToBlock(block);
		}
	}

	static async savePosition(plugin: any): Promise<void> {
		const activeFile = plugin.app.workspace.getActiveFile();
		if (!activeFile) return;

		const currentIndex = this.getCurrentBlockIndex();
		if (currentIndex >= 0) {
			await ProgressStorage.savePosition(
				plugin,
				activeFile.path,
				currentIndex
			);
		}
	}
}

class MobileUI {
	private buttons: HTMLElement | null = null;

	constructor(private plugin: ReaderPlugin) {}

	create(): void {
		const readingView = document.querySelector(".markdown-preview-view");
		if (!readingView) return;

		this.remove();
		this.buttons = this.createButtonsContainer();
		readingView.appendChild(this.buttons);
	}

	remove(): void {
		this.buttons?.remove();
		this.buttons = null;
	}

	private createButtonsContainer(): HTMLElement {
		const container = document.createElement("div");
		container.addClass(READER_CLASSES.blockButtons);

		const createNavButton = (
			direction: "previous" | "next",
			icon: string
		) => {
			const button = document.createElement("button");
			button.addClass("clickable-icon");
			setIcon(button, icon);
			button.addEventListener("click", (evt) => {
				evt.stopPropagation();
				this.plugin.navigateBlocks(direction);
			});
			return button;
		};

		container.appendChild(createNavButton("previous", "chevron-up"));
		container.appendChild(createNavButton("next", "chevron-down"));

		return container;
	}
}

export default class ReaderPlugin extends Plugin {
	settings: ReaderSettings;
	private mobileUI: MobileUI;
	private isEnabled: boolean = false;

	async onload() {
		await this.loadSettings();
		this.isEnabled = this.settings.isEnabled;

		this.addMenuOption();
		this.addSettingTab(new ReaderSettingTab(this.app, this));
		setTimeout(() => {
			this.mobileUI = new MobileUI(this);
			if (this.isEnabled) {
				this.enableFunctionality();
			}
		}, 500);

		if (this.isEnabled) {
			this.enableFunctionality();
			setTimeout(() => {
				BlockNavigator.restorePosition(this);
			}, 500);
		}
	}

	private addMenuOption(): void {
		this.app.workspace.on("file-menu", (menu: Menu) => {
			menu.addItem((item) => {
				item.setTitle("Toggle Reader Mode")
					.setIcon("book-open-text")
					.setChecked(this.isEnabled)
					.onClick(async () => {
						this.isEnabled = !this.isEnabled;
						this.settings.isEnabled = this.isEnabled;
						await this.saveSettings();
						this.isEnabled
							? this.enableFunctionality()
							: this.disableFunctionality();
					});
			});
		});
	}

	private handleClick = async (evt: MouseEvent): Promise<void> => {
		const target = evt.target as HTMLElement;
		if (this.mobileUI && target.closest(`.${READER_CLASSES.blockButtons}`))
			return;

		const block = target.closest(".markdown-preview-section > *");
		BlockNavigator.highlightBlock(block as HTMLElement);
		await BlockNavigator.savePosition(this);
	};

	private handleKeydown = (evt: KeyboardEvent): void => {
		if (
			evt.target instanceof HTMLInputElement ||
			evt.target instanceof HTMLTextAreaElement
		)
			return;

		if (this.settings.previousBlockKeys.includes(evt.key)) {
			evt.preventDefault();
			this.navigateBlocks("previous");
		} else if (this.settings.nextBlockKeys.includes(evt.key)) {
			evt.preventDefault();
			this.navigateBlocks("next");
		}
	};

	navigateBlocks(direction: "previous" | "next"): void {
		const blocks = BlockNavigator.getValidBlocks();
		const currentIndex = BlockNavigator.getCurrentBlockIndex();

		const nextIndex =
			currentIndex === -1
				? 0
				: direction === "previous"
				? Math.max(0, currentIndex - 1)
				: Math.min(blocks.length - 1, currentIndex + 1);

		const nextBlock = blocks[nextIndex];
		if (nextBlock) {
			BlockNavigator.highlightBlock(nextBlock);
			BlockNavigator.scrollToBlock(nextBlock);
			BlockNavigator.savePosition(this);
		}
	}

	private enableFunctionality(): void {
		if (Platform.isMobile) {
			this.mobileUI.create();
		}
		document.addEventListener("click", this.handleClick);
		document.addEventListener("keydown", this.handleKeydown);
		document
			.querySelector(".markdown-preview-view")
			?.addClass(READER_CLASSES.active);
	}

	private disableFunctionality(): void {
		this.mobileUI.remove();
		document.removeEventListener("click", this.handleClick);
		document.removeEventListener("keydown", this.handleKeydown);
		BlockNavigator.clearHighlights();
		document
			.querySelector(".markdown-preview-view")
			?.removeClass(READER_CLASSES.active);
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

class ReaderSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: ReaderPlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		const createKeySetting = (
			name: string,
			desc: string,
			keys: string[],
			defaultKeys: string[]
		) => {
			new Setting(containerEl)
				.setName(name)
				.setDesc(desc)
				.addText((text) =>
					text.setValue(keys.join(",")).onChange(async (value) => {
						const newKeys = value
							.split(",")
							.map((k) => k.trim())
							.filter((k) => k.length > 0);
						keys.splice(0, keys.length, ...newKeys);
						await this.plugin.saveSettings();
					})
				)
				.addButton((button) =>
					button
						.setIcon("reset")
						.setTooltip("Reset to default")
						.onClick(async () => {
							keys.splice(0, keys.length, ...defaultKeys);
							await this.plugin.saveSettings();
							this.display();
						})
				);
		};

		createKeySetting(
			"Previous block keys",
			"Keys to move to previous block (comma-separated)",
			this.plugin.settings.previousBlockKeys,
			DEFAULT_SETTINGS.previousBlockKeys
		);

		createKeySetting(
			"Next block keys",
			"Keys to move to next block (comma-separated)",
			this.plugin.settings.nextBlockKeys,
			DEFAULT_SETTINGS.nextBlockKeys
		);
	}
}
