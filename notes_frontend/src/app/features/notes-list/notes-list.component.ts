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
      map(([q]) => this.notesService.listNotes(q)),
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
}
