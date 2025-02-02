interface ReadingPosition {
	filePath: string;
	blockIndex: number;
	lastRead: number;
}

export class ProgressStorage {
	private static readonly STORAGE_FILE = "progress.json";

	static async savePosition(
		plugin: any,
		filePath: string,
		blockIndex: number
	): Promise<void> {
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
	}

	static async loadPosition(
		plugin: any,
		filePath: string
	): Promise<ReadingPosition | null> {
		const positions = await this.loadPositions(plugin);
		return positions[filePath] || null;
	}

	private static async loadPositions(
		plugin: any
	): Promise<Record<string, ReadingPosition>> {
		const path = this.getStoragePath(plugin);
		try {
			const data = await plugin.app.vault.adapter.read(path);
			return JSON.parse(data);
		} catch {
			return {};
		}
	}

	private static getStoragePath(plugin: any): string {
		return `${plugin.app.vault.configDir}/plugins/obsidian-reader/${this.STORAGE_FILE}`;
	}
}
