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
import { marked } from 'marked';

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

    const storedConversation = this.chatStateService.getConversationItem()
    if ( storedConversation ) {
      this.selectedConversation = storedConversation; // Set the selected conversation from chat state service
      this.messageService.getMessagesByConversationId( this.selectedConversation.id! )
        .subscribe( messages => {
          this.selectedConversation!.messages = messages; // Assign messages to the conversation
        } )
      console.log('ChatbotComponent: Selected conversation from chat state service:', this.selectedConversation);
    }

  }

  ngOnDestroy(): void {
    this.chatStateService.clearConversationItem(); // Clear the conversation item from chat state service
    this.subscriptions.unsubscribe(); // Unsubscribe from all subscriptions to prevent memory leaks
  }

  public selectConversation(conversation: Conversation): void {
    this.selectedConversation = conversation; // Set the selected conversation
    this.chatStateService.setConversationItem( conversation ); // Update the chat state service
    console.log('ChatbotComponent: Navigating to conversation:', conversation);
  }

  public sendMessage(): void {
    const messageContent = this.promptValue?.nativeElement.value?.trim();

    // Early exit if no message content or no conversation is selected
    if (!messageContent || messageContent.length === 0 || !this.selectedConversation) {
      console.warn('ChatbotComponent: No message content or conversation selected.');
      return;
    }

    // Immediately clear the input field for better UX
    this.promptValue!.nativeElement.value = '';

    const newUserMessage: Message = {
      content: messageContent,
      conversation: this.selectedConversation.id!,
      type: 'user',
      timestamp: new Date()
    };

    // Optimistically add user message to the UI for immediate feedback
    // The messages array is guaranteed to exist due to `selectConversation` or `ngOnInit` logic
    this.selectedConversation.messages!.push(newUserMessage);

    // Prepare the string of older messages for the prompt
    // Exclude the *just-added* user message from the historical context if it's already in the array,
    // to avoid sending it twice in the prompt.
    const existingMessagesForPrompt: string = (this.selectedConversation.messages!
      .slice(0, this.selectedConversation!.messages!.length - 1) // Slice to exclude the optimistically added message
      .map(m => this.cleanHtmlText(m.content)) // Clean content
      .join('\n') // Join with newline for prompt
    ) || '';

    // Construct the full prompt for the Gemini service
    const fullPrompt = existingMessagesForPrompt + '\n' + messageContent;

    console.log('Full prompt for Gemini:', fullPrompt);
    console.log('User message sent (optimistically):', newUserMessage);

    // Chain the message sending and AI response using RxJS operators
    this.subscriptions.add(
      this.messageService.addMessage(newUserMessage).pipe(
        // The tap here is for potential backend-generated IDs or confirmation
        // If your backend returns the message with an ID, you might want to replace
        // the optimistically added message with the one returned from the backend.
        // E.g., `Object.assign(newUserMessage, savedUserMessage);` if `savedUserMessage` contains ID.
        tap(savedUserMessage => console.log('ChatbotComponent: User message saved successfully:', savedUserMessage)),
        switchMap(() => this.gemini.progressConversation(fullPrompt).pipe(
          catchError(geminiError => {
            console.error('ChatbotComponent: Error from Gemini service:', geminiError);
            // Provide user feedback: e.g., this.showErrorMessage('No se pudo obtener respuesta del bot.');
            // Optionally, return a placeholder machine message or rethrow error
            return of('Error: No se pudo obtener una respuesta del bot. Por favor, inténtalo de nuevo.');
          })
        )),
        switchMap(geminiResponse => {
          // If Gemini responded with an error string, handle it appropriately for display
          if (geminiResponse.startsWith('Error:')) {
            const errorMachineMessage: Message = {
                content: geminiResponse, // Store the error string as content
                conversation: this.selectedConversation!.id!,
                type: 'machine', // Still a machine message, but indicates error
                timestamp: new Date()
            };
            return of(errorMachineMessage); // Return as an observable of a message
          }

          // Process Gemini's response (assuming it's markdown that needs to be converted to HTML)
          const machineContentHtml = marked(geminiResponse).toString();

          const newMachineMessage: Message = {
            content: machineContentHtml,
            conversation: this.selectedConversation!.id!,
            type: 'machine',
            timestamp: new Date()
          };
          return this.messageService.addMessage(newMachineMessage).pipe(
            catchError(addMachineMessageError => {
              console.error('ChatbotComponent: Error saving machine message:', addMachineMessageError);
              // Provide user feedback: e.g., this.showErrorMessage('No se pudo guardar la respuesta del bot.');
              // Potentially remove the optimistically added user message if this was a critical failure
              return of(null); // Return null to complete the chain gracefully without crashing
            })
          );
        }),
        tap(savedMachineMessage => {
          if (savedMachineMessage) { // Only push if message was actually saved (not null from catchError)
            this.selectedConversation!.messages!.push(savedMachineMessage);
          }
        }),
        catchError(overallError => {
          console.error('ChatbotComponent: Overall error in sendMessage flow:', overallError);
          // Catch-all for any unhandled errors in the chain (e.g., initial messageService.addMessage failed)
          // If the initial user message saving failed, remove the optimistically added message from UI.
          this.selectedConversation!.messages!.pop(); // Remove the last (optimistically added user) message
          // Provide user feedback: e.g., this.showErrorMessage('Error al enviar el mensaje.');
          return of(null); // Ensure observable completes gracefully
        })
      ).subscribe()
    );
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
