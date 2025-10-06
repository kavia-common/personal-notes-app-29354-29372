import { Injectable } from '@angular/core';

/**
 * StorageService abstracts access to localStorage providing JSON parse/stringify
 * with graceful error handling and a no-op fallback if storage is unavailable.
 */
@Injectable({
  providedIn: 'root',
})
export class StorageService {
  // PUBLIC_INTERFACE
  /** Key used to store notes in localStorage. */
  /** This is a public constant users may import if needed. */
  static readonly NOTES_KEY = 'notes.v1';

  /**
   * Resolve a safe reference to localStorage if available in this environment.
   * Uses globalThis for better compatibility with SSR and different runtimes.
   */
  private get storage(): any /* Storage | null */ {
    try {
      const g: any = typeof globalThis !== 'undefined' ? globalThis : undefined;
      if (!g) return null;

      // Access via globalThis to avoid lint complaints about window in non-browser contexts
      const ls = g.localStorage;
      if (!ls) return null;
      // Basic sanity check for required methods
      if (typeof ls.getItem !== 'function' || typeof ls.setItem !== 'function') {
        return null;
      }
      return ls;
    } catch {
      return null;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Safely read a value from localStorage and JSON.parse it.
   * Returns null if the key doesn't exist, storage is unavailable, or parsing fails.
   */
  read<T>(key: string): T | null {
    try {
      const s = this.storage;
      if (!s) return null;
      const raw = s.getItem(key);
      if (raw == null) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        // Corrupted or non-JSON content
        return null;
      }
    } catch {
      return null;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Safely write a value to localStorage using JSON.stringify.
   * No-ops if storage is unavailable or serialization fails.
   */
  write<T>(key: string, value: T): void {
    try {
      const s = this.storage;
      if (!s) return;
      const payload = JSON.stringify(value);
      s.setItem(key, payload);
    } catch {
      // Swallow errors for resilience
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Remove a key from localStorage. No-ops if storage is unavailable.
   */
  remove(key: string): void {
    try {
      const s = this.storage;
      if (!s) return;
      s.removeItem(key);
    } catch {
      // Swallow errors for resilience
    }
  }
}
