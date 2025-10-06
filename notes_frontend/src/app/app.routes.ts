import { Routes } from '@angular/router';
import { Component } from '@angular/core';

/**
 * Temporary lightweight standalone components to enable routing
 * These will be replaced by real NotesList and NoteEditor components in later steps.
 */

// PUBLIC_INTERFACE
@Component({
  selector: 'app-notes-list-stub',
  standalone: true,
  template: `
    <section aria-label="Notes list" class="stub">
      <p>Notes list will appear here.</p>
    </section>
  `,
  styles: [`
    .stub { padding: 1rem; color: var(--text-color, #111827); }
  `]
})
export class NotesListStubComponent {}

// PUBLIC_INTERFACE
@Component({
  selector: 'app-note-editor-stub',
  standalone: true,
  template: `
    <section aria-label="Note editor" class="stub">
      <p>Note editor for ID: <strong>{{ id }}</strong> will appear here.</p>
    </section>
  `,
  styles: [`
    .stub { padding: 1rem; color: var(--text-color, #111827); }
  `]
})
export class NoteEditorStubComponent {
  id = 'new';
}

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'notes' },
  // Redirect /notes to default list
  { path: 'notes', pathMatch: 'full', component: NotesListStubComponent },
  // New note route
  { path: 'notes/new', component: NoteEditorStubComponent },
  // Note by id
  { path: 'notes/:id', component: NoteEditorStubComponent },
  // Fallback
  { path: '**', redirectTo: 'notes' },
];
