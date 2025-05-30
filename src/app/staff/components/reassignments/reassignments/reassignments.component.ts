import { CommonModule, formatDate, registerLocaleData } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ReassignmentService } from '../../../../services/reassignment.service';
import { Reassignment } from '../../../../interfaces/reassignment.interface'; // Ensure this path is correct
import { Subscription } from 'rxjs';
import localeEs from '@angular/common/locales/es';
import { FormsModule } from '@angular/forms'; // Import FormsModule for ngModel

registerLocaleData(localeEs, 'es-ES'); // Register locale for date formatting

@Component({
  selector: 'app-reassignments',
  standalone: true,
  templateUrl: './reassignments.component.html',
  styleUrl: './reassignments.component.css',
  imports: [
    CommonModule,
    FormsModule // Add FormsModule here
  ]
})
export class ReassignmentsComponent implements OnInit, OnDestroy {

  private subscriptions = new Subscription()

  private reassignmentService = inject(ReassignmentService);

  public reassignments: Reassignment[] = [];

  // Define the available statuses for the dropdown
  public availableStatuses: string[] = [
    'pending',
    'approved',
    'rejected'
  ];

  ngOnInit(): void {
    // Fetch reassignments when the component initializes
    this.subscriptions.add(
      this.reassignmentService.getReassignments()
        .subscribe( response => {
          this.reassignments = response;
          console.log('Fetched Reassignments:', this.reassignments); // For debugging
        },
        error => {
          console.error('Error fetching reassignments:', error);
          // Handle error, e.g., show a user-friendly message
        })
    );
  }

  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions to prevent memory leaks
    this.subscriptions.unsubscribe();
  }

  /**
   * Formats a Date object or string into a localized date string.
   * @param date The date to format. Can be a Date object or a date string.
   * @returns The formatted date string, or an empty string if the date is invalid.
   */
  public getDate(date: Date | string | undefined): string {
    if (!date) return ''; // Handle undefined or null dates
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      const dateFormat = 'dd/MM/yyyy HH:mm'; // Format including time
      const locale = 'es-ES';
      return formatDate(d, dateFormat, locale);
    } catch (e) {
      console.error('Error formatting date:', e);
      return ''; // Return empty string on error
    }
  }

  /**
   * Converts a backend reassignment status string to a user-friendly display string.
   * @param status The status string from the backend (e.g., 'pending', 'approved').
   * @returns The displayable status string (e.g., 'Pendiente', 'Aprobada').
   */
  public getDisplayStatus(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'approved':
        return 'Aprobada';
      case 'rejected':
        return 'Rechazada';
      default:
        return 'Desconocido'; // Fallback for unknown statuses
    }
  }

  /**
   * Generates the CSS class for the status pill based on the status string.
   * @param status The status string from the backend.
   * @returns The corresponding CSS class (e.g., 'status-pending').
   */
  public getStatusClass(status: string): string {
    return `status-${status}`; // Assumes CSS classes like status-pending, status-approved, status-rejected
  }

  /**
   * Handles the change event for the status dropdown.
   * Updates the reassignment status in the backend.
   * @param reassignment The Reassignment object that was changed.
   * @param newStatus The new status string (backend value).
   */
  public onStatusChange(reassignment: Reassignment, newStatus: string): void {
    if (reassignment.id === undefined) {
      console.error('Cannot update reassignment: ID is undefined.', reassignment);
      return;
    }

    // Create a partial object with only the fields that need to be updated
    // In a real scenario, you might send the full updated object or just the changed field.
    const updatedReassignment: Partial<Reassignment> = {
      status: newStatus,
      updated_at: new Date() // Optionally update the 'updated_at' timestamp
    };

    this.subscriptions.add(
      this.reassignmentService.editReassignment(reassignment.id, { ...reassignment, ...updatedReassignment } as Reassignment)
        .subscribe(
          response => {
            console.log('Reassignment status updated successfully:', response);
            // Optionally, update the local 'reassignments' array if the backend doesn't return the full updated object
            // or if you want to ensure UI reflects the change immediately.
            // In this case, since ngModel updates the local object, it might not be strictly necessary
            // unless the backend applies further changes.
          },
          error => {
            console.error('Error updating reassignment status:', error);
            // Revert the status in the UI if the update fails
            // This is important for good UX
            const originalReassignment = this.reassignments.find(r => r.id === reassignment.id);
            if (originalReassignment) {
              reassignment.status = originalReassignment.status; // Revert to original status
            }
            // Show an error message to the user
            alert('Error al actualizar el estado. Por favor, inténtelo de nuevo.'); // Using alert for simplicity, consider a custom modal
          }
        )
    );
  }
}
