import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Conversation } from '../interfaces/conversation.interface';

@Injectable({
  providedIn: 'root'
})
export class ChatStateService {
  // BehaviorSubject holds the current conversation and emits its latest value to new subscribers
  private currentConversationSubject = new BehaviorSubject<Conversation | null>(null);

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
}
