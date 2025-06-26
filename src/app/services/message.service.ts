import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Message } from '../interfaces/message.interface';
import { backendURL } from '../../environments/urls';

/**
 * @class MessageService
 * @description Servicio para gestionar las operaciones CRUD para los mensajes.
 * Proporciona métodos para obtener, añadir, editar y eliminar mensajes
 * interactuando con una API de backend.
 */
@Injectable( {
  providedIn: 'root'
} )
export class MessageService {

  private http: HttpClient = inject( HttpClient );
  private messageUrl: string = backendURL + 'messages/';

  /**
   * @method getMessages
   * @description Obtiene todos los mensajes desde la API.
   * @returns { Observable<Message[]> } Un Observable que emite un array de objetos Message.
   */
  public getMessages(): Observable<Message[]> {
    return this.http.get<Message[]>( this.messageUrl );
  }

  /**
   * @method getMessagesByConversationId
   * @description Obtiene todos los mensajes de una conversación específica por su ID.
   * @param { number } conversationId El ID de la conversación.
   * @returns { Observable<Message[]> } Un Observable que emite un array de objetos Message filtrados por la conversación.
   */
  public getMessagesByConversationId( conversationId: number ): Observable<Message[]> {
    return this.http.get<Message[]>( `${ this.messageUrl }?conversation_id=${ conversationId }` );
  }

  /**
   * @method addMessage
   * @description Añade un nuevo mensaje a la API.
   * @param { Message } message El objeto Message que se va a añadir.
   * @returns { Observable<Message> } Un Observable que emite el objeto Message recién creado.
   */
  public addMessage( message: Message ): Observable<Message> {
    return this.http.post<Message>( this.messageUrl, message );
  }

  /**
   * @method editMessage
   * @description Edita un mensaje existente por su ID.
   * @param { number } id El ID del mensaje a editar.
   * @param { Message } message El objeto Message actualizado.
   * @returns { Observable<Message> } Un Observable que emite el objeto Message actualizado.
   */
  public editMessage( id: number, message: Message ): Observable<Message> {
    const url = `${ this.messageUrl }${ id }/`;
    return this.http.put<Message>( url, message );
  }

  /**
   * @method deleteMessage
   * @description Elimina un mensaje por su ID.
   * @param { number } id El ID del mensaje a eliminar.
   * @returns { Observable<void> } Un Observable que se completa sin emitir valor tras la eliminación exitosa.
   */
  public deleteMessage( id: number ): Observable<void> {
    const url = `${ this.messageUrl }${ id }/`;
    return this.http.delete<void>( url );
  }
}
