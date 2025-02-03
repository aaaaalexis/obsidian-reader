import { DOM_SELECTORS, READER_CLASSES } from "./constants";

export class DOMUtils {
	static isValidBlock(block: Element): boolean {
		const hasElClass = Array.from(block.classList).some((cls) =>
			cls.startsWith("el-")
		);
		const hasModUI = block.classList.contains("mod-ui");
		const isHr = block.classList.contains("el-hr");
		return hasElClass && !hasModUI && !isHr;
	}

	static getValidBlocks(): HTMLElement[] {
		return Array.from(
			document.querySelectorAll(DOM_SELECTORS.MARKDOWN_SECTION)
		).filter((block) => this.isValidBlock(block)) as HTMLElement[];
	}

	static getMarkdownPreviewView(): Element | null {
		return document.querySelector(DOM_SELECTORS.MARKDOWN_PREVIEW);
	}

	static scrollToBlock(block: HTMLElement): void {
		const previewContainer = this.getMarkdownPreviewView();
		if (!previewContainer) return;

		const containerRect = previewContainer.getBoundingClientRect();
		const blockRect = block.getBoundingClientRect();
		const scrollTop =
			blockRect.top -
			containerRect.top -
			(containerRect.height - blockRect.height) / 2;

		previewContainer.scrollTo({
			top: (previewContainer as HTMLElement).scrollTop + scrollTop,
			behavior: "smooth",
		});
	}

	static clearHighlights(): void {
		document
			.querySelectorAll(`.${READER_CLASSES.highlight}`)
			.forEach((el) => el.classList.remove(READER_CLASSES.highlight));

		this.getMarkdownPreviewView()?.classList.remove(READER_CLASSES.active);
	}

	static highlightBlock(block: HTMLElement | null): void {
		if (!block || !this.isValidBlock(block)) return;

		this.clearHighlights();
		block.classList.add(READER_CLASSES.highlight);
		this.getMarkdownPreviewView()?.classList.add(READER_CLASSES.active);
	}

	static getCurrentBlockIndex(): number {
		const blocks = this.getValidBlocks();
		const currentBlock = document.querySelector(
			`.${READER_CLASSES.highlight}`
		) as HTMLElement;
		return currentBlock ? blocks.indexOf(currentBlock) : -1;
	}

	static isDOMReady(): boolean {
        return !!this.getMarkdownPreviewView() && 
               this.getValidBlocks().length > 0;
    }

    static async waitForDOM(maxAttempts: number = 10, interval: number = 100): Promise<boolean> {
        for (let i = 0; i < maxAttempts; i++) {
            if (this.isDOMReady()) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        return false;
    }
}
