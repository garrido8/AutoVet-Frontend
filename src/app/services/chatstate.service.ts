import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Conversation } from '../interfaces/conversation.interface';
import * as CryptoJS from 'crypto-js';
import { secretKey } from '../../environments/urls';

/**
 * @class ChatStateService
 * @description Gestiona el estado de la conversación del chat en la aplicación.
 * Proporciona una forma de establecer, obtener y limpiar la conversación actual,
 * tanto en memoria (usando BehaviorSubject) como en el sessionStorage (de forma cifrada).
 */
@Injectable( {
  providedIn: 'root'
} )
export class ChatStateService {
  private currentConversationSubject = new BehaviorSubject<Conversation | null>( null );
  private SECRET_KEY = secretKey;

  /**
   * @property currentConversation$
   * @description Un Observable que emite la conversación actual o null si no hay ninguna.
   * Los componentes pueden suscribirse a este observable para reaccionar a los cambios en la conversación.
   * @type { Observable<Conversation | null> }
   */
  public currentConversation$: Observable<Conversation | null> = this.currentConversationSubject.asObservable();

  constructor() { }

  /**
   * @method setCurrentConversation
   * @description Actualiza la conversación actual en el BehaviorSubject.
   * @param { Conversation } conversation El objeto de conversación a establecer como actual.
   */
  setCurrentConversation( conversation: Conversation ): void {
    this.currentConversationSubject.next( conversation );
  }

  /**
   * @method clearCurrentConversation
   * @description Limpia la conversación actual del BehaviorSubject, emitiendo un valor nulo.
   */
  clearCurrentConversation(): void {
    this.currentConversationSubject.next( null );
  }

  /**
   * @method setConversationItem
   * @description Cifra y guarda la conversación actual en el sessionStorage.
   * @param { Conversation } conversation El objeto de conversación a guardar.
   */
  public setConversationItem( conversation: Conversation ): void {
    const encryptedConversation = CryptoJS.AES.encrypt( JSON.stringify( conversation ), this.SECRET_KEY ).toString();
    sessionStorage.setItem( 'conversation', encryptedConversation );
  }

  /**
   * @method getConversationItem
   * @description Obtiene y descifra la conversación del sessionStorage.
   * @returns { Conversation | null } El objeto de conversación descifrado, o null si no se encuentra o hay un error.
   */
  public getConversationItem(): Conversation | null {
    const encryptedConversation = sessionStorage.getItem( 'conversation' );
    if ( !encryptedConversation ) return null;

    try {
      const bytes = CryptoJS.AES.decrypt( encryptedConversation, this.SECRET_KEY );
      const decryptedConversation = bytes.toString( CryptoJS.enc.Utf8 );
      return JSON.parse( decryptedConversation ) as Conversation;
    } catch ( error ) {
      console.error( 'Error parsing conversation from sessionStorage:', error );
      return null;
    }
  }

  /**
   * @method clearConversationItem
   * @description Elimina la conversación guardada del sessionStorage.
   */
  public clearConversationItem(): void {
    sessionStorage.removeItem( 'conversation' );
  }
}
