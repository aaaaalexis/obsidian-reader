import { setIcon } from "obsidian";
import { ReaderPlugin, NavigationDirection } from "../types/interfaces";
import { READER_CLASSES } from "../utils/constants";
import { DOMUtils } from "../utils/dom-utils";

export class MobileUI {
    private buttons: HTMLElement | null = null;

    constructor(private plugin: ReaderPlugin) {}

    create(): void {
        const readingView = DOMUtils.getMarkdownPreviewView();
        if (!readingView) return;

        this.remove();
        this.buttons = this.createButtonsContainer();
        readingView.appendChild(this.buttons);
    }

    remove(): void {
        this.buttons?.remove();
        this.buttons = null;
    }

    private createNavigationButton(direction: NavigationDirection, icon: string): HTMLElement {
        const button = document.createElement("button");
        button.addClass("clickable-icon");
        setIcon(button, icon);
        button.addEventListener("click", (evt) => {
            evt.stopPropagation();
            this.plugin.navigateBlocks(direction);
        });
        return button;
    }

    private createButtonsContainer(): HTMLElement {
        const container = document.createElement("div");
        container.addClass(READER_CLASSES.blockButtons);

        container.appendChild(this.createNavigationButton("previous", "chevron-up"));
        container.appendChild(this.createNavigationButton("next", "chevron-down"));

        return container;
    }
}
