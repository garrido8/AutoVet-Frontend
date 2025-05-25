import { Component, ElementRef, inject, OnDestroy, OnInit, ViewChild, AfterViewChecked } from '@angular/core'; // Added AfterViewChecked
import { MessageService } from '../../../services/message.service';
import { ConversationService } from '../../../services/conversation.service';
import { catchError, finalize, of, Subscription, switchMap, tap } from 'rxjs';
import { ChatStateService } from '../../../services/chatstate.service';
import { Conversation } from '../../../interfaces/conversation.interface';
import { AuthService } from '../../../services/auth.service';
import { UserInfoService } from '../../../services/user-info.service';
import { Message } from '../../../interfaces/message.interface';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../../services/gemini.service';
import { marked } from 'marked';
import { Router } from '@angular/router'; // NEW: Import Router



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
// NEW: Implemented AfterViewChecked, although scrollToBottom is mostly called directly now
export class ChatbotComponent implements OnInit, OnDestroy, AfterViewChecked {

  private messageService = inject( MessageService );
  private userInfoService = inject( UserInfoService ); // Corrected injection variable name
  private authService = inject( AuthService );
  private conversationService = inject( ConversationService );
  private chatStateService = inject( ChatStateService );
  private gemini = inject( GeminiService );


  public promptValueText: string = '';
  public isLoading: boolean = false; // Flag to indicate loading state

  @ViewChild('promptValue') promptValue?: ElementRef;
  @ViewChild('messagesContainer') messagesContainer?: ElementRef; // NEW: ViewChild for messages container


  private subscriptions = new Subscription();

  public selectedConversation: Conversation | null = null;
  public currentConversation: Conversation | null = null;
  public userConversations: Conversation[] = [];

  private userId: number | null = null;

   ngOnInit(): void {
    // --- Logic to get all conversations for the current user ---
    this.subscriptions.add(
      this.authService.getUserPerEmail(this.userInfoService.getToken()!).pipe( // Consistent userInfoService
        tap(user => {
          if (!user || user.length === 0 || !user[0].id) {
            console.warn('ChatbotComponent: User not found or user ID is missing. Cannot fetch user conversations.');
            throw new Error('User data missing for fetching conversations.');
          }
          this.userId = user[0].id!;
          console.log('ChatbotComponent: Fetching conversations for client ID:', this.userId);
        }),
        switchMap(() => this.conversationService.getConversationsByClientId(this.userId!)),
        tap(conversations => {
          this.userConversations = conversations;
          this.userConversations.forEach( conversation => {
            if (!conversation.messages) { // Ensure messages array exists
                conversation.messages = [];
            }
            this.messageService.getMessagesByConversationId( conversation.id! )
              .subscribe( messages => {
                conversation.messages = messages;
                // No need to scroll here for all conversations, only for the selected one.
                // The currentConversation check below handles the initially selected one.
              } )
          } )
          console.log('ChatbotComponent: User conversations loaded:', this.userConversations);
        }),
        catchError(error => {
          console.error('ChatbotComponent: Error fetching user conversations:', error);
          this.userConversations = [];
          return of([]);
        })
      ).subscribe()
    );

    // --- Logic to get the currently active conversation, prioritizing sessionStorage ---
    // Changed to use chatStateService directly here
    const storedConversation = this.chatStateService.getConversationItem();
    if ( storedConversation ) {
      this.selectedConversation = storedConversation;
      this.currentConversation = storedConversation; // Also set currentConversation
      this.messageService.getMessagesByConversationId( this.selectedConversation.id! )
        .subscribe( messages => {
          this.selectedConversation!.messages = messages;
          console.log('ChatbotComponent: Selected conversation from chat state service:', this.selectedConversation);
          this.scrollToBottom(); // Scroll to bottom after active conversation messages are loaded
        });
    } else {
        // If no stored conversation, ensure selected and current are null
        this.selectedConversation = null;
        this.currentConversation = null;
        this.chatStateService.clearConversationItem();
        console.log('ChatbotComponent: No active conversation set. Clearing sessionStorage if any.');
    }
    // You can keep the chatStateService.currentConversation$ subscription if it has other purposes,
    // but for initial load of active conversation, chatStateService is more direct.
  }

  // NEW: AfterViewChecked lifecycle hook for reliable scrolling after DOM updates
  // This hook runs after every change detection cycle.
  // It's often used for scrolling, but direct calls after data updates are often more efficient.
  // Keeping it here for demonstration, but direct calls are generally preferred.
  ngAfterViewChecked(): void {
    this.scrollToBottom(); // Ensure we scroll to bottom after every view check
  }


  ngOnDestroy(): void {
    // Corrected to use chatStateService for clearing
    this.chatStateService.clearConversationItem();
    this.subscriptions.unsubscribe();
  }

  // NEW: Method to scroll messages container to the bottom
  private scrollToBottom(): void {
    if (this.messagesContainer) {
      try {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      } catch (err) {
        console.error('Error scrolling to bottom:', err);
      }
    }
  }

