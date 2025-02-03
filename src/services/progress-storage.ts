import { ReaderPlugin } from "../types/interfaces";
import { ReadingPosition } from "../types/interfaces";
import { STORAGE } from "../utils/constants";

export class ProgressStorage {
	private static getStoragePath(plugin: ReaderPlugin): string {
		return `${plugin.app.vault.configDir}/${STORAGE.CONFIG_PATH}/${STORAGE.FILE_NAME}`;
	}

	private static async managePositions(
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
		blockIndex: number,
		enabled: boolean = true
	): Promise<void> {
		try {
			const positions = await this.managePositions(plugin);
			positions[filePath] = {
				filePath,
				blockIndex,
				lastRead: Date.now(),
				enabled,
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
			const positions = await this.managePositions(plugin);
			return positions[filePath] || null;
		} catch (error) {
			console.error("Failed to load reading position:", error);
			return null;
		}
	}
}
