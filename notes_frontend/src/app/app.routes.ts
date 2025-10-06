import { Routes } from '@angular/router';
import { NotesListComponent } from './features/notes-list/notes-list.component';
import { NoteEditorComponent } from './features/note-editor/note-editor.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'notes' },
  { path: 'notes', pathMatch: 'full', component: NotesListComponent },
  { path: 'notes/new', component: NoteEditorComponent },
  { path: 'notes/:id', component: NoteEditorComponent },
  { path: '**', redirectTo: 'notes' },
];
