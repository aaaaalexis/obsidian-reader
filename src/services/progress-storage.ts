import { ReaderPlugin } from "../types/interfaces";
import { ReadingPosition } from "../types/interfaces";

export class ProgressStorage {
  static async savePosition(plugin: ReaderPlugin, filePath: string, blockIndex: number, enabled: boolean = true): Promise<void> {
    try {
      const data = (await plugin.loadData()) || {};
      const positions = data.positions || {};

      positions[filePath] = {
        filePath,
        blockIndex,
        lastRead: Date.now(),
        enabled,
      };

      await plugin.saveData({ ...data, positions });
    } catch (error) {
      console.error("Failed to save reading position:", error);
    }
  }

  static async loadPosition(plugin: ReaderPlugin, filePath: string): Promise<ReadingPosition | null> {
    try {
      const data = (await plugin.loadData()) || {};
      const positions = data.positions || {};
      return positions[filePath] || null;
    } catch (error) {
      console.error("Failed to load reading position:", error);
      return null;
    }
  }
}
