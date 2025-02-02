import { App, PluginSettingTab, Setting } from "obsidian";
import { ReaderPlugin } from "../types/interfaces";
import { DEFAULT_SETTINGS } from "../utils/constants";

export class ReaderSettingTab extends PluginSettingTab {
    constructor(app: App, private plugin: ReaderPlugin) {
        super(app, plugin);
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        this.createKeySetting(
            "Previous block keys",
            "Keys to move to previous block (comma-separated)",
            this.plugin.settings.previousBlockKeys,
            DEFAULT_SETTINGS.previousBlockKeys
        );

        this.createKeySetting(
            "Next block keys",
            "Keys to move to next block (comma-separated)",
            this.plugin.settings.nextBlockKeys,
            DEFAULT_SETTINGS.nextBlockKeys
        );
    }

    private createKeySetting(
        name: string,
        desc: string,
        keys: string[],
        defaultKeys: string[]
    ): void {
        new Setting(this.containerEl)
            .setName(name)
            .setDesc(desc)
            .addText((text) =>
                text
                    .setValue(keys.join(","))
                    .onChange(async (value) => {
                        const newKeys = this.parseKeyInput(value);
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
    }

    private parseKeyInput(value: string): string[] {
        return value
            .split(",")
            .map((k) => k.trim())
            .filter((k) => k.length > 0);
    }
}
