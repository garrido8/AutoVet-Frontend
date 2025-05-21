import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { catchError, finalize, switchMap, takeUntil, tap } from 'rxjs/operators';
import { marked } from 'marked';

import { GeminiService } from '../../../services/gemini.service';
import { AnswersService } from '../../../services/answers.service';
import { Answer } from '../../../interfaces/answer.interface';
import { UserInfoService } from '../../../services/user-info.service';
import { of, Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { PetService } from '../../../services/pet.service';
import { Pet } from '../../../interfaces/pet.interface';
import { Message } from '../../../interfaces/message.interface';
import { MessageService } from '../../../services/message.service';
import { ConversationService } from '../../../services/conversation.service';
import { Conversation } from '../../../interfaces/conversation.interface';
import { Router } from '@angular/router';

@Component({
  selector: 'app-diagnosis',
  standalone: true,
  templateUrl: './diagnosis.component.html',
  styleUrl: './diagnosis.component.css',
  imports: [
    CommonModule,
    FormsModule
  ]
})
export class DiagnosisComponent implements OnInit, OnDestroy {

  private gemini = inject(GeminiService);
  private answersService = inject( AnswersService )
  private UserInfoService = inject( UserInfoService )
  private authService = inject( AuthService )
  private petService = inject( PetService )
  private messagesService = inject( MessageService )
  private conversationsService = inject( ConversationService )
  private route = inject( Router )

  public isLoading: boolean = false;

  @ViewChild('promptValue') promptValue?: ElementRef;
  @ViewChild('responseContainer') responseContainer?: ElementRef; // Get a reference to the response container

  public responseText: string = '';
  public formattedResponse: string = '';
  public promptValueText: string = '';
  public userPets: Pet[] = [];
  public selectedPet?: Pet
  private selected: boolean = false
  public isUser: boolean = false

  private userMessage: Message | null = null;
  private aiMessage: Message | null = null;

  private subscriptions = new Subscription();

  ngOnInit(): void {
    const userSubscription = this.authService.getUserPerEmail(this.UserInfoService.getToken()!).pipe(
      switchMap(user => {
        if (!user || user.length === 0) {
          this.isUser = false
          return of([]);
        }
        this.isUser = true
        const petSubscription = this.petService.getPetByOwner(user[0].id!)
          .subscribe(pets => {
            this.userPets = pets;
          });
        this.subscriptions.add(petSubscription);
        return of(null);
      })
    ).subscribe();
    this.subscriptions.add(userSubscription);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public sendPrompt() {
    const userMessage: Message = {
      content: this.responseText,
      timestamp: new Date(),
      type: 'user',
      conversation: 0
    }


    let prompt: string = '';

    this.isLoading = true;
    this.responseText = ''; // Clear previous response
    this.formattedResponse = '';
    if (this.responseContainer) {
      this.responseContainer.nativeElement.classList.remove('show'); // Hide previous response
    }

    if( this.selected ) {
      prompt = 'Mi mascota es un ' + this.selectedPet?.especie +
               ' ,de raza ' + this.selectedPet?.raza +
               ' ,se llama ' + this.selectedPet?.nombre +
               ' ,tiene ' + this.selectedPet?.edad + ' años. ' +
               ' y pesa ' + this.selectedPet?.peso + ' kg. ' +
               '. ' + this.promptValue?.nativeElement.value;
    } else {
      prompt = this.promptValue?.nativeElement.value;
    }

    userMessage.content = prompt;

    this.userMessage = userMessage;

    this.gemini.formalConversation(prompt)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: response => {
          // this.addAnswer( response )#ff6666
          this.responseText = response;
          this.formattedResponse = marked(response).toString(); // Convert Markdown to HTML

          const aiMessage: Message = {
            content: this.formattedResponse,
            timestamp: new Date(),
            type: 'machine',
            conversation: 0
          }

          this.aiMessage = aiMessage;
          // Add the 'show' class to trigger the animation
          if (this.responseContainer) {
            this.responseContainer.nativeElement.classList.add('show');
          }
        },
        error: err => {
          console.error('Error generating content:', err);
          this.responseText = 'There was an error processing your request.';
          this.formattedResponse = ''; // Clear formatted response on error
          // Optionally, still show an error message in the response container
          if (this.responseContainer) {
            this.responseContainer.nativeElement.classList.add('show');
          }
        }
      });
  }

  public addAnswer(response: string): void {
    const email = this.UserInfoService.getToken();
    const answer: Answer = {
      time: new Date(),
      content: response,
      keywords: '',
      votes: 0,
      votedEmails: '',
      userEmail: email || 'Anónimo'
    };

    this.gemini.getKeyWords(response)
      .pipe(
        tap(words => answer.keywords = words),
        switchMap(() => this.answersService.addAnswer(answer))
      )
      .subscribe(
        response => console.log('Respuesta agregada correctamente'),
        error => console.error('Error al agregar respuesta', error)
      );
  }

  public selectPet(pet: Pet): void {
    if( this.selectedPet !== pet ) {
      this.selectedPet = pet;
      this.selected = true
    } else {
      this.selectedPet = undefined;
      this.selected = false
    }
  }

  public goToChatBot(): void {
    // Ensure userMessage and aiMessage are defined before proceeding
    if (!this.userMessage || !this.aiMessage) {
      console.error('Initialization Error: User or AI message is not defined. Please ensure they are set before calling goToChatBot().');
      // Optionally, show a user-friendly message to the frontend
      return;
    }

    this.subscriptions.add(
      this.authService.getUserPerEmail(this.UserInfoService.getToken()!).pipe(
        tap(user => {
          if (!user || user.length === 0 || !user[0].id) {
            console.error('User Fetch Error: User not found or user ID is missing after fetching by email. User data:', user);
            throw new Error('User not found or ID missing.'); // Throw an error to be caught by the outer catchError
          }
        }),
        switchMap(user => {
          // NEW: Get conversation title from Gemini Service first
          return this.gemini.getConvsersationTitle(this.userMessage!.content).pipe(
            catchError(error => {
              console.error('Gemini Title Error: Could not get conversation title from Gemini. Using default title.', error);
              // Fallback title if Gemini call fails
              return of('Conversación con el veterinario (Título por defecto)');
            }),
            switchMap(title => {
              const conversation: Conversation = {
                client: user[0].id!,
                client_name: user[0].name,
                title: title, // Use the title received from Gemini
                created_at: new Date(),
              };
              console.log('Attempting to create conversation:', conversation);
              return this.conversationsService.addConversation(conversation);
            })
          );
        }),
        tap(conversationResponse => {
          if (!conversationResponse || !conversationResponse.id) {
            console.error('Conversation Creation Error: Backend did not return a valid Conversation object with an ID. Response:', conversationResponse);
            throw new Error('Conversation ID missing from backend response.'); // Propagate error
          }
          console.log('Conversation created successfully with ID:', conversationResponse.id);
          this.userMessage!.conversation = conversationResponse.id!;
          this.aiMessage!.conversation = conversationResponse.id!;
        }),
        switchMap(() => {
          console.log('Attempting to add user message:', this.userMessage);
          return this.messagesService.addMessage(this.userMessage!).pipe(
            tap(() => console.log('Mensaje de usuario agregado correctamente')),
            catchError(error => {
              console.error('User Message Error: Error al agregar mensaje de usuario', error);
              throw error; // Throw to be caught by the outer catchError
            })
          );
        }),
        switchMap(() => {
          console.log('Attempting to add AI message:', this.aiMessage);
          return this.messagesService.addMessage(this.aiMessage!).pipe(
            tap(() => console.log('Mensaje de IA agregado correctamente')),
            catchError(error => {
              console.error('AI Message Error: Error al agregar mensaje de IA', error);
              throw error; // Throw to be caught by the outer catchError
            })
          );
        }),
        tap(() => {
          console.log('All operations successful. Navigating to /chat.');
          this.route.navigate(['/chat']);
        }),
        catchError(error => {
          console.error('ChatBot Flow Error: An error occurred during the chatbot initialization process.', error);
          // General error handling: show a user-friendly message to the frontend
          // e.g., this.errorMessage = 'Failed to start chat. Please try again.';
          return of(null); // Ensure the observable completes gracefully after an error
        }),
        finalize(() => console.log('Chatbot initialization flow completed.')) // Always runs when the observable completes or errors
      ).subscribe() // No need for specific next/error callbacks here as handled by tap/catchError in pipe
    );
  }



}
