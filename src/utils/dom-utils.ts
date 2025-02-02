import { READER_CLASSES } from "./constants";

export class DOMUtils {
    static isValidBlock(block: Element): boolean {
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

    static getMarkdownPreviewView(): Element | null {
        return document.querySelector(".markdown-preview-view");
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
    }

    static highlightBlock(block: HTMLElement | null): void {
        if (!block || !this.isValidBlock(block)) return;

        this.clearHighlights();
        block.classList.add(READER_CLASSES.highlight);
    }

    static getCurrentBlockIndex(): number {
        const blocks = this.getValidBlocks();
        const currentBlock = document.querySelector(
            `.${READER_CLASSES.highlight}`
        ) as HTMLElement;
        return currentBlock ? blocks.indexOf(currentBlock) : -1;
    }
}