  public selectConversation(conversation: Conversation): void {
    this.selectedConversation = conversation;
    // Corrected to use chatStateService for setting
    this.chatStateService.setConversationItem( conversation );
    console.log('ChatbotComponent: Navigating to conversation:', conversation);

    // Ensure messages array is initialized if it's null (e.g., if not fetched yet)
    if (!this.selectedConversation.messages) {
      this.selectedConversation.messages = [];
    }

    // Fetch messages if not already loaded (e.g., if switching conversations)
    // This is important to ensure messages are loaded before scrolling
    if (this.selectedConversation.messages.length === 0 && this.selectedConversation.id) {
        this.messageService.getMessagesByConversationId(this.selectedConversation.id).subscribe(messages => {
            this.selectedConversation!.messages = messages;
            // Scroll to bottom after selecting and loading conversation messages
            // Use a small timeout to ensure DOM has updated before scrolling
            setTimeout(() => this.scrollToBottom(), 0);
        });
    } else {
        // If messages are already there, just scroll
        setTimeout(() => this.scrollToBottom(), 0);
    }
  }

 public sendMessage(): void {
    const messageContent = this.promptValue?.nativeElement.value?.trim(); // Added .trim() here

    this.promptValue!.nativeElement.value = ''; // Immediately clear input

    // Early exit if message content is empty after trimming
    if (!messageContent || messageContent.length === 0) {
      console.warn('ChatbotComponent: Message content is empty.');
      return;
    }

    // Set loading to true at the very beginning of the message sending process
    this.isLoading = true;

    // Define newUserMessage here so it's accessible in both branches
    const newUserMessage: Message = {
      content: messageContent,
      conversation: 0, // Placeholder ID, will be updated
      type: 'user',
      timestamp: new Date()
    };

    // --- Scenario 1: No conversation is selected (start a new one) ---
    if ( !this.selectedConversation ) {
      console.log('ChatbotComponent: No conversation selected. Initiating new conversation creation flow.');

      this.subscriptions.add(
        this.authService.getUserPerEmail(this.userInfoService.getToken()!).pipe(
          tap(user => {
            if (!user || user.length === 0 || !user[0].id) {
              console.error('User Fetch Error: User not found or user ID is missing.');
              throw new Error('User not found or ID missing.');
            }
            this.userId = user[0].id!;
          }),
          // Step 1: Get conversation title from Gemini Service
          switchMap(user => {
            return this.gemini.getConvsersationTitle(messageContent).pipe(
              catchError(error => {
                console.error('Gemini Title Error: Could not get conversation title. Using default.', error);
                return of('Conversación con el veterinario (Título por defecto)');
              }),
              // Step 2: Create the conversation on the backend
              switchMap(title => {
                const newConversation: Conversation = {
                  client: user[0].id!,
                  client_name: user[0].name,
                  title: title,
                  created_at: new Date(),
                  messages: []
                };
                console.log('Attempting to add new conversation:', newConversation);
                return this.conversationService.addConversation(newConversation);
              })
            );
          }),
          // Step 3: Handle the created conversation response and set it as active
          tap(conversationResponse => {
            if (!conversationResponse || !conversationResponse.id) {
              console.error('Conversation Creation Error: Backend did not return a valid Conversation object with an ID.');
              throw new Error('Conversation ID missing from backend response.');
            }
            console.log('New conversation created successfully with ID:', conversationResponse.id);
            this.selectedConversation = conversationResponse;
            this.currentConversation = conversationResponse;
            // Corrected to use chatStateService for setting
            this.chatStateService.setConversationItem(conversationResponse);
            newUserMessage.conversation = conversationResponse.id!;

            // Optimistically add user message to the UI now that we have a conversation ID
            if (!this.selectedConversation.messages) {
              this.selectedConversation.messages = [];
            }
            this.selectedConversation.messages.push(newUserMessage);
            this.scrollToBottom(); // Scroll after adding user message
          }),
          // Step 4: Add the initial user message (now that conversation ID is known)
          switchMap(() => {
            console.log('Attempting to add initial user message:', newUserMessage);
            return this.messageService.addMessage(newUserMessage).pipe(
              tap(newMessage => {
                // `newMessage` from backend might have an ID, update the optimistically added message
                Object.assign(newUserMessage, newMessage);
                console.log('Initial user message added correctly');
              }),
              catchError(error => {
                console.error('Initial User Message Error: Error adding initial user message', error);
                throw error;
              })
            );
          }),
          // Step 5: Progress conversation with Gemini and add AI message (same logic as existing flow)
          switchMap(() => {
              const fullPrompt = messageContent; // For the very first message
              return this.gemini.progressConversation(fullPrompt).pipe(
                catchError(geminiError => {
                  console.error('ChatbotComponent: Error from Gemini service (new conv flow):', geminiError);
                  return of('Error: No se pudo obtener una respuesta del bot para la nueva conversación.');
                }),
                switchMap(geminiResponse => {
                  if (geminiResponse.startsWith('Error:')) {
                    const errorMachineMessage: Message = {
                        content: geminiResponse,
                        conversation: this.selectedConversation!.id!,
                        type: 'machine',
                        timestamp: new Date()
                    };
                    return of(errorMachineMessage);
                  }

                  const machineContentHtml = marked(geminiResponse).toString();
                  const newMachineMessage: Message = {
                    content: machineContentHtml,
                    conversation: this.selectedConversation!.id!,
                    type: 'machine',
                    timestamp: new Date()
                  };
                  return this.messageService.addMessage(newMachineMessage).pipe(
                    tap(savedMachineMessage => {
                      if (savedMachineMessage) {
                        this.selectedConversation!.messages!.push(savedMachineMessage);
                        this.userConversations.unshift(this.selectedConversation!); // Add to user conversations list (at the top)
                        this.scrollToBottom(); // Scroll after adding machine message
                      }
                    }),
                    catchError(addMachineMessageError => {
                      console.error('ChatbotComponent: Error saving machine message (new conv flow):', addMachineMessageError);
                      return of(null);
                    })
                  );
                })
              );
          }),
          tap(() => {
            console.log('New conversation flow completed.');
            // Removed router.navigate as it's typically not needed to navigate *away*
            // when a new conversation is started *on* the same chat page.
          }),
          catchError(overallError => {
            console.error('ChatbotComponent: Overall error during new conversation creation flow.', overallError);
            if (this.selectedConversation!.messages!.length > 0 && this.selectedConversation!.messages![this.selectedConversation!.messages!.length - 1]?.type === 'user') {
               this.selectedConversation!.messages!.pop();
            }
            return of(null);
          }),
          finalize(() => {
            this.isLoading = false;
            console.log('New conversation creation flow finalized. isLoading set to false.');
          })
        ).subscribe());
      return; // Exit sendMessage after initiating the new conversation flow
    }

    // --- Scenario 2: A conversation is already selected (continue existing one) ---
    newUserMessage.conversation = this.selectedConversation.id!;

    if (!this.selectedConversation.messages) {
      this.selectedConversation.messages = [];
    }
    this.selectedConversation.messages.push(newUserMessage);
    this.scrollToBottom(); // Scroll after adding user message

    const existingMessagesForPrompt: string = (this.selectedConversation.messages!
      .slice(0, -1) // Exclude the just-added user message for the historical prompt
      .map(m => this.cleanHtmlText(m.content))
      .join('\n')
    ) || '';

    const fullPrompt = existingMessagesForPrompt + '\n' + messageContent;

    console.log('Full prompt for Gemini:', fullPrompt);
    console.log('User message sent (optimistically):', newUserMessage);

    this.subscriptions.add(
      this.messageService.addMessage(newUserMessage).pipe(
        tap(savedUserMessage => {
            // Update the optimistically added message with details from backend (e.g., ID)
            Object.assign(newUserMessage, savedUserMessage);
            console.log('ChatbotComponent: User message saved successfully:', savedUserMessage);
        }),
        switchMap(() => this.gemini.progressConversation(fullPrompt).pipe(
          catchError(geminiError => {
            console.error('ChatbotComponent: Error from Gemini service:', geminiError);
            return of('Error: No se pudo obtener una respuesta del bot. Por favor, inténtalo de nuevo.');
          })
        )),
        switchMap(geminiResponse => {
          if (geminiResponse.startsWith('Error:')) {
            const errorMachineMessage: Message = {
                content: geminiResponse,
                conversation: this.selectedConversation!.id!,
                type: 'machine',
                timestamp: new Date()
            };
            return of(errorMachineMessage);
          }

          const machineContentHtml = marked(geminiResponse).toString();

          const newMachineMessage: Message = {
            content: machineContentHtml,
            conversation: this.selectedConversation!.id!,
            type: 'machine',
            timestamp: new Date()
          };
          return this.messageService.addMessage(newMachineMessage).pipe(
            tap(savedMachineMessage => {
              if (savedMachineMessage) {
                this.selectedConversation!.messages!.push(savedMachineMessage);
                this.scrollToBottom(); // Scroll after adding machine message
              }
            }),
            catchError(addMachineMessageError => {
              console.error('ChatbotComponent: Error saving machine message:', addMachineMessageError);
              return of(null);
            })
          );
        }),
        tap(() => {
          // No navigation needed for existing conversations
        }),
        catchError(overallError => {
          console.error('ChatbotComponent: Overall error in sendMessage flow:', overallError);
          if (this.selectedConversation!.messages!.length > 0 && this.selectedConversation!.messages![this.selectedConversation!.messages!.length - 1]?.type === 'user') {
            this.selectedConversation!.messages!.pop();
          }
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
          console.log('Existing conversation flow finalized. isLoading set to false.');
        })
      ).subscribe()
    );
  }

  public cleanHtmlText(htmlString: string): string {
    const stringWithoutTags = htmlString.replace( /<[^>]*>/g, '' );
    const normalizedWhitespaceString = stringWithoutTags.replace( /\s+/g, ' ' );
    return normalizedWhitespaceString.trim();
  }

    public createConversation(): void {
    this.chatStateService.clearConversationItem(); // Clear any existing conversation in chat state service
    this.selectedConversation = null; // Reset the selected conversation
  }
}
