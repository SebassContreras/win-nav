/**
 * Desktop snapshot contracts and element representations.
 */
import fs from "node:fs/promises";
import path from "node:path";

export interface BoundingRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DesktopElement {
  ref: string;
  role: string;
  name: string;
  automationId: string;
  className?: string;
  value?: string;
  isEnabled: boolean;
  isOffscreen?: boolean;
  isPassword?: boolean;
  boundingRect?: BoundingRectangle;
  handle?: number | string;
  frameworkId?: string;
}

export interface DesktopSnapshot {
  snapshotId: string;
  timestamp: string;
  processId: number;
  processName?: string;
  windowTitle: string;
  windowHandle?: number | string;
  elements: DesktopElement[];
}

export const DEFAULT_SNAPSHOT_DIR = ".agent";
export const DEFAULT_SNAPSHOT_FILENAME = "snapshot.json";

export class SnapshotManager {
  private readonly defaultPath: string;

  constructor(baseDir: string = process.cwd()) {
    this.defaultPath = path.join(baseDir, DEFAULT_SNAPSHOT_DIR, DEFAULT_SNAPSHOT_FILENAME);
  }

  getSnapshotPath(): string {
    return this.defaultPath;
  }

  /**
   * Sanitizes snapshot elements, ensuring password fields are masked.
   */
  sanitize(snapshot: DesktopSnapshot): DesktopSnapshot {
    return {
      ...snapshot,
      elements: snapshot.elements.map((el) => {
        if (el.isPassword && el.value !== undefined) {
          return { ...el, value: "***" };
        }
        return el;
      }),
    };
  }

  /**
   * Persists snapshot to disk, ensuring parent directory exists.
   */
  async saveSnapshot(
    snapshot: DesktopSnapshot,
    targetFile: string = this.defaultPath
  ): Promise<void> {
    const sanitized = this.sanitize(snapshot);
    const dir = path.dirname(targetFile);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(targetFile, JSON.stringify(sanitized, null, 2), "utf-8");
  }

  /**
   * Reads snapshot from disk. Returns null if file does not exist.
   */
  async loadSnapshot(
    targetFile: string = this.defaultPath
  ): Promise<DesktopSnapshot | null> {
    try {
      const content = await fs.readFile(targetFile, "utf-8");
      return JSON.parse(content) as DesktopSnapshot;
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }
      throw err;
    }
  }

  /**
   * Checks whether the snapshot is still within its validity window.
   */
  isFresh(snapshot: DesktopSnapshot, maxAgeMs: number = 60_000): boolean {
    const snapshotTime = new Date(snapshot.timestamp).getTime();
    if (isNaN(snapshotTime)) return false;
    return Date.now() - snapshotTime <= maxAgeMs;
  }
}
