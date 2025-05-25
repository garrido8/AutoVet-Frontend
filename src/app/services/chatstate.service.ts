import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Conversation } from '../interfaces/conversation.interface';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class ChatStateService {
  // BehaviorSubject holds the current conversation and emits its latest value to new subscribers
  private currentConversationSubject = new BehaviorSubject<Conversation | null>(null);

  private SECRET_KEY = 'dD92!r8&n$1Lm#tY*V@wQz4Rb7%JcXoL';

  // Expose an Observable for components to subscribe to
  public currentConversation$: Observable<Conversation | null> = this.currentConversationSubject.asObservable();

  constructor() { }

  /**
   * Sets the current conversation that other components can access.
   * @param conversation The Conversation object to set.
   */
  setCurrentConversation(conversation: Conversation): void {
    this.currentConversationSubject.next(conversation);
  }

  /**
   * Clears the current conversation from the state.
   */
  clearCurrentConversation(): void {
    this.currentConversationSubject.next(null);
  }

  public setConversationItem( conversation: Conversation ): void {
    const encryptedConversation = CryptoJS.AES.encrypt(JSON.stringify(conversation), this.SECRET_KEY).toString();
    sessionStorage.setItem('conversation', encryptedConversation);
  }

  public getConversationItem(): Conversation | null {
    const encryptedConversation = sessionStorage.getItem('conversation');
    if (!encryptedConversation) return null;

    const bytes = CryptoJS.AES.decrypt(encryptedConversation, this.SECRET_KEY);
    const decryptedConversation = bytes.toString(CryptoJS.enc.Utf8);
    try {
      return JSON.parse(decryptedConversation) as Conversation;
    }
    catch (error) {
      console.error('Error parsing conversation from sessionStorage:', error);
      return null;
    }
  }

  public clearConversationItem(): void {
    sessionStorage.removeItem('conversation');
  }
}
