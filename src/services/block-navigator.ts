import { ReaderPlugin, NavigationDirection } from "../types/interfaces";
import { ProgressStorage } from "./progress-storage";
import { DOMUtils } from "../utils/dom-utils";
import { READER_CLASSES } from "../utils/constants";
import { setIcon, Platform } from "obsidian";

export class BlockNavigator {
	constructor(private plugin: ReaderPlugin) {}
	private enabled: boolean = false;

	async navigateToBlock(direction: NavigationDirection): Promise<void> {
		if (!this.enabled) return;

		const blocks = DOMUtils.getValidBlocks();
		const currentIndex = DOMUtils.getCurrentBlockIndex();

		const nextIndex =
			currentIndex === -1
				? 0
				: direction === "previous"
				? Math.max(0, currentIndex - 1)
				: Math.min(blocks.length - 1, currentIndex + 1);

		const nextBlock = blocks[nextIndex];
		if (nextBlock) {
			DOMUtils.highlightBlock(nextBlock);
			DOMUtils.scrollToBlock(nextBlock);
			await this.savePosition();
		}
	}

	async handleClick(evt: MouseEvent): Promise<void> {
		const target = evt.target as HTMLElement;
		if (target.closest(".reader-mobile-nav")) return;

		const block = target.closest(".markdown-preview-section > *") as HTMLElement;

		// Disable if clicking outside of valid blocks
		if (!block && this.enabled) {
			await this.disable();
			return;
		}
		if (!block) return;

		const isCurrentlyHighlighted = block.classList.contains(READER_CLASSES.highlight);

		// If reader is enabled
		if (this.enabled) {
			if (isCurrentlyHighlighted) {
				// Disable on single click of highlighted block
				await this.disable();
			} else {
				// Switch to new block on single click
				await this.enable(block);
			}
			return;
		}
	
		// If reader is disabled, require double click to enable
		if (evt.detail === 2) {
			await this.enable(block);
		}
	}

	async restorePosition(): Promise<void> {
		const activeFile = this.plugin.app.workspace.getActiveFile();
		if (!activeFile) return;

		const position = await ProgressStorage.loadPosition(
			this.plugin,
			activeFile.path
		);

		if (!position) {
			await ProgressStorage.savePosition(
				this.plugin,
				activeFile.path,
				-1,
				false
			);
			this.enabled = false;
			DOMUtils.clearHighlights();
			return;
		}

		if (!position.enabled) {
			this.enabled = false;
			DOMUtils.clearHighlights();
			return;
		}

		// Wait for DOM to be ready
		const isDOMReady = await DOMUtils.waitForDOM();
		if (!isDOMReady) {
			console.debug("DOM not ready after maximum attempts");
			return;
		}

		this.enabled = true;
		const blocks = DOMUtils.getValidBlocks();
		if (position.blockIndex >= 0 && position.blockIndex < blocks.length) {
			const block = blocks[position.blockIndex];
			DOMUtils.highlightBlock(block);
			DOMUtils.scrollToBlock(block);
			if (Platform.isMobile) {
				this.createMobileUI();
			}
		}
	}
	private async savePosition(): Promise<void> {
		const activeFile = this.plugin.app.workspace.getActiveFile();
		if (!activeFile) return;

		const currentIndex = DOMUtils.getCurrentBlockIndex();
		if (currentIndex >= 0) {
			await ProgressStorage.savePosition(
				this.plugin,
				activeFile.path,
				currentIndex
			);
		}
	}

	private async enable(block: HTMLElement): Promise<void> {
		this.enabled = true;
		DOMUtils.highlightBlock(block);
		DOMUtils.scrollToBlock(block);
		if (Platform.isMobile) {
			this.createMobileUI();
		}
		await this.savePosition();
	}

	async disable(): Promise<void> {
		this.enabled = false;
		DOMUtils.clearHighlights();
		this.removeMobileUI();
		const activeFile = this.plugin.app.workspace.getActiveFile();
		if (activeFile) {
			await ProgressStorage.savePosition(
				this.plugin,
				activeFile.path,
				-1,
				false
			);
		}
	}

	createMobileUI(): void {
		const readingView = DOMUtils.getMarkdownPreviewView();
		if (!readingView) return;

		this.removeMobileUI();
		const buttons = this.createButtonsContainer();
		readingView.appendChild(buttons);
	}

	removeMobileUI(): void {
		const buttons = document.querySelector(
			`.${READER_CLASSES.blockButtons}`
		);
		buttons?.remove();
	}

	private createNavigationButton(
		direction: NavigationDirection | "scroll",
		icon: string
	): HTMLElement {
		const button = document.createElement("button");
		button.addClass("clickable-icon");
		setIcon(button, icon);
		button.addEventListener("click", async (evt) => {
			evt.stopPropagation();
			if (direction === "scroll") {
				const highlightedBlock = document.querySelector(
					`.${READER_CLASSES.highlight}`
				);
				if (highlightedBlock) {
					DOMUtils.scrollToBlock(highlightedBlock as HTMLElement);
				}
			} else {
				this.plugin.navigateBlocks(direction);
			}
		});
		return button;
	}

	private createButtonsContainer(): HTMLElement {
		const container = document.createElement("div");
		container.addClass(READER_CLASSES.blockButtons);

		container.appendChild(
			this.createNavigationButton("previous", "chevron-up")
		);
		container.appendChild(this.createNavigationButton("scroll", "circle"));
		container.appendChild(
			this.createNavigationButton("next", "chevron-down")
		);

		return container;
	}
}
