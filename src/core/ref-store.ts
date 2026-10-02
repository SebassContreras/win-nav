import { ExitCodes, WinNavError } from "./errors.js";
import type { DesktopElement, DesktopSnapshot } from "./snapshot.js";

/**
 * In-memory manager for ephemeral element references (e1, e2, ...).
 * Ensures stale references are rejected immediately when snapshots are invalidated.
 */
export class RefStore {
  private currentSnapshot: DesktopSnapshot | null = null;
  private refMap: Map<string, DesktopElement> = new Map();

  /**
   * Assigns sequential ephemeral refs (e1, e2, ...) to elements lacking them.
   */
  static assignRefs(
    rawElements: Array<Omit<DesktopElement, "ref"> & { ref?: string }>
  ): DesktopElement[] {
    return rawElements.map((el, index) => ({
      ...el,
      ref: el.ref || `e${index + 1}`,
    }));
  }

  /**
   * Registers a new active snapshot and indexes all element refs.
   */
  setSnapshot(snapshot: DesktopSnapshot): void {
    this.currentSnapshot = snapshot;
    this.refMap.clear();

    for (const el of snapshot.elements) {
      if (el.ref) {
        this.refMap.set(el.ref, el);
      }
    }
  }

  /**
   * Retrieves the currently active snapshot, or null if none is active.
   */
  getSnapshot(): DesktopSnapshot | null {
    return this.currentSnapshot;
  }

  /**
   * Retrieves the active snapshot ID.
   */
  getSnapshotId(): string | null {
    return this.currentSnapshot?.snapshotId ?? null;
  }

  /**
   * Resolves an ephemeral reference.
   * Throws WinNavError with ExitCodes.STALE_REF if the snapshot is invalidated
   * or the provided snapshotId does not match the active one.
   */
  resolveRef(ref: string, expectedSnapshotId?: string): DesktopElement {
    if (!this.currentSnapshot) {
      throw new WinNavError(
        ExitCodes.STALE_REF,
        `No active snapshot in RefStore. Snapshot must be taken before using ref '${ref}'.`,
        { ref }
      );
    }

    if (
      expectedSnapshotId &&
      expectedSnapshotId !== this.currentSnapshot.snapshotId
    ) {
      throw new WinNavError(
        ExitCodes.STALE_REF,
        `Snapshot ref '${ref}' belongs to expired snapshot '${expectedSnapshotId}'. Active snapshot is '${this.currentSnapshot.snapshotId}'.`,
        {
          ref,
          expectedSnapshotId,
          activeSnapshotId: this.currentSnapshot.snapshotId,
        }
      );
    }

    const element = this.refMap.get(ref);
    if (!element) {
      throw new WinNavError(
        ExitCodes.STALE_REF,
        `Element ref '${ref}' not found in active snapshot '${this.currentSnapshot.snapshotId}'.`,
        { ref, activeSnapshotId: this.currentSnapshot.snapshotId }
      );
    }

    return element;
  }

  /**
   * Invalidates current references following any mutating action.
   */
  invalidate(reason?: string): void {
    this.currentSnapshot = null;
    this.refMap.clear();
  }
}

/** Global default RefStore instance */
export const defaultRefStore = new RefStore();
