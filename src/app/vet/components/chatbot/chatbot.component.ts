import { Component, ElementRef, inject, OnDestroy, OnInit, ViewChild, AfterViewChecked } from '@angular/core';
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
import { Router } from '@angular/router';

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
export class ChatbotComponent implements OnInit, OnDestroy, AfterViewChecked {

  private messageService = inject( MessageService );
  private userInfoService = inject( UserInfoService );
  private authService = inject( AuthService );
  private conversationService = inject( ConversationService );
  private chatStateService = inject( ChatStateService );
  private gemini = inject( GeminiService );
  private router = inject( Router ); // Injected Router

  public promptValueText: string = '';
  public isLoading: boolean = false;

  @ViewChild('promptValue') promptValue?: ElementRef;
  @ViewChild('messagesContainer') messagesContainer?: ElementRef;

  private subscriptions = new Subscription();

  public selectedConversation: Conversation | null = null;
  public currentConversation: Conversation | null = null;
  public userConversations: Conversation[] = [];

  private userId: number | null = null;

  // NEW: State for showing/hiding the conversation menu
  public showConversationMenu: boolean = false;
  public menuPosition: { top: string, left: string } = { top: '0px', left: '0px' };
  public activeConversationIdForMenu: number | null = null; // To track which conversation's menu is open

