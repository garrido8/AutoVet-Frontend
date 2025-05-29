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
  private router = inject( Router );

  public promptValueText: string = '';
  public isLoading: boolean = false;

  @ViewChild('promptValue') promptValue?: ElementRef;
  @ViewChild('messagesContainer') messagesContainer?: ElementRef;

  private subscriptions = new Subscription();

  public selectedConversation: Conversation | null = null;
  public currentConversation: Conversation | null = null;
  public userConversations: Conversation[] = [];

  private userId: number | null = null;

  public showConversationMenu: boolean = false;
  public menuPosition: { top: string, left: string } = { top: '0px', left: '0px' };
  public activeConversationIdForMenu: number | null = null;

  // Properties for in-component modal control
  public showEditModal: boolean = false;
  public conversationToEdit: Conversation | null = null;
  public editedTitle: string = ''; // Holds the title currently being edited in the modal input
  public isEditingLoading: boolean = false; // Loading state for the edit operation

  // NEW: Properties for in-component DELETE confirmation modal control
  public showDeleteConfirmModal: boolean = false;
  public conversationToDelete: Conversation | null = null;
  public isDeletingLoading: boolean = false; // Loading state for the delete operation


  ngOnInit(): void {
    this.fetchUserConversations();
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

  private fetchUserConversations(): void {
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
          // If the selected conversation was updated, ensure its title is fresh
          if (this.selectedConversation && this.selectedConversation.id) {
            const updatedConv = this.userConversations.find(c => c.id === this.selectedConversation!.id);
            if (updatedConv) {
              this.selectedConversation.title = updatedConv.title;
              this.chatStateService.setConversationItem(updatedConv); // Update session storage
            }
          }
        }),
        catchError(error => {
          console.error('ChatbotComponent: Error fetching user conversations:', error);
          this.userConversations = [];
          return of([]);
        })
      ).subscribe()
    );
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
                        this.userConversations.unshift(this.selectedConversation!); // Add to top of list
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
    this.showConversationMenu = false;
    this.activeConversationIdForMenu = null;
  }

  public toggleConversationMenu(event: MouseEvent, conversationId: number): void {
    event.stopPropagation();

    if (this.showConversationMenu && this.activeConversationIdForMenu === conversationId) {
      this.showConversationMenu = false;
      this.activeConversationIdForMenu = null;
    } else {
      this.showConversationMenu = false;
      this.activeConversationIdForMenu = null;

      this.activeConversationIdForMenu = conversationId;
      this.showConversationMenu = true;
    }
  }

  public onClickOutsideMenu(): void {
    // This will close both the conversation menu and any active modal
    if (this.showConversationMenu) {
      this.showConversationMenu = false;
      this.activeConversationIdForMenu = null;
    }
    if (this.showEditModal) {
      this.cancelEdit(); // Call cancelEdit to reset modal state
    }
    // NEW: Close delete confirmation modal
    if (this.showDeleteConfirmModal) {
        this.cancelDelete();
    }
  }

  // UPDATED: deleteConversation now prepares and shows the confirmation modal
  public deleteConversation(conversationId: number): void {
    const conversation = this.userConversations.find(c => c.id === conversationId);
    if (conversation) {
      this.conversationToDelete = conversation;
      this.showDeleteConfirmModal = true; // Show the new confirmation modal
      this.showConversationMenu = false; // Close the context menu
      this.activeConversationIdForMenu = null;
    } else {
      console.warn('Conversation not found for deletion:', conversationId);
    }
  }

  // NEW: Method to confirm and proceed with deletion
  public confirmDelete(): void {
    if (this.conversationToDelete && this.conversationToDelete.id) {
      this.isDeletingLoading = true;
      console.log('Confirming delete of conversation with ID:', this.conversationToDelete.id);
      this.conversationService.deleteConversation(this.conversationToDelete.id).pipe(
        finalize(() => this.isDeletingLoading = false)
      ).subscribe({
        next: () => {
          console.log(`Conversation ${this.conversationToDelete!.id} deleted successfully.`);
          this.userConversations = this.userConversations.filter(conv => conv.id !== this.conversationToDelete!.id);
          if (this.selectedConversation?.id === this.conversationToDelete!.id) {
            this.createConversation(); // Clear selected conversation if it was the one deleted
          }
          this.closeDeleteConfirmModal();
        },
        error: (err) => {
          console.error(`Error deleting conversation ${this.conversationToDelete!.id}:`, err);
          // Optionally display an error message to the user
        }
      });
    }
  }

  // NEW: Method to cancel deletion
  public cancelDelete(): void {
    this.closeDeleteConfirmModal();
  }

  // NEW: Method to close the delete confirmation modal and reset its state
  private closeDeleteConfirmModal(): void {
    this.showDeleteConfirmModal = false;
    this.conversationToDelete = null;
    this.isDeletingLoading = false;
  }

  public editConversation(conversationId: number): void {
    const conversation = this.userConversations.find(c => c.id === conversationId);
    if (conversation) {
      this.conversationToEdit = { ...conversation }; // Create a copy to prevent direct modification
      this.editedTitle = conversation.title; // Initialize input with current title
      this.showEditModal = true;              // Show the modal
      this.showConversationMenu = false;      // Close the context menu
      this.activeConversationIdForMenu = null;
    } else {
      console.warn('Conversation not found for editing:', conversationId);
    }
  }

  // Methods for managing the in-component edit modal
  public saveEditedConversation(): void {
    if (this.conversationToEdit && this.editedTitle.trim()) {
      this.isEditingLoading = true;
      const updatedConversation: Conversation = {
        ...this.conversationToEdit,
        title: this.editedTitle.trim()
      };

      this.conversationService.editConversation(updatedConversation.id!, updatedConversation).pipe(
        finalize(() => this.isEditingLoading = false) // Ensure loading state is reset
      ).subscribe({
        next: ( response ) => {
          console.log('Conversation updated successfully:', response);
          // Update the conversation in the local array
          const index = this.userConversations.findIndex(c => c.id === response.id);
          if (index !== -1) {
            this.userConversations[index] = response;
          }
          // If the currently selected conversation was the one edited, update it
          if (this.selectedConversation?.id === response.id) {
              this.selectedConversation = response;
              this.currentConversation = response;
              this.messageService.getMessagesByConversationId( this.selectedConversation!.id! )
              .subscribe( messages => {
          this.selectedConversation!.messages = messages;
          console.log('ChatbotComponent: Selected conversation from chat state service:', this.selectedConversation);
          this.scrollToBottom();
        });
            this.chatStateService.setConversationItem(response);
          }
          this.closeEditModal();
        },
        error: ( err ) => {
          console.error('Error updating conversation:', err);
          // Optionally display an error message to the user
        }
      });
    }
  }

  public cancelEdit(): void {
    this.closeEditModal();
  }

  private closeEditModal(): void {
    this.showEditModal = false;
    this.conversationToEdit = null; // Clear the conversation data
    this.editedTitle = ''; // Clear the input field
    this.isEditingLoading = false; // Reset loading state just in case
  }
}
