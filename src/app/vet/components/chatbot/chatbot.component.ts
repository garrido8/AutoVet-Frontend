import { Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MessageService } from '../../../services/message.service';
import { ConversationService } from '../../../services/conversation.service';
import { catchError, of, Subscription, switchMap, tap } from 'rxjs';
import { ChatStateService } from '../../../services/chatstate.service';
import { Conversation } from '../../../interfaces/conversation.interface';
import { AuthService } from '../../../services/auth.service';
import { UserInfoService } from '../../../services/user-info.service';
import { Message } from '../../../interfaces/message.interface';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../../services/gemini.service';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.css',
  imports: [
    CommonModule,
    FormsModule
  ]
})
export class ChatbotComponent implements OnInit, OnDestroy {

  private messageService = inject( MessageService );
  private userInfoService = inject( UserInfoService )
  private authService = inject( AuthService )
  private conversationService = inject( ConversationService ); // Inject ConversationService
  private chatStateService = inject( ChatStateService ); // Inject ChatStateService
  private gemini = inject( GeminiService )

  public promptValueText: string = '';

  @ViewChild('promptValue') promptValue?: ElementRef;

  private subscriptions = new Subscription();

  public selectedConversation: Conversation | null = null; // Public property to hold the selected conversation

  public currentConversation: Conversation | null = null; // Public property to hold the conversation

  public userConversations: Conversation[] = []; // Array to hold user conversations

  private userId: number | null = null; // Private property to hold the user ID

   ngOnInit(): void {
    // --- Logic to get all conversations for the current user ---
    this.subscriptions.add(
      this.authService.getUserPerEmail(this.userInfoService.getToken()!).pipe(
        tap(user => {
          if (!user || user.length === 0 || !user[0].id) {
            console.warn('ChatbotComponent: User not found or user ID is missing. Cannot fetch user conversations.');
            // Optionally handle this error more gracefully in UI
            throw new Error('User data missing for fetching conversations.'); // Throw to be caught by catchError
          }
        }),
        switchMap(user => {
          const clientId = user[0].id!; // Get the client ID dynamically
          this.userId = clientId; // Store the user ID for later use
          console.log('ChatbotComponent: Fetching conversations for client ID:', clientId);
          return this.conversationService.getConversationsByClientId(clientId);
        }),
        tap(conversations => {
          this.userConversations = conversations;
          this.userConversations.forEach( conversation => {
            this.messageService.getMessagesByConversationId( conversation.id! )
              .subscribe( messages => {
                conversation.messages = messages; // Assign messages to the conversation
              } )
          } )
          console.log('ChatbotComponent: User conversations loaded:', this.userConversations);
        }),
        catchError(error => {
          console.error('ChatbotComponent: Error fetching user conversations:', error);
          this.userConversations = []; // Clear conversations on error
          return of([]); // Return empty array to complete the observable gracefully
        })
      ).subscribe() // Subscribe here and add to subscriptions
    );

    // --- Logic to get the currently active conversation (from goToChatBot in ForumPageComponent) ---
    this.subscriptions.add(
      this.chatStateService.currentConversation$.subscribe(conversation => {
        if (conversation) {
          this.currentConversation = conversation;
          this.messageService.getMessagesByConversationId( this.currentConversation.id! )
            .subscribe( messages => {
              console.log(messages);
            } )
          console.log('ChatbotComponent received active conversation:', this.currentConversation);
        } else {
          this.currentConversation = null;
          console.log('ChatbotComponent: No active conversation set.');
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe(); // Unsubscribe from all subscriptions to prevent memory leaks
  }

  public selectConversation(conversation: Conversation): void {
    this.selectedConversation = conversation; // Set the selected conversation
    console.log('ChatbotComponent: Navigating to conversation:', conversation);
  }

  public sendMessage(): void {
    const message = this.promptValue?.nativeElement.value
    if( this.selectedConversation ) {
      const newMessage: Message = {
        content: message,
        conversation: this.selectedConversation.id!,
        type: 'user',
        timestamp: new Date()
      };

      const olderMessages: string = (this.selectedConversation.messages?.map(m => this.cleanHtmlText(m.content)).join('\n')) || '';
      // Join the cleaned messages with the <&> separator

      const prompt = olderMessages + '\n' + message;

      console.log(prompt);

      this.gemini.progressConversation( prompt )
        .subscribe( response => {
          console.log(response);
        } )

      this.messageService.addMessage(newMessage).subscribe({
        next: (response) => {
          console.log('ChatbotComponent: Message sent successfully:', response);
          // Optionally, you can update the selected conversation's messages here
          this.selectedConversation!.messages!.push(response);


        },
        error: (error) => {
          console.error('ChatbotComponent: Error sending message:', error);
        }
      });
    } else {

    }
  }

  public cleanHtmlText(htmlString: string): string {
    // 1. Remove HTML tags
    const stringWithoutTags = htmlString.replace( /<[^>]*>/g, '' );

    // 2. Replace multiple whitespace characters (including newlines) with a single space
    const normalizedWhitespaceString = stringWithoutTags.replace( /\s+/g, ' ' );

    // 3. Trim leading and trailing whitespace
    return normalizedWhitespaceString.trim();
  }

}
