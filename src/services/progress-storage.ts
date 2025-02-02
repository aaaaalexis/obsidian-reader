import { ReaderPlugin } from "../types/interfaces";
import { ReadingPosition } from "../types/interfaces";
import { STORAGE_FILE } from "../utils/constants";

export class ProgressStorage {
    private static getStoragePath(plugin: ReaderPlugin): string {
        return `${plugin.app.vault.configDir}/plugins/obsidian-reader/${STORAGE_FILE}`;
    }

    private static async loadPositions(
        plugin: ReaderPlugin
    ): Promise<Record<string, ReadingPosition>> {
        const path = this.getStoragePath(plugin);
        try {
            const data = await plugin.app.vault.adapter.read(path);
            return JSON.parse(data);
        } catch {
            return {};
        }
    }

    static async savePosition(
        plugin: ReaderPlugin,
        filePath: string,
        blockIndex: number
    ): Promise<void> {
        try {
            const positions = await this.loadPositions(plugin);
            positions[filePath] = {
                filePath,
                blockIndex,
                lastRead: Date.now(),
            };
            await plugin.app.vault.adapter.write(
                this.getStoragePath(plugin),
                JSON.stringify(positions, null, 2)
            );
        } catch (error) {
            console.error("Failed to save reading position:", error);
        }
    }

    static async loadPosition(
        plugin: ReaderPlugin,
        filePath: string
    ): Promise<ReadingPosition | null> {
        try {
            const positions = await this.loadPositions(plugin);
            return positions[filePath] || null;
        } catch (error) {
            console.error("Failed to load reading position:", error);
            return null;
        }
    }
}
