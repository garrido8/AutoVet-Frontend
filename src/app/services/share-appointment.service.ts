import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ShareAppointment } from '../interfaces/share-appointment.interface'; // Ensure this path is correct

@Injectable( {
  providedIn: 'root'
} )
export class ShareAppointmentService {

  private http: HttpClient = inject( HttpClient );

  // The base URL for the share-appointment API endpoint.
  // Adjust this URL to match your backend's API endpoint.
  private shareAppointmentUrl: string = 'http://127.0.0.1:8000/shares/'; // Example URL

  /**
   * Fetches all shared instances for a specific appointment.
   * @param { number } appointmentId The ID of the appointment to fetch shared instances for.
   * @returns { Observable<ShareAppointment[]> } An Observable that emits an array of ShareAppointment objects.
   */
  public getSharedAppointmentsByAppointment( appointmentId: number ): Observable<ShareAppointment[]> {
    // Uses query parameters to filter by the appointment ID.
    return this.http.get<ShareAppointment[]>( `${ this.shareAppointmentUrl }?appointment=${ appointmentId }` );
  }

  /**
   * Creates a new shared appointment record.
   * @param { Partial<ShareAppointment> } sharedAppointment A partial object containing the details of the share.
   * The backend will typically handle setting fields like 'id', 'shared_at', and 'shared_by'.
   * @returns { Observable<ShareAppointment> } An Observable that emits the newly created ShareAppointment object.
   */
  public shareAppointment( sharedAppointment: Partial<ShareAppointment> ): Observable<ShareAppointment> {
    return this.http.post<ShareAppointment>( this.shareAppointmentUrl, sharedAppointment );
  }

  /**
   * Updates an existing shared appointment, for instance, to change permissions.
   * @param { number } id The primary key ( pk ) of the shared appointment record to edit.
   * @param { Partial<ShareAppointment> } sharedAppointment A partial object with the fields to update ( e.g., { permission: 'VIEW' } ).
   * @returns { Observable<ShareAppointment> } An Observable that emits the updated ShareAppointment object.
   */
  public updateSharedAppointment( id: number, sharedAppointment: Partial<ShareAppointment> ): Observable<ShareAppointment> {
    const url = `${ this.shareAppointmentUrl }${ id }/`;
    return this.http.put<ShareAppointment>( url, sharedAppointment );
  }

  /**
   * Deletes a shared appointment record by its ID, revoking access.
   * @param { number } id The primary key ( pk ) of the shared appointment record to delete.
   * @returns { Observable<any> } An Observable that completes upon successful deletion ( typically emitting no value ).
   */
  public deleteSharedAppointment( id: number ): Observable<any> {
    const url = `${ this.shareAppointmentUrl }${ id }/`;
    return this.http.delete( url );
  }
}
