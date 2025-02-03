import { ReaderPlugin, NavigationDirection } from "../types/interfaces";
import { ProgressStorage } from "./progress-storage";
import { DOMUtils } from "../utils/dom-utils";
import { READER_CLASSES } from "../utils/constants";
import { setIcon } from "obsidian";

export class BlockNavigator {
	constructor(private plugin: ReaderPlugin) {}

	async navigateToBlock(direction: NavigationDirection): Promise<void> {
		const blocks = DOMUtils.getValidBlocks();
		let currentIndex = DOMUtils.getCurrentBlockIndex();

		if (currentIndex === -1) {
			const activeFile = this.plugin.app.workspace.getActiveFile();
			if (activeFile) {
				const position = await ProgressStorage.loadPosition(
					this.plugin,
					activeFile.path
				);
				if (position) {
					currentIndex = position.blockIndex;
				}
			}
		}

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
		if (target.closest(".reader-block-buttons")) return;

		const block = target.closest(
			".markdown-preview-section > *"
		) as HTMLElement;
		if (!block) return;

		const isCurrentlyHighlighted = block.classList.contains(
			READER_CLASSES.highlight
		);

		if (isCurrentlyHighlighted) {
			DOMUtils.clearHighlights();
		} else {
			DOMUtils.highlightBlock(block);
			DOMUtils.scrollToBlock(block);
		}

		await this.savePosition();
	}

	async restorePosition(): Promise<void> {
		const activeFile = this.plugin.app.workspace.getActiveFile();
		if (!activeFile) return;

		const position = await ProgressStorage.loadPosition(
			this.plugin,
			activeFile.path
		);
		if (!position) return;

		const blocks = DOMUtils.getValidBlocks();
		if (position.blockIndex < blocks.length) {
			const block = blocks[position.blockIndex];
			DOMUtils.highlightBlock(block);
			DOMUtils.scrollToBlock(block);
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

	clearHighlights(): void {
		DOMUtils.clearHighlights();
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
				} else {
					const activeFile =
						this.plugin.app.workspace.getActiveFile();
					if (activeFile) {
						const position = await ProgressStorage.loadPosition(
							this.plugin,
							activeFile.path
						);
						if (position) {
							const blocks = DOMUtils.getValidBlocks();
							if (position.blockIndex < blocks.length) {
								const block = blocks[position.blockIndex];
								DOMUtils.highlightBlock(block);
								DOMUtils.scrollToBlock(block);
							}
						}
					}
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
