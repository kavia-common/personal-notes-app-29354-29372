import { Routes } from '@angular/router';
import { NotesListComponent } from './features/notes-list/notes-list.component';
import { NoteEditorComponent } from './features/note-editor/note-editor.component';

export const routes: Routes = [
  // Default redirect to notes list
  { path: '', redirectTo: 'notes', pathMatch: 'full' },

  // Notes list
  { path: 'notes', component: NotesListComponent },

  // Create new note
  { path: 'notes/new', component: NoteEditorComponent },

  // Edit note by id
  { path: 'notes/:id', component: NoteEditorComponent },

  // Fallback
  { path: '**', redirectTo: 'notes' },
];
