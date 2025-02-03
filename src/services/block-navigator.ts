import { ReaderPlugin, NavigationDirection } from "../types/interfaces";
import { ProgressStorage } from "./progress-storage";
import { DOMUtils } from "../utils/dom-utils";

export class BlockNavigator {
	constructor(private plugin: ReaderPlugin) {}

	async navigateToBlock(direction: NavigationDirection): Promise<void> {
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
		if (target.closest(".reader-block-buttons")) return;

		const block = target.closest(".markdown-preview-section > *");
		DOMUtils.highlightBlock(block as HTMLElement);
		DOMUtils.scrollToBlock(block as HTMLElement);

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
}
