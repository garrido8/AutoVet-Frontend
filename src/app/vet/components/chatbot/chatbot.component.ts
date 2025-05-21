import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MessageService } from '../../../services/message.service';
import { ConversationService } from '../../../services/conversation.service';
import { Subscription } from 'rxjs';
import { ChatStateService } from '../../../services/chatstate.service';
import { Conversation } from '../../../interfaces/conversation.interface';

@Component({
  selector: 'app-chatbot',
  standalone: false,
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.css'
})
export class ChatbotComponent implements OnInit, OnDestroy {

  private messageService = inject( MessageService );
  private conversationService = inject( ConversationService );
  private chatStateService = inject( ChatStateService ); // Inject ChatStateService

  private subscriptions = new Subscription();

  public currentConversation: Conversation | null = null; // Public property to hold the conversation

  ngOnInit(): void {
    // Subscribe to the currentConversation$ observable from ChatStateService
    this.subscriptions.add(
      this.chatStateService.currentConversation$.subscribe(conversation => {
        if (conversation) {
          this.currentConversation = conversation;
          console.log('ChatbotComponent received conversation:', this.currentConversation);
          // Now you have the conversation object, you can use it to:
          // - Load messages related to this conversation
          // - Display conversation title/details
          // - Perform any other initialization based on the conversation
          // Example: this.loadMessagesForConversation(this.currentConversation.id!);
        } else {
          // Handle case where conversation is null (e.g., cleared or not yet set)
          this.currentConversation = null;
          console.log('ChatbotComponent: No current conversation set.');
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe(); // Unsubscribe from all subscriptions to prevent memory leaks
  }

  // Example method to load messages (you'd implement this based on your MessagesService)
  // private loadMessagesForConversation(conversationId: number): void {
  //   this.subscriptions.add(
  //     this.messageService.getMessagesByConversationId(conversationId).subscribe(messages => {
  //       console.log('Messages for conversation:', messages);
  //       // Assign messages to a public property for display in your template
  //     })
  //   );
  // }
}
