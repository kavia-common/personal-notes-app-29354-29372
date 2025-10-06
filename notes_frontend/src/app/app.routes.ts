import { Routes } from '@angular/router';
import { Component } from '@angular/core';
import { NotesListComponent } from './features/notes-list/notes-list.component';

/**
 * Temporary NoteEditor stub for routing until editor implementation is added.
 */
// PUBLIC_INTERFACE
@Component({
  selector: 'app-note-editor-stub',
  standalone: true,
  template: `
    <section aria-label="Note editor" class="stub">
      <p>Note editor view will appear here.</p>
    </section>
  `,
  styles: [`
    .stub { padding: 1rem; color: var(--text-color, #111827); }
  `]
})
export class NoteEditorStubComponent {}

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'notes' },
  { path: 'notes', pathMatch: 'full', component: NotesListComponent },
  { path: 'notes/new', component: NoteEditorStubComponent },
  { path: 'notes/:id', component: NoteEditorStubComponent },
  { path: '**', redirectTo: 'notes' },
];
