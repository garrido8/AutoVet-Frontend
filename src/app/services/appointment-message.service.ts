import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppointmentMessage } from '../interfaces/appointment-message.interface';

@Injectable( {
  providedIn: 'root'
} )
export class AppointmentMessageService {

  private http: HttpClient = inject( HttpClient );

  // The base URL for the appointment messages API endpoint.
  // Make sure this matches the URL defined in your Django urls.py
  private messagesUrl: string = 'http://127.0.0.1:8000/appointment-messages/'; // Example URL

  /**
   * Fetches all messages for a specific appointment.
   * @param appointmentId The ID of the appointment to fetch messages for.
   * @returns An Observable that emits an array of AppointmentMessage objects.
   */
  public getMessagesByAppointment( appointmentId: number ): Observable<AppointmentMessage[]> {
    // Uses query parameters to filter messages by the appointment ID, as defined in the Django view
    return this.http.get<AppointmentMessage[]>( `${ this.messagesUrl }?appointment=${ appointmentId }` );
  }

  /**
   * Adds a new message to an appointment.
   * Note: The backend will set the 'user' and 'timestamp'.
   * @param message A partial message object, typically containing 'appointment' and 'content'.
   * @returns An Observable that emits the newly created AppointmentMessage object.
   */
  public addMessage( message: Partial<AppointmentMessage> ): Observable<AppointmentMessage> {
    return this.http.post<AppointmentMessage>( this.messagesUrl, message );
  }

  /**
   * Edits an existing message by its ID.
   * Note: Usually, you only want to allow editing the 'content' of a message.
   * @param id The primary key (pk) of the message to edit.
   * @param message A partial message object containing the fields to update ( e.g., { content: 'new text' } ).
   * @returns An Observable that emits the updated AppointmentMessage object.
   */
  public editMessage( id: number, message: Partial<AppointmentMessage> ): Observable<AppointmentMessage> {
    const url = `${ this.messagesUrl }${ id }/`;
    return this.http.put<AppointmentMessage>( url, message );
  }

  /**
   * Deletes a message by its ID.
   * @param id The primary key (pk) of the message to delete.
   * @returns An Observable that emits a response upon successful deletion ( typically empty ).
   */
  public deleteMessage( id: number ): Observable<any> {
    const url = `${ this.messagesUrl }${ id }/`;
    return this.http.delete( url );
  }
}
