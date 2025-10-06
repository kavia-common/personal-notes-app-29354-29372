import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

// PUBLIC_INTERFACE
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  /** Placeholder query bound to the search input for future integration. */
  query = '';

  /** Input handler to safely update the query without FormsModule. */
  onQueryInput(event: any): void {
    // Use a local cast while keeping parameter as any to satisfy eslint no-undef without DOM lib globals.
    const target = event && (event.target as { value?: string } | null);
    this.query = (target && typeof target.value === 'string') ? target.value : '';
  }

  /** Handles Enter key in search; currently no-op until list integration. */
  onSearchEnter(): void {
    // Will be wired to NotesList filtering in later steps.
  }
}
