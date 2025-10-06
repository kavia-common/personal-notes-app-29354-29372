import { Injectable } from '@angular/core';
import { Note } from '../models/note.model';
import { StorageService } from './storage.service';

/**
 * NotesService manages the lifecycle of notes:
 * - In-memory state synchronized to localStorage
 * - CRUD operations
 * - Simple case-insensitive search on title, content, and tags
 * - Deterministic ID generation
 * - Seed data on first run when storage is empty
 */
@Injectable({
  providedIn: 'root',
})
export class NotesService {
  private readonly storageKey = StorageService.NOTES_KEY;
  private notes: Note[] = [];

  constructor(private storage: StorageService) {
    // Initialize from storage, with seed on first run if empty/unavailable
    const stored = this.storage.read<Note[]>(this.storageKey);
    if (Array.isArray(stored) && stored.length > 0) {
      this.notes = this.sortDescByUpdatedAt(this.sanitizeNotes(stored));
    } else {
      this.notes = this.seedNotes();
      this.persist();
    }
  }

  // PUBLIC_INTERFACE
  /**
   * List notes, optionally filtered by a search query.
   * - Sorted by updatedAt desc
   * - Search matches title, content, and tags (case-insensitive)
   */
  listNotes(query?: string): Note[] {
    const list = this.sortDescByUpdatedAt([...this.notes]);
    if (!query) return list;
    const q = query.toLowerCase().trim();
    if (!q) return list;

    return list.filter((n) => {
      const inTitle = (n.title ?? '').toLowerCase().includes(q);
      const inContent = (n.content ?? '').toLowerCase().includes(q);
      const inTags = Array.isArray(n.tags) && n.tags.some((t) => (t ?? '').toLowerCase().includes(q));
      return inTitle || inContent || inTags;
    });
  }

  // PUBLIC_INTERFACE
  /**
   * Retrieve a note by id, returns undefined if not found.
   */
  getNote(id: string): Note | undefined {
    return this.notes.find((n) => n.id === id);
  }

  // PUBLIC_INTERFACE
  /**
   * Create a new note with deterministic ID and timestamps.
   * Sets createdAt and updatedAt to now in ISO format.
   */
  createNote(payload: { title: string; content?: string; tags?: string[] }): Note {
    const now = new Date().toISOString();
    const note: Note = {
      id: this.generateId(),
      title: payload.title,
      content: payload.content ?? '',
      tags: payload.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };
    this.notes.unshift(note); // keep most recent near top before sort
    this.notes = this.sortDescByUpdatedAt(this.notes);
    this.persist();
    return note;
    }

  // PUBLIC_INTERFACE
  /**
   * Update an existing note by id. Updates updatedAt to now.
   * Returns the updated note. Throws if the note is not found.
   */
  updateNote(note: Note): Note {
    const idx = this.notes.findIndex((n) => n.id === note.id);
    if (idx === -1) {
      throw new Error('Note not found');
    }
    const now = new Date().toISOString();
    const updated: Note = {
      ...this.notes[idx],
      ...note,
      updatedAt: now,
    };
    this.notes[idx] = updated;
    this.notes = this.sortDescByUpdatedAt(this.notes);
    this.persist();
    return updated;
  }

  // PUBLIC_INTERFACE
  /**
   * Delete a note by id. No-ops if the note does not exist.
   */
  deleteNote(id: string): void {
    const before = this.notes.length;
    this.notes = this.notes.filter((n) => n.id !== id);
    if (this.notes.length !== before) {
      this.persist();
    }
  }

  // Helpers

  private persist(): void {
    this.storage.write<Note[]>(this.storageKey, this.notes);
  }

  private sortDescByUpdatedAt(list: Note[]): Note[] {
    return list.sort((a, b) => {
      const ta = Date.parse(a.updatedAt || a.createdAt || 0);
      const tb = Date.parse(b.updatedAt || b.createdAt || 0);
      return tb - ta;
    });
  }

  private sanitizeNotes(items: unknown): Note[] {
    // Ensure basic structure; drop invalid items silently
    if (!Array.isArray(items)) return [];
    return items
      .map((x) => {
        const n = x as Partial<Note>;
        if (!n || typeof n !== 'object') return null;
        if (!n.id || !n.title || !n.createdAt || !n.updatedAt) return null;
        return {
          id: String(n.id),
          title: String(n.title),
          content: typeof n.content === 'string' ? n.content : '',
          createdAt: String(n.createdAt),
          updatedAt: String(n.updatedAt),
          tags: Array.isArray(n.tags) ? n.tags.map((t) => String(t)) : [],
        } as Note;
      })
      .filter((x): x is Note => !!x);
  }

  private seedNotes(): Note[] {
    const now = new Date();
    const note1Time = new Date(now.getTime() - 1000 * 60 * 60).toISOString();
    const note2Time = new Date(now.getTime() - 1000 * 60 * 10).toISOString();

    const sample: Note[] = [
      {
        id: this.generateId(),
        title: 'Welcome to Notes',
        content:
          'This is your first note. Use the app to create, edit, search, and delete notes. Your notes are stored locally in your browser.',
        createdAt: note1Time,
        updatedAt: note1Time,
        tags: ['welcome', 'getting-started'],
      },
      {
        id: this.generateId(),
        title: 'Tips',
        content:
          'Use the search to quickly find notes by title, content, or tags. Notes are sorted by most recently updated.',
        createdAt: note2Time,
        updatedAt: note2Time,
        tags: ['tips', 'productivity'],
      },
    ];

    return this.sortDescByUpdatedAt(sample);
  }

  private generateId(): string {
    // Deterministic format; uniqueness sufficient for local app usage
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
