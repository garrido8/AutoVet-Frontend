import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Message } from '../interfaces/message.interface';

@Injectable({
  providedIn: 'root'
})
export class MessageService {

    private http: HttpClient = inject( HttpClient );

  // Adjust this URL to where your Message API endpoint is located
  private messageUrl: string = 'http://127.0.0.1:8000/messages/';

  /**
   * Fetches all messages from the API.
   * @returns An Observable that emits an array of Message objects.
   */
  public getMessages(): Observable<Message[]> {
    return this.http.get<Message[]>(this.messageUrl);
  }

  public getMessagesByConversationId(conversationId: number): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.messageUrl}?conversation_id=${conversationId}`);
  }

  /**
   * Adds a new message to the API.
   * @param message The Message object to be added.
   * @returns An Observable that emits the newly created Message object.
   */
  public addMessage( message: Message ): Observable<Message> {
    return this.http.post<Message>(this.messageUrl, message);
  }

  /**
   * Edits an existing message by its ID.
   * @param id The ID of the message to edit.
   * @param message The updated Message object.
   * @returns An Observable that emits the updated Message object.
   */
  public editMessage(id: number, message: Message): Observable<Message> {
    // Construct the URL for the specific message using its ID
    const url = `${this.messageUrl}${id}/`;
    // Use the HTTP PUT method to send the updated message object to the URL
    return this.http.put<Message>(url, message);
  }

  /**
   * Deletes a message by its ID.
   * @param id The ID of the message to delete.
   * @returns An Observable that emits nothing on successful deletion.
   */
  public deleteMessage(id: number): Observable<void> {
    const url = `${this.messageUrl}${id}/`;
    return this.http.delete<void>(url);
  }
}
