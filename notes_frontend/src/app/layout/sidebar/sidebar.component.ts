import { Component } from '@angular/core';
import { NotesListComponent } from '../../features/notes-list/notes-list.component';

// PUBLIC_INTERFACE
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NotesListComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {}
