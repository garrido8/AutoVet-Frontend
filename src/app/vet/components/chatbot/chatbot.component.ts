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

/**
 * @class ChatbotComponent
 * @description
 * Componente principal para la funcionalidad de chatbot. Gestiona la visualización de conversaciones
 * y mensajes, el envío de nuevos mensajes, la creación de nuevas conversaciones, y la interacción
 * con un servicio de IA (Gemini) para generar respuestas. También incluye funcionalidades para
 * editar y eliminar conversaciones a través de menús contextuales y modales.
 */
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

  // --- Inyección de Dependencias ---
  private messageService = inject( MessageService );
  private userInfoService = inject( UserInfoService );
  private authService = inject( AuthService );
  private conversationService = inject( ConversationService );
  private chatStateService = inject( ChatStateService );
  private gemini = inject( GeminiService );
  private router = inject( Router );

  // --- Propiedades Públicas de Estado ---
  public promptValueText: string = '';
  public isLoading: boolean = false;
  public selectedConversation: Conversation | null = null;
  public currentConversation: Conversation | null = null;
  public userConversations: Conversation[] = [];
  public showConversationMenu: boolean = false;
  public menuPosition: { top: string, left: string } = { top: '0px', left: '0px' };
  public activeConversationIdForMenu: number | null = null;

  // --- Propiedades para el Modal de Edición ---
  public showEditModal: boolean = false;
  public conversationToEdit: Conversation | null = null;
  public editedTitle: string = '';
  public isEditingLoading: boolean = false;

  // --- Propiedades para el Modal de Confirmación de Borrado ---
  public showDeleteConfirmModal: boolean = false;
  public conversationToDelete: Conversation | null = null;
  public isDeletingLoading: boolean = false;

  // --- Referencias a Elementos del DOM ---
  @ViewChild('promptValue') promptValue?: ElementRef;
  @ViewChild('messagesContainer') messagesContainer?: ElementRef;

  // --- Propiedades Privadas ---
  private subscriptions = new Subscription();
  private userId: number | null = null;

  /**
   * @method ngOnInit
   * @description
   * Ciclo de vida de Angular. Carga las conversaciones del usuario al iniciar.
   * También recupera la conversación activa desde el `ChatStateService` (sessionStorage)
   * para mantener el estado entre navegaciones.
   * @returns {void}
   */
  ngOnInit(): void {
    this.fetchUserConversations();
    const storedConversation = this.chatStateService.getConversationItem();
    if ( storedConversation ) {
      this.selectedConversation = storedConversation;
      this.currentConversation = storedConversation;
      const sub = this.messageService.getMessagesByConversationId( this.selectedConversation.id! )
        .subscribe( messages => {
          this.selectedConversation!.messages = messages;
          this.scrollToBottom();
        });
      this.subscriptions.add(sub);
    } else {
        this.selectedConversation = null;
        this.currentConversation = null;
        this.chatStateService.clearConversationItem();
    }
  }

  /**
   * @method ngAfterViewChecked
   * @description
   * Ciclo de vida de Angular. Se ejecuta después de cada comprobación de la vista.
   * Se utiliza para asegurar que la vista de mensajes siempre se desplace hacia abajo.
   * @returns {void}
   */
  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  /**
   * @method ngOnDestroy
   * @description
   * Ciclo de vida de Angular. Limpia el estado de la conversación en sessionStorage y
   * anula todas las suscripciones para evitar fugas de memoria.
   * @returns {void}
   */
  ngOnDestroy(): void {
    this.chatStateService.clearConversationItem();
    this.subscriptions.unsubscribe();
  }

  /**
   * @private
   * @method fetchUserConversations
   * @description
   * Obtiene el ID del usuario actual y luego solicita todas sus conversaciones
   * y los mensajes asociados a cada una.
   * @returns {void}
   */
  private fetchUserConversations(): void {
    this.subscriptions.add(
      this.authService.getUserPerEmail(this.userInfoService.getToken()!).pipe(
        tap(user => {
          if (!user || user.length === 0 || !user[0].id) {
            throw new Error('User data missing for fetching conversations.');
          }
          this.userId = user[0].id!;
        }),
        switchMap(() => this.conversationService.getConversationsByClientId(this.userId!)),
        tap(conversations => {
          this.userConversations = conversations;
          this.userConversations.forEach( conversation => {
            if (!conversation.messages) conversation.messages = [];
            const msgSub = this.messageService.getMessagesByConversationId( conversation.id! )
              .subscribe( messages => conversation.messages = messages );
            this.subscriptions.add(msgSub);
          });
          if (this.selectedConversation?.id) {
            const updatedConv = this.userConversations.find(c => c.id === this.selectedConversation!.id);
            if (updatedConv) {
              this.selectedConversation.title = updatedConv.title;
              this.chatStateService.setConversationItem(updatedConv);
            }
          }
        }),
        catchError(error => {
          console.error('ChatbotComponent: Error fetching user conversations:', error);
          return of([]);
        })
      ).subscribe()
    );
  }

  /**
   * @private
   * @method scrollToBottom
   * @description Desplaza el contenedor de mensajes hasta el final para mostrar el último mensaje.
   * @returns {void}
   */
  private scrollToBottom(): void {
    if (this.messagesContainer) {
      try {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      } catch (err) { }
    }
  }

  /**
   * @method selectConversation
   * @description
   * Establece una conversación existente como la activa, la guarda en el estado
   * y carga sus mensajes si es necesario.
   * @param {Conversation} conversation - La conversación a seleccionar.
   * @returns {void}
   */
  public selectConversation(conversation: Conversation): void {
    this.selectedConversation = conversation;
    this.chatStateService.setConversationItem( conversation );
    if (!this.selectedConversation.messages) this.selectedConversation.messages = [];
    if (this.selectedConversation.messages.length === 0 && this.selectedConversation.id) {
      const msgSub = this.messageService.getMessagesByConversationId(this.selectedConversation.id).subscribe(messages => {
          this.selectedConversation!.messages = messages;
          setTimeout(() => this.scrollToBottom(), 0);
      });
      this.subscriptions.add(msgSub);
    } else {
        setTimeout(() => this.scrollToBottom(), 0);
    }
    this.showConversationMenu = false;
  }

  /**
   * @method sendMessage
   * @description
   * Orquesta el proceso de envío de un mensaje. Si no hay una conversación seleccionada,
   * inicia el flujo para crear una nueva. Si ya existe, añade el mensaje y obtiene
   * una respuesta de la IA. Gestiona el estado de carga y la actualización optimista de la UI.
   * @returns {void}
   */
  public sendMessage(): void {
    const messageContent = this.promptValue?.nativeElement.value?.trim();
    if (!messageContent) return;
    this.promptValue!.nativeElement.value = '';
    this.isLoading = true;

    const newUserMessage: Message = { content: messageContent, conversation: 0, type: 'user', timestamp: new Date() };

    if (!this.selectedConversation) {
      this.handleNewConversation(newUserMessage);
    } else {
      this.handleExistingConversation(newUserMessage);
    }
  }

  /**
   * @private
   * @method handleNewConversation
   * @description
   * Lógica para cuando se envía un mensaje sin una conversación activa.
   * 1. Pide un título a la IA.
   * 2. Crea la conversación en la BBDD.
   * 3. Guarda el primer mensaje del usuario.
   * 4. Pide la primera respuesta a la IA.
   * 5. Guarda la respuesta de la IA.
   * @param {Message} userMessage - El primer mensaje del usuario.
   * @returns {void}
   */
  private handleNewConversation(userMessage: Message): void {
    const sub = this.authService.getUserPerEmail(this.userInfoService.getToken()!).pipe(
      switchMap(user => {
        if (!user || !user[0]?.id) throw new Error('User not found.');
        this.userId = user[0].id;
        return this.gemini.getConvsersationTitle(userMessage.content).pipe(
          catchError(() => of('Nueva conversación')),
          switchMap(title => this.conversationService.addConversation({
            client: user[0].id!, client_name: user[0].name, title: title, created_at: new Date(), messages: []
          }))
        );
      }),
      tap(newConv => {
        this.selectedConversation = newConv;
        this.chatStateService.setConversationItem(newConv);
        userMessage.conversation = newConv.id!;
        this.selectedConversation.messages = [userMessage];
        this.userConversations.unshift(newConv);
      }),
      switchMap(() => this.messageService.addMessage(userMessage)),
      tap(savedUserMsg => Object.assign(userMessage, savedUserMsg)),
      switchMap(() => this.gemini.progressConversation(userMessage.content)),
      switchMap(geminiResponse => {
        const machineContentHtml = marked(geminiResponse).toString();
        const newMachineMessage: Message = {
          content: machineContentHtml, conversation: this.selectedConversation!.id!, type: 'machine', timestamp: new Date()
        };
        return this.messageService.addMessage(newMachineMessage);
      }),
      tap(savedMachineMessage => {
        if(savedMachineMessage) this.selectedConversation!.messages!.push(savedMachineMessage);
      }),
      catchError(err => {
        console.error('Error en el flujo de nueva conversación:', err);
        return of(null);
      }),
      finalize(() => this.isLoading = false)
    ).subscribe();
    this.subscriptions.add(sub);
  }

  /**
   * @private
   * @method handleExistingConversation
   * @description
   * Lógica para cuando se envía un mensaje en una conversación ya existente.
   * 1. Añade el mensaje a la UI de forma optimista.
   * 2. Guarda el mensaje del usuario en la BBDD.
   * 3. Pide una respuesta a la IA, enviando el historial.
   * 4. Guarda la respuesta de la IA y la añade a la UI.
   * @param {Message} userMessage - El mensaje del usuario.
   * @returns {void}
   */
  private handleExistingConversation(userMessage: Message): void {
      userMessage.conversation = this.selectedConversation!.id!;
      this.selectedConversation!.messages!.push(userMessage);
      this.scrollToBottom();

      const history = this.selectedConversation!.messages!.slice(0, -1).map(m => `${m.type}: ${this.cleanHtmlText(m.content)}`).join('\n');
      const fullPrompt = `${history}\nuser: ${userMessage.content}`;

      const sub = this.messageService.addMessage(userMessage).pipe(
          tap(savedUserMsg => Object.assign(userMessage, savedUserMsg)),
          switchMap(() => this.gemini.progressConversation(fullPrompt)),
          switchMap(geminiResponse => {
              const machineContentHtml = marked(geminiResponse).toString();
              const newMachineMessage: Message = {
                  content: machineContentHtml, conversation: this.selectedConversation!.id!, type: 'machine', timestamp: new Date()
              };
              return this.messageService.addMessage(newMachineMessage);
          }),
          tap(savedMachineMessage => {
            if(savedMachineMessage) this.selectedConversation!.messages!.push(savedMachineMessage);
          }),
          catchError(err => {
              console.error('Error en el flujo de conversación existente:', err);
              this.selectedConversation!.messages!.pop();
              return of(null);
          }),
          finalize(() => this.isLoading = false)
      ).subscribe();
      this.subscriptions.add(sub);
  }

  /**
   * @method cleanHtmlText
   * @description Convierte una cadena HTML a texto plano para ser usada en los prompts de la IA.
   * @param {string} htmlString - La cadena de texto con formato HTML.
   * @returns {string} La cadena de texto limpia.
   */
  public cleanHtmlText(htmlString: string): string {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;
    return tempDiv.textContent || tempDiv.innerText || "";
  }

  /**
   * @method createConversation
   * @description Resetea el estado para iniciar una nueva conversación vacía.
   * @returns {void}
   */
  public createConversation(): void {
    this.chatStateService.clearConversationItem();
    this.selectedConversation = null;
    this.showConversationMenu = false;
  }

  /**
   * @method toggleConversationMenu
   * @description Muestra u oculta el menú contextual (editar/borrar) para una conversación.
   * @param {MouseEvent} event - El evento del clic para posicionar el menú.
   * @param {number} conversationId - El ID de la conversación.
   * @returns {void}
   */
  public toggleConversationMenu(event: MouseEvent, conversationId: number): void {
    event.stopPropagation();
    if (this.activeConversationIdForMenu === conversationId) {
      this.showConversationMenu = false;
      this.activeConversationIdForMenu = null;
    } else {
      this.activeConversationIdForMenu = conversationId;
      this.showConversationMenu = true;
    }
  }

  /**
   * @method onClickOutsideMenu
   * @description Cierra cualquier menú o modal abierto si se hace clic fuera de ellos.
   * @returns {void}
   */
  public onClickOutsideMenu(): void {
    if (this.showConversationMenu) {
      this.showConversationMenu = false;
      this.activeConversationIdForMenu = null;
    }
    if (this.showEditModal) this.cancelEdit();
    if (this.showDeleteConfirmModal) this.cancelDelete();
  }

  /**
   * @method deleteConversation
   * @description Prepara y muestra el modal de confirmación para eliminar una conversación.
   * @param {number} conversationId - El ID de la conversación a eliminar.
   * @returns {void}
   */
  public deleteConversation(conversationId: number): void {
    const conversation = this.userConversations.find(c => c.id === conversationId);
    if (conversation) {
      this.conversationToDelete = conversation;
      this.showDeleteConfirmModal = true;
      this.showConversationMenu = false;
    }
  }

  /**
   * @method confirmDelete
   * @description Ejecuta la eliminación de la conversación tras la confirmación del usuario.
   * @returns {void}
   */
  public confirmDelete(): void {
    if (this.conversationToDelete?.id) {
      this.isDeletingLoading = true;
      const sub = this.conversationService.deleteConversation(this.conversationToDelete.id).pipe(
        finalize(() => this.isDeletingLoading = false)
      ).subscribe({
        next: () => {
          this.userConversations = this.userConversations.filter(c => c.id !== this.conversationToDelete!.id);
          if (this.selectedConversation?.id === this.conversationToDelete!.id) {
            this.createConversation();
          }
          this.closeDeleteConfirmModal();
        },
        error: (err) => console.error(`Error deleting conversation`, err)
      });
      this.subscriptions.add(sub);
    }
  }

  /**
   * @method cancelDelete
   * @description Cancela el proceso de borrado y cierra el modal de confirmación.
   * @returns {void}
   */
  public cancelDelete(): void {
    this.closeDeleteConfirmModal();
  }

  /**
   * @private
   * @method closeDeleteConfirmModal
   * @description Cierra el modal de confirmación de borrado y resetea su estado.
   * @returns {void}
   */
  private closeDeleteConfirmModal(): void {
    this.showDeleteConfirmModal = false;
    this.conversationToDelete = null;
    this.isDeletingLoading = false;
  }

  /**
   * @method editConversation
   * @description Prepara y muestra el modal para editar el título de una conversación.
   * @param {number} conversationId - El ID de la conversación a editar.
   * @returns {void}
   */
  public editConversation(conversationId: number): void {
    const conversation = this.userConversations.find(c => c.id === conversationId);
    if (conversation) {
      this.conversationToEdit = { ...conversation };
      this.editedTitle = conversation.title;
      this.showEditModal = true;
      this.showConversationMenu = false;
    }
  }

  /**
   * @method saveEditedConversation
   * @description Guarda los cambios del título de una conversación y actualiza la UI.
   * @returns {void}
   */
  public saveEditedConversation(): void {
    if (this.conversationToEdit && this.editedTitle.trim()) {
      this.isEditingLoading = true;
      const updatedConversation = { ...this.conversationToEdit, title: this.editedTitle.trim() };

      const sub = this.conversationService.editConversation(updatedConversation.id!, updatedConversation).pipe(
        finalize(() => this.isEditingLoading = false)
      ).subscribe({
        next: (response) => {
          const index = this.userConversations.findIndex(c => c.id === response.id);
          if (index !== -1) this.userConversations[index] = response;
          if (this.selectedConversation?.id === response.id) {
            this.selectedConversation = response;
            this.chatStateService.setConversationItem(response);
          }
          this.closeEditModal();
        },
        error: (err) => console.error('Error updating conversation:', err)
      });
      this.subscriptions.add(sub);
    }
  }

  /**
   * @method cancelEdit
   * @description Cancela el proceso de edición y cierra el modal.
   * @returns {void}
   */
  public cancelEdit(): void {
    this.closeEditModal();
  }

  /**
   * @private
   * @method closeEditModal
   * @description Cierra el modal de edición y resetea su estado.
   * @returns {void}
   */
  private closeEditModal(): void {
    this.showEditModal = false;
    this.conversationToEdit = null;
    this.editedTitle = '';
    this.isEditingLoading = false;
  }
}
