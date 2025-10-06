import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NotesService } from '../../services/notes.service';
import { Note } from '../../models/note.model';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, startWith } from 'rxjs/operators';

/**
 * NotesListComponent
 * - Displays list of notes provided by NotesService
 * - Provides debounced search
 * - Highlights active note based on current route
 * - Navigates to /notes/:id and /notes/new
 * - Accessible semantics and ARIA attributes
 */
// PUBLIC_INTERFACE
@Component({
  selector: 'app-notes-list',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './notes-list.component.html',
  styleUrl: './notes-list.component.css',
})
export class NotesListComponent implements OnInit {
  private readonly notesService = inject(NotesService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // Track search query via subject to debounce
  private readonly query$ = new BehaviorSubject<string>('');

  // Expose current query for two-way UI sync (kept simple without FormsModule)
  query = signal<string>('');

  // Stream of filtered notes based on debounced query
  filteredNotes$!: Observable<Note[]>;

  // Selected note id from current route
  activeNoteId = signal<string | null>(null);

  // Focus/index management for keyboard navigation
  focusedIndex = signal<number>(-1);

  // Live status message for SR
  statusMessage = signal<string>('');

  // ARIA label for list
  listAriaLabel = 'Notes list';

  ngOnInit(): void {
    // Compute active note id from the current url
    this.updateActiveFromUrl(this.router.url);
    this.router.events.subscribe(() => {
      this.updateActiveFromUrl(this.router.url);
    });

    // Connect query signal to subject
    this.query$.next(this.query());

    // Build filtered notes stream
    this.filteredNotes$ = combineLatest([
      this.query$.pipe(
        map((q) => (q ?? '').trim()),
        debounceTime(250),
        distinctUntilChanged(),
        startWith('')
      ),
    ]).pipe(
      map(([q]) => {
        const list = this.notesService.listNotes(q);
        this.statusMessage.set(`${list.length} ${list.length === 1 ? 'note' : 'notes'} found`);
        // reset focused index when list changes
        this.focusedIndex.set(list.length ? 0 : -1);
        return list;
      }),
    );
  }

  /**
   * Update the search query. Debounced filtering reacts through query$.
   */
  // PUBLIC_INTERFACE
  onQueryChange(value: string): void {
    this.query.set(value);
    this.query$.next(value);
  }

  /**
   * Extract value from input event in a type-safe way and forward to onQueryChange.
   */
  // PUBLIC_INTERFACE
  onInput(event: unknown): void {
    const hasTarget = (e: unknown): e is { target: { value?: unknown } | null } =>
      !!e && typeof e === 'object' && 'target' in (e as any);

    const target = hasTarget(event) ? (event as { target: { value?: unknown } | null }).target : null;
    const val = target && typeof target.value === 'string' ? target.value : '';
    this.onQueryChange(val);
  }

  // PUBLIC_INTERFACE
  /** Handle keydown events on the search input: ArrowDown focuses first list item if available. */
  onSearchKeydown(event: any): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      // Try to move focus to the first list item
      const g: any = typeof globalThis !== 'undefined' ? globalThis : undefined;
      if (g && g.document) {
        const first = g.document.querySelector('.notes-ul .note-item') as any;
        if (first && typeof first.focus === 'function') {
          first.focus();
        }
      }
    }
  }

  /**
   * Navigate to a note by id.
   */
  // PUBLIC_INTERFACE
  openNote(note: Note): void {
    this.router.navigate(['/notes', note.id]);
  }

  /**
   * Navigate to create a new note.
   */
  // PUBLIC_INTERFACE
  createNote(): void {
    this.router.navigate(['/notes', 'new']);
  }

  /**
   * Determine if the provided note is the active note based on route.
   */
  isActive(note: Note): boolean {
    return this.activeNoteId() === note.id;
  }

  private updateActiveFromUrl(url: string): void {
    // Expecting routes like /notes, /notes/new, /notes/:id
    const match = url.match(/\/notes\/([^\/\?]+)/);
    const id = match && match[1] !== 'new' ? match[1] : null;
    this.activeNoteId.set(id);
  }

  /**
   * Returns a simple content snippet from a note.
   */
  snippet(note: Note): string {
    const text = (note.content ?? '').trim();
    if (!text) return '';
    return text.length > 80 ? text.slice(0, 80) + '…' : text;
  }

  /**
   * Safe tag display: join tags by comma
   */
  tags(note: Note): string {
    return Array.isArray(note.tags) && note.tags.length ? note.tags.join(', ') : '';
  }

  // PUBLIC_INTERFACE
  /** Handle keyboard navigation within the list items. */
  onItemKeydown(event: any, index: number, notes: Note[]): void {
    const key = event.key;
    if (!notes || !notes.length) return;

    const clamp = (i: number) => Math.max(0, Math.min(notes.length - 1, i));
    let nextIndex = index;

    if (key === 'ArrowDown') {
      event.preventDefault();
      nextIndex = clamp(index + 1);
      this.focusItem(nextIndex);
    } else if (key === 'ArrowUp') {
      event.preventDefault();
      nextIndex = clamp(index - 1);
      this.focusItem(nextIndex);
    } else if (key === 'Home') {
      event.preventDefault();
      nextIndex = 0;
      this.focusItem(nextIndex);
    } else if (key === 'End') {
      event.preventDefault();
      nextIndex = notes.length - 1;
      this.focusItem(nextIndex);
    } else if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      this.openNote(notes[index]);
    }

    this.focusedIndex.set(nextIndex);
  }

  /** Move DOM focus to the item at the provided index, if present. */
  private focusItem(index: number): void {
    const g: any = typeof globalThis !== 'undefined' ? globalThis : undefined;
    if (!g || !g.document) return;
    const items = g.document.querySelectorAll('.notes-ul .note-item') as any;
    const el = items && items[index] ? items[index] : null;
    if (el && typeof el.focus === 'function') {
      el.focus();
    }
  }
}
