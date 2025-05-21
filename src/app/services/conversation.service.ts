import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Conversation } from '../interfaces/conversation.interface';

@Injectable({
  providedIn: 'root'
})
export class ConversationService {

  private http: HttpClient = inject( HttpClient );

  // Adjust this URL to where your Conversation API endpoint is located
  private conversationUrl: string = 'http://127.0.0.1:8000/conversations/';

  /**
   * Fetches all conversations from the API.
   * @returns An Observable that emits an array of Conversation objects.
   */
  public getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(this.conversationUrl);
  }

  /**
   * Adds a new conversation to the API.
   * @param conversation The Conversation object to be added.
   * @returns An Observable that emits the newly created Conversation object.
   */
  public addConversation( conversation: Conversation ): Observable<Conversation> {
    return this.http.post<Conversation>(this.conversationUrl, conversation);
  }

  /**
   * Edits an existing conversation by its ID.
   * @param id The ID of the conversation to edit.
   * @param conversation The updated Conversation object.
   * @returns An Observable that emits the updated Conversation object.
   */
  public editConversation(id: number, conversation: Conversation): Observable<Conversation> {
    // Construct the URL for the specific conversation using its ID
    const url = `${this.conversationUrl}${id}/`;
    // Use the HTTP PUT method to send the updated conversation object to the URL
    return this.http.put<Conversation>(url, conversation);
  }

  /**
   * Deletes a conversation by its ID.
   * @param id The ID of the conversation to delete.
   * @returns An Observable that emits nothing on successful deletion.
   */
  public deleteConversation(id: number): Observable<void> {
    const url = `${this.conversationUrl}${id}/`;
    return this.http.delete<void>(url);
  }

    /**
   * Fetches an array of conversations filtered by a client ID.
   * Assumes the backend API supports filtering by 'client_id' query parameter.
   * Example: http://127.0.0.1:8000/conversations/?client_id=123
   * @param clientId The ID of the client to filter conversations by.
   * @returns An Observable that emits an array of Conversation objects.
   */
  public getConversationsByClientId(clientId: number): Observable<Conversation[]> {
    const url = `${this.conversationUrl}?client_id=${clientId}`;
    return this.http.get<Conversation[]>(url);
  }
}
