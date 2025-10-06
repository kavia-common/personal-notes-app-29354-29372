import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterModule } from '@angular/router';
import { Note } from '../../models/note.model';
import { NotesService } from '../../services/notes.service';

/**
 * NoteEditorComponent
 * - Standalone component to create/edit a Note using reactive forms.
 * - Route-driven behavior:
 *    • /notes/new => create mode with empty form
 *    • /notes/:id => edit mode; loads note by id or shows not-found state
 * - Actions: Save (create/update), Delete (edit only), Cancel (navigate back)
 * - Accessibility: proper labels, aria-live regions, and keyboard handling
 * - Styling adheres to Ocean Professional tokens (in CSS file)
 */
// PUBLIC_INTERFACE
@Component({
  selector: 'app-note-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './note-editor.component.html',
  styleUrl: './note-editor.component.css',
})
export class NoteEditorComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notesService = inject(NotesService);
  private readonly destroyRef = inject(DestroyRef);

  // Route-driven state
  isCreateMode = signal<boolean>(true);
  noteId = signal<string | null>(null);

  // Loaded note for edit mode
  note = signal<Note | null>(null);

  // Simple status and error messages for aria-live
  statusMessage = signal<string>('');
  errorMessage = signal<string>('');

  // Reactive form
  form!: FormGroup<{
    title: any;
    content: any;
  }>;

  // For autofocus on create mode
  @ViewChild('titleInput') titleInputRef?: ElementRef<any>;

  // Derived title for header
  headerTitle = computed<string>(() => {
    if (this.isCreateMode()) return 'New Note';
    const n = this.note();
    return n ? `Edit: ${n.title || '(Untitled)'}` : 'Note not found';
  });

  ngOnInit(): void {
    this.form = this.fb.group({
      title: this.fb.control<string>('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(120)],
      }),
      content: this.fb.control<string>('', {
        nonNullable: true,
      }),
    });

    // Resolve route and load data accordingly
    this.route.paramMap.subscribe((params: ParamMap) => {
      const id = params.get('id');
      if (!id || id === 'new') {
        // Create mode: ensure clean form
        this.isCreateMode.set(true);
        this.noteId.set(null);
        this.note.set(null);
        this.form.reset({ title: '', content: '' });
        // status
        this.statusMessage.set('Creating a new note.');
        // focus on title after view init tick (safe global reference for SSR/lint)
        const g: any = typeof globalThis !== 'undefined' ? globalThis : undefined;
        if (g && typeof g.setTimeout === 'function') {
          g.setTimeout(() => this.titleInputRef?.nativeElement?.focus(), 0);
        }
      } else {
        // Edit mode
        this.isCreateMode.set(false);
        this.noteId.set(id);
        const found = this.notesService.getNote(id);
        if (!found) {
          this.note.set(null);
          this.errorMessage.set('The requested note could not be found.');
        } else {
          this.note.set(found);
          this.form.patchValue({
            title: found.title ?? '',
            content: found.content ?? '',
          });
          this.statusMessage.set(`Editing note titled ${found.title || 'Untitled'}.`);
        }
      }
    });
  }

  // PUBLIC_INTERFACE
  /** Handle Save action: create or update and navigate accordingly. */
  onSave(): void {
    this.errorMessage.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Please fix validation errors before saving.');
      return;
    }
    const { title, content } = this.form.value as { title: string; content: string };

    try {
      if (this.isCreateMode()) {
        const created = this.notesService.createNote({ title: title.trim(), content: (content ?? '').trim() });
        this.statusMessage.set('Note created successfully.');
        // Navigate to the new note
        this.router.navigate(['/notes', created.id]);
      } else {
        const id = this.noteId();
        if (!id) {
          this.errorMessage.set('Missing note ID. Unable to update.');
          return;
        }
        const existing = this.notesService.getNote(id);
        if (!existing) {
          this.errorMessage.set('Note not found. It may have been deleted.');
          return;
        }
        const updated: Note = {
          ...existing,
          title: title.trim(),
          content: (content ?? '').trim(),
          // updatedAt is handled by the service
        };
        this.notesService.updateNote(updated);
        this.statusMessage.set('Note updated.');
        // Stay on same route
      }
    } catch (e: any) {
      this.errorMessage.set(e?.message || 'An unexpected error occurred while saving the note.');
    }
  }

  // PUBLIC_INTERFACE
  /** Cancel action: navigate back to /notes list. */
  onCancel(): void {
    this.router.navigate(['/notes']);
  }

  // PUBLIC_INTERFACE
  /** Delete action (only for edit mode) with confirmation dialog. */
  onDelete(): void {
    const id = this.noteId();
    if (!id) {
      this.errorMessage.set('Missing note ID. Unable to delete.');
      return;
    }
    const current = this.note();
    const title = current?.title?.trim() || 'Untitled';
    const message = `Delete note "${title}"? This action cannot be undone.`;
    const confirmed = typeof globalThis !== 'undefined' && typeof globalThis.confirm === 'function'
      ? globalThis.confirm(message)
      : true;
    if (!confirmed) return;

    try {
      this.notesService.deleteNote(id);
      this.statusMessage.set('Note deleted.');
      this.router.navigate(['/notes']);
    } catch (e: any) {
      this.errorMessage.set(e?.message || 'Failed to delete the note.');
    }
  }

  // PUBLIC_INTERFACE
  /** Utility getters for validation state in template. */
  isTitleInvalid(): boolean {
    const c = this.form.get('title');
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  // PUBLIC_INTERFACE
  /** Return a helpful validation error for the title control. */
  titleErrorMsg(): string | null {
    const c = this.form.get('title');
    if (!c) return null;
    if (c.hasError('required')) return 'Title is required.';
    if (c.hasError('maxlength')) return 'Title must be at most 120 characters.';
    return null;
  }
}
