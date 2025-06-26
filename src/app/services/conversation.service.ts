import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Conversation } from '../interfaces/conversation.interface';
import { backendURL } from '../../environments/urls';

/**
 * @class ConversationService
 * @description Servicio para gestionar las operaciones CRUD de las conversaciones.
 * Se comunica con la API del backend para obtener, crear, editar y eliminar conversaciones.
 */
@Injectable( {
  providedIn: 'root'
} )
export class ConversationService {

  private http: HttpClient = inject( HttpClient );
  private conversationUrl: string = backendURL + 'conversations/';

  /**
   * @method getConversations
   * @description Obtiene todas las conversaciones desde la API.
   * @returns { Observable<Conversation[]> } Un Observable que emite un array de objetos Conversation.
   */
  public getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>( this.conversationUrl );
  }

  /**
   * @method addConversation
   * @description Añade una nueva conversación a la API.
   * @param { Conversation } conversation El objeto Conversation que se va a añadir.
   * @returns { Observable<Conversation> } Un Observable que emite el objeto Conversation recién creado.
   */
  public addConversation( conversation: Conversation ): Observable<Conversation> {
    return this.http.post<Conversation>( this.conversationUrl, conversation );
  }

  /**
   * @method editConversation
   * @description Edita una conversación existente por su ID.
   * @param { number } id El ID de la conversación a editar.
   * @param { Conversation } conversation El objeto Conversation actualizado.
   * @returns { Observable<Conversation> } Un Observable que emite el objeto Conversation actualizado.
   */
  public editConversation( id: number, conversation: Conversation ): Observable<Conversation> {
    const url = `${ this.conversationUrl }${ id }/`;
    return this.http.put<Conversation>( url, conversation );
  }

  /**
   * @method deleteConversation
   * @description Elimina una conversación por su ID.
   * @param { number } id El ID de la conversación a eliminar.
   * @returns { Observable<void> } Un Observable que se completa sin emitir valor tras la eliminación exitosa.
   */
  public deleteConversation( id: number ): Observable<void> {
    const url = `${ this.conversationUrl }${ id }/`;
    return this.http.delete<void>( url );
  }

  /**
   * @method getConversationsByClientId
   * @description Obtiene un array de conversaciones filtradas por el ID de un cliente.
   * @param { number } clientId El ID del cliente por el cual se filtrarán las conversaciones.
   * @returns { Observable<Conversation[]> } Un Observable que emite un array de objetos Conversation.
   */
  public getConversationsByClientId( clientId: number ): Observable<Conversation[]> {
    const url = `${ this.conversationUrl }?client_id=${ clientId }`;
    return this.http.get<Conversation[]>( url );
  }

}