  ngOnInit(): void {
    this.subscriptions.add(
      this.authService.getUserPerEmail(this.userInfoService.getToken()!).pipe(
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
            if (!conversation.messages) {
                conversation.messages = [];
            }
            this.messageService.getMessagesByConversationId( conversation.id! )
              .subscribe( messages => {
                conversation.messages = messages;
              });
          });
          console.log('ChatbotComponent: User conversations loaded:', this.userConversations);
        }),
        catchError(error => {
          console.error('ChatbotComponent: Error fetching user conversations:', error);
          this.userConversations = [];
          return of([]);
        })
      ).subscribe()
    );

    const storedConversation = this.chatStateService.getConversationItem();
    if ( storedConversation ) {
      this.selectedConversation = storedConversation;
      this.currentConversation = storedConversation;
      this.messageService.getMessagesByConversationId( this.selectedConversation.id! )
        .subscribe( messages => {
          this.selectedConversation!.messages = messages;
          console.log('ChatbotComponent: Selected conversation from chat state service:', this.selectedConversation);
          this.scrollToBottom();
        });
    } else {
        this.selectedConversation = null;
        this.currentConversation = null;
        this.chatStateService.clearConversationItem();
        console.log('ChatbotComponent: No active conversation set. Clearing sessionStorage if any.');
    }
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    this.chatStateService.clearConversationItem();
    this.subscriptions.unsubscribe();
  }

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
    this.chatStateService.setConversationItem( conversation );
    console.log('ChatbotComponent: Navigating to conversation:', conversation);

    if (!this.selectedConversation.messages) {
      this.selectedConversation.messages = [];
    }

    if (this.selectedConversation.messages.length === 0 && this.selectedConversation.id) {
        this.messageService.getMessagesByConversationId(this.selectedConversation.id).subscribe(messages => {
            this.selectedConversation!.messages = messages;
            setTimeout(() => this.scrollToBottom(), 0);
        });
    } else {
        setTimeout(() => this.scrollToBottom(), 0);
    }
    // NEW: Close the menu when selecting a conversation
    this.showConversationMenu = false;
    this.activeConversationIdForMenu = null;
  }

  public sendMessage(): void {
    const messageContent = this.promptValue?.nativeElement.value?.trim();

    this.promptValue!.nativeElement.value = '';

    if (!messageContent || messageContent.length === 0) {
      console.warn('ChatbotComponent: Message content is empty.');
      return;
    }

    this.isLoading = true;

    const newUserMessage: Message = {
      content: messageContent,
      conversation: 0,
      type: 'user',
      timestamp: new Date()
    };

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
          switchMap(user => {
            return this.gemini.getConvsersationTitle(messageContent).pipe(
              catchError(error => {
                console.error('Gemini Title Error: Could not get conversation title. Using default.', error);
                return of('Conversación con el veterinario (Título por defecto)');
              }),
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
          tap(conversationResponse => {
            if (!conversationResponse || !conversationResponse.id) {
              console.error('Conversation Creation Error: Backend did not return a valid Conversation object with an ID.');
              throw new Error('Conversation ID missing from backend response.');
            }
            console.log('New conversation created successfully with ID:', conversationResponse.id);
            this.selectedConversation = conversationResponse;
            this.currentConversation = conversationResponse;
            this.chatStateService.setConversationItem(conversationResponse);
            newUserMessage.conversation = conversationResponse.id!;

            if (!this.selectedConversation.messages) {
              this.selectedConversation.messages = [];
            }
            this.selectedConversation.messages.push(newUserMessage);
            this.scrollToBottom();
          }),
          switchMap(() => {
            console.log('Attempting to add initial user message:', newUserMessage);
            return this.messageService.addMessage(newUserMessage).pipe(
              tap(newMessage => {
                Object.assign(newUserMessage, newMessage);
                console.log('Initial user message added correctly');
              }),
              catchError(error => {
                console.error('Initial User Message Error: Error adding initial user message', error);
                throw error;
              })
            );
          }),
          switchMap(() => {
              const fullPrompt = messageContent;
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
                        this.userConversations.unshift(this.selectedConversation!);
                        this.scrollToBottom();
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
      return;
    }

    newUserMessage.conversation = this.selectedConversation.id!;

    if (!this.selectedConversation.messages) {
      this.selectedConversation.messages = [];
    }
    this.selectedConversation.messages.push(newUserMessage);
    this.scrollToBottom();

    const existingMessagesForPrompt: string = (this.selectedConversation.messages!
      .slice(0, -1)
      .map(m => this.cleanHtmlText(m.content))
      .join('\n')
    ) || '';

    const fullPrompt = existingMessagesForPrompt + '\n' + messageContent;

    console.log('Full prompt for Gemini:', fullPrompt);
    console.log('User message sent (optimistically):', newUserMessage);

    this.subscriptions.add(
      this.messageService.addMessage(newUserMessage).pipe(
        tap(savedUserMessage => {
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
                this.scrollToBottom();
              }
            }),
            catchError(addMachineMessageError => {
              console.error('ChatbotComponent: Error saving machine message:', addMachineMessageError);
              return of(null);
            })
          );
        }),
        tap(() => {
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
    this.chatStateService.clearConversationItem();
    this.selectedConversation = null;
    // NEW: Close the menu when starting a new conversation
    this.showConversationMenu = false;
    this.activeConversationIdForMenu = null;
  }

  // NEW: Toggle conversation menu
  public toggleConversationMenu(event: MouseEvent, conversationId: number): void {
    event.stopPropagation(); // Prevent selectConversation from being called

    // If the clicked menu is already open, close it
    if (this.showConversationMenu && this.activeConversationIdForMenu === conversationId) {
      this.showConversationMenu = false;
      this.activeConversationIdForMenu = null;
    } else {
      // Close any currently open menu before opening a new one
      this.showConversationMenu = false; // Ensure previous menu is closed
      this.activeConversationIdForMenu = null; // Clear previous active ID

      // Open the new menu
      this.activeConversationIdForMenu = conversationId;
      this.showConversationMenu = true;

      // No need for position calculation here, CSS handles it
    }
  }

  // NEW: Handle click outside the menu to close it
  public onClickOutsideMenu(): void {
    // Only close if a menu is actually open
    if (this.showConversationMenu) {
      this.showConversationMenu = false;
      this.activeConversationIdForMenu = null;
    }
  }

  // NEW: Implement menu actions
  public deleteConversation(conversationId: number): void {
    console.log('Deleting conversation with ID:', conversationId);
    // Add your conversation deletion logic here
    this.conversationService.deleteConversation(conversationId).subscribe({
      next: () => {
        console.log(`Conversation ${conversationId} deleted successfully.`);
        // Remove from local array
        this.userConversations = this.userConversations.filter(conv => conv.id !== conversationId);
        // If the deleted conversation was the selected one, clear selection
        if (this.selectedConversation?.id === conversationId) {
          this.createConversation(); // Clears selection and sets up for new conversation
        }
        this.showConversationMenu = false; // Close menu after action
        this.activeConversationIdForMenu = null;
      },
      error: (err) => {
        console.error(`Error deleting conversation ${conversationId}:`, err);
        // Handle error, e.g., show a user-friendly message
      }
    });
  }

  public editConversation(conversationId: number): void {
    console.log('Editing conversation with ID:', conversationId);
    // Add your conversation editing logic here
    // For example, navigate to an edit page or open a modal
    this.router.navigate(['/edit-conversation', conversationId]); // Example navigation
    this.showConversationMenu = false; // Close menu after action
    this.activeConversationIdForMenu = null;
  }
}
