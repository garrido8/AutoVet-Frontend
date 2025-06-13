import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { catchError, finalize, switchMap, tap } from 'rxjs/operators'; // 'takeUntil' no se utiliza en el código proporcionado
import { marked } from 'marked';

// Servicios
import { GeminiService } from '../../../services/gemini.service';
import { AnswersService } from '../../../services/answers.service';
import { UserInfoService } from '../../../services/user-info.service';
import { AuthService } from '../../../services/auth.service';
import { PetService } from '../../../services/pet.service';
import { MessageService } from '../../../services/message.service';
import { ConversationService } from '../../../services/conversation.service';
import { ChatStateService } from '../../../services/chatstate.service';
import { KeywordsService } from '../../../services/keywords.service';

// Interfaces
import { Answer } from '../../../interfaces/answer.interface';
import { Pet } from '../../../interfaces/pet.interface';
import { Message } from '../../../interfaces/message.interface';
import { Conversation } from '../../../interfaces/conversation.interface';
import { of, Subscription } from 'rxjs';
import { Router } from '@angular/router';

/**
 * @class DiagnosisComponent
 * @description Componente principal para la funcionalidad de diagnóstico y conversación con un modelo de IA (Gemini).
 * Permite a los usuarios interactuar con un chatbot para obtener diagnósticos o información,
 * guardar respuestas en una base de datos de "respuestas" (Answers),
 * iniciar conversaciones persistentes en el chat, y navegar al foro con palabras clave.
 * Soporta la personalización del prompt si el usuario tiene mascotas registradas.
 */
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

  /**
   * @private
   * @property {GeminiService} gemini - Servicio inyectado para interactuar con el modelo de IA de Gemini.
   */
  private gemini = inject(GeminiService);

  /**
   * @private
   * @property {AnswersService} answersService - Servicio inyectado para gestionar las respuestas generadas por la IA.
   */
  private answersService = inject( AnswersService );

  /**
   * @private
   * @property {UserInfoService} UserInfoService - Servicio inyectado para obtener información del usuario actual (ej. token).
   */
  private UserInfoService = inject( UserInfoService );

  /**
   * @private
   * @property {AuthService} authService - Servicio inyectado para gestionar la autenticación y obtener datos de usuario.
   */
  private authService = inject( AuthService );

  /**
   * @private
   * @property {PetService} petService - Servicio inyectado para obtener y gestionar información de las mascotas.
   */
  private petService = inject( PetService );

  /**
   * @private
   * @property {MessageService} messagesService - Servicio inyectado para gestionar los mensajes en una conversación.
   */
  private messagesService = inject( MessageService );

  /**
   * @private
   * @property {ConversationService} conversationsService - Servicio inyectado para gestionar las conversaciones persistentes.
   */
  private conversationsService = inject( ConversationService );

  /**
   * @private
   * @property {Router} route - Servicio inyectado para la navegación programática.
   */
  private route = inject( Router );

  /**
   * @private
   * @property {ChatStateService} chatStateService - Servicio inyectado para compartir el estado de la conversación entre componentes.
   */
  private chatStateService = inject( ChatStateService );

  /**
   * @private
   * @property {KeywordsService} keywordsService - Servicio inyectado para gestionar palabras clave para el foro.
   */
  private keywordsService = inject( KeywordsService );

  /**
   * @public
   * @property {boolean} isLoading - Bandera que indica si una petición a la IA está en curso.
   * Controla la visualización de un spinner o indicador de carga.
   */
  public isLoading: boolean = false;

  /**
   * @public
   * @property {ElementRef} promptValue - Referencia directa al elemento HTML del input del prompt.
   * Permite acceder al valor del input directamente.
   */
  @ViewChild('promptValue') promptValue?: ElementRef;

  /**
   * @public
   * @property {ElementRef} responseContainer - Referencia directa al contenedor HTML donde se muestra la respuesta de la IA.
   * Se utiliza para aplicar animaciones (ej. mostrar/ocultar).
   */
  @ViewChild('responseContainer') responseContainer?: ElementRef;

  /**
   * @public
   * @property {string} responseText - Almacena la respuesta raw de la IA antes de ser formateada.
   */
  public responseText: string = '';

  /**
   * @public
   * @property {string} formattedResponse - Almacena la respuesta de la IA después de ser convertida de Markdown a HTML.
   */
  public formattedResponse: string = '';

  /**
   * @public
   * @property {string} promptValueText - (Nota: Esta propiedad no se utiliza directamente en el `sendPrompt` actual,
   * se usa `promptValue?.nativeElement.value` directamente. Podría eliminarse o usarse para binding si fuera necesario).
   */
  public promptValueText: string = '';

  /**
   * @public
   * @property {Pet[]} userPets - Array de mascotas del usuario logueado.
   * Se carga en `ngOnInit` si el usuario es un cliente.
   */
  public userPets: Pet[] = [];

  /**
   * @public
   * @property {Pet | undefined} selectedPet - La mascota seleccionada por el usuario para personalizar el prompt.
   */
  public selectedPet?: Pet;

  /**
   * @private
   * @property {boolean} selected - Bandera interna para saber si una mascota está seleccionada.
   */
  private selected: boolean = false;

  /**
   * @public
   * @property {boolean} isUser - Bandera que indica si el usuario logueado es un cliente.
   * Si es `false`, el usuario es staff y no tiene mascotas asociadas.
   */
  public isUser: boolean = false;

  /**
   * @private
   * @property {Message | null} userMessage - Objeto que representa el mensaje enviado por el usuario en la sesión actual.
   * Se utiliza para persistir la conversación.
   */
  private userMessage: Message | null = null;

  /**
   * @private
   * @property {Message | null} aiMessage - Objeto que representa el mensaje de respuesta de la IA en la sesión actual.
   * Se utiliza para persistir la conversación.
   */
  private aiMessage: Message | null = null;

  /**
   * @private
   * @property {Subscription} subscriptions - Objeto para gestionar todas las suscripciones de RxJS.
   * Permite desuscribirse de todas las suscripciones activas en `ngOnDestroy`.
   */
  private subscriptions = new Subscription();

  /**
   * @private
   * @property {string} answerKeywords - Almacena las palabras clave extraídas de la respuesta de la IA.
   * Se utiliza para la navegación al foro.
   */
  private answerKeywords: string = '';

  /**
   * @method ngOnInit
   * @description Hook del ciclo de vida que se ejecuta después de que se inicializan las propiedades enlazadas a datos del componente.
   * Realiza las siguientes operaciones al iniciar el componente:
   * 1. Obtiene el token del usuario actual.
   * 2. Intenta obtener la información del usuario por email.
   * 3. Si se encuentra un usuario (cliente), establece `isUser` a `true` y obtiene las mascotas asociadas a ese usuario.
   * 4. Si no se encuentra un usuario, establece `isUser` a `false`.
   */
  ngOnInit(): void {
    const userSubscription = this.authService.getUserPerEmail(this.UserInfoService.getToken()!).pipe(
      switchMap(user => {
        if (!user || user.length === 0) {
          this.isUser = false;
          return of([]); // Retorna un observable vacío para continuar el flujo
        }
        this.isUser = true;
        // Si el usuario es un cliente, obtiene sus mascotas
        const petSubscription = this.petService.getPetByOwner(user[0].id!)
          .subscribe(pets => {
            this.userPets = pets;
          });
        this.subscriptions.add(petSubscription); // Añade la suscripción de mascotas al gestor
        return of(null); // Retorna un observable para completar el flujo principal
      })
    ).subscribe();
    this.subscriptions.add(userSubscription); // Añade la suscripción del usuario al gestor
  }

  /**
   * @method ngOnDestroy
   * @description Hook del ciclo de vida que se ejecuta cuando el componente se destruye.
   * Desuscribe todas las suscripciones de RxJS gestionadas por el objeto `subscriptions`
   * para evitar fugas de memoria y posibles efectos secundarios.
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * @public
   * @method sendPrompt
   * @description Envía el prompt del usuario al modelo de IA (Gemini) y procesa la respuesta.
   * 1. Prepara el mensaje del usuario, incluyendo detalles de la mascota si una está seleccionada.
   * 2. Muestra un indicador de carga y limpia las respuestas anteriores.
   * 3. Llama al servicio `GeminiService` para obtener una respuesta formal.
   * 4. Procesa la respuesta de la IA: la almacena, la formatea de Markdown a HTML,
   * y la muestra en el contenedor de respuesta con una animación.
   * 5. Maneja los errores en caso de que la petición a la IA falle.
   */
  public sendPrompt(): void {
    const userMessage: Message = {
      content: this.responseText, // Content se sobrescribe después
      timestamp: new Date(),
      type: 'user',
      conversation: 0 // Se actualizará si se guarda la conversación
    };

    let prompt: string = '';

    this.isLoading = true;
    this.responseText = ''; // Limpia la respuesta anterior
    this.formattedResponse = ''; // Limpia la respuesta formateada anterior
    if (this.responseContainer) {
      this.responseContainer.nativeElement.classList.remove('show'); // Oculta la respuesta anterior (si hay animación)
    }

    // Construye el prompt, añadiendo la información de la mascota si hay una seleccionada
    if (this.selected) {
      prompt = `Mi mascota es un ${this.selectedPet?.especie}, de raza ${this.selectedPet?.raza}, ` +
               `se llama ${this.selectedPet?.nombre}, tiene ${this.selectedPet?.edad} años y pesa ${this.selectedPet?.peso} kg. ` +
               `. ${this.promptValue?.nativeElement.value}`;
    } else {
      prompt = this.promptValue?.nativeElement.value;
    }

    // Actualiza el contenido del mensaje del usuario con el prompt final
    userMessage.content = prompt;
    this.userMessage = userMessage;

    // Realiza la llamada al servicio Gemini
    this.gemini.formalConversation(prompt)
      .pipe(
        finalize(() => this.isLoading = false), // Siempre se ejecuta al finalizar (éxito o error)
        catchError(err => { // Captura errores de la llamada a Gemini
          console.error('Error generando contenido:', err);
          this.responseText = 'Hubo un error procesando su solicitud. Por favor, inténtelo de nuevo.';
          this.formattedResponse = ''; // Limpia la respuesta formateada en caso de error
          if (this.responseContainer) {
            this.responseContainer.nativeElement.classList.add('show'); // Muestra el mensaje de error
          }
          return of(''); // Retorna un observable que emite una cadena vacía y se completa para no romper el pipe
        })
      )
      .subscribe({
        next: response => {
          if (response) { // Solo procesar si hay una respuesta válida
            this.responseText = response;
            this.formattedResponse = marked(response).toString(); // Convierte Markdown a HTML
            this.gemini.getKeyWords(response).subscribe(response => {
              this.answerKeywords = response;
            })

            const aiMessage: Message = {
              content: this.formattedResponse,
              timestamp: new Date(),
              type: 'machine',
              conversation: 0 // Se actualizará si se guarda la conversación
            };
            this.aiMessage = aiMessage;

            // Añade la clase 'show' para disparar la animación de aparición
            if (this.responseContainer) {
              this.responseContainer.nativeElement.classList.add('show');
            }
          }
        }
        // El error ya se maneja en el catchError del pipe
      });
  }

  /**
   * @public
   * @method addAnswer
   * @description Agrega la respuesta actual de la IA como una "Answer" (respuesta) a la base de datos.
   * 1. Obtiene el email del usuario logueado.
   * 2. Crea un objeto `Answer` con el contenido de la respuesta y el email del usuario.
   * 3. Llama al servicio `GeminiService` para extraer palabras clave de la respuesta.
   * 4. Una vez obtenidas las palabras clave, las asigna al objeto `Answer` y luego
   * llama al servicio `AnswersService` para agregar la respuesta.
   */
  public addAnswer(): void {
    const email = this.UserInfoService.getToken(); // Asume que el token es el email
    const answer: Answer = {
      time: new Date(),
      content: this.responseText,
      keywords: '', // Las palabras clave se añadirán después
      votes: 0,
      votedEmails: '',
      userEmail: email || 'Anónimo', // Si no hay email, se usa 'Anónimo'
      topAnswer: false
    };

    // Obtiene las palabras clave de Gemini antes de añadir la respuesta
    this.gemini.getKeyWords(this.responseText)
      .pipe(
        tap(words => answer.keywords = words), // Asigna las palabras clave al objeto answer
        tap( words => this.answerKeywords = words ), // Almacena también en una propiedad del componente
        switchMap(() => this.answersService.addAnswer(answer)), // Luego, añade la respuesta
        catchError(error => { // Manejo de errores para la adición de la respuesta
          console.error('Error al agregar respuesta o al obtener palabras clave', error);
          return of(null); // Retorna un observable que emite null y se completa
        })
      )
      .subscribe(
        response => {
          if (response) {
            console.log('Respuesta agregada correctamente:', response);
          }
        }
        // El error ya se maneja en el catchError del pipe
      );
  }

  /**
   * @public
   * @method selectPet
   * @description Gestiona la selección/deselección de una mascota para personalizar el prompt.
   * Si la mascota pasada es la misma que la ya seleccionada, la deselecciona.
   * Si es una mascota diferente o ninguna estaba seleccionada, selecciona la nueva mascota.
   * @param {Pet} pet - El objeto mascota que se ha seleccionado o deseleccionado.
   */
  public selectPet(pet: Pet): void {
    if ( this.selectedPet?.pk === pet.pk ) { // Compara por ID para evitar problemas de referencia de objeto
      this.selectedPet = undefined;
      this.selected = false;
    } else {
      this.selectedPet = pet;
      this.selected = true;
    }
  }

  /**
   * @private
   * @method removeCommas
   * @description Elimina todas las comas de una cadena de texto.
   * @param {string} text - La cadena de texto de entrada.
   * @returns {string} La cadena de texto sin comas.
   */
  private removeCommas( text: string ): string {
    return text.replace(/,/g, '');
  }

  /**
   * @public
   * @method goToForum
   * @description Navega a la página del foro, pasando las palabras clave de la última respuesta de la IA.
   * Las palabras clave se limpian de comas antes de ser enviadas al servicio.
   */
  public goToForum(): void {
    const words = this.removeCommas( this.answerKeywords );
    this.keywordsService.setKeywords( words ); // Establece las palabras clave en el servicio compartido
    this.route.navigate(['/forum']); // Navega al foro
  }

  /**
   * @public
   * @method goToChatBot
   * @description Inicia un flujo para guardar la conversación actual con la IA y navegar al chat.
   * Este método realiza una secuencia de operaciones RxJS:
   * 1. Verifica que `userMessage` y `aiMessage` estén definidos.
   * 2. Obtiene la información del usuario por email.
   * 3. Obtiene un título para la conversación de Gemini (con un fallback si falla).
   * 4. Crea una nueva conversación en el backend.
   * 5. Asigna el ID de la conversación a los mensajes de usuario y de IA.
   * 6. Almacena la conversación creada en `ChatStateService`.
   * 7. Agrega el mensaje del usuario al backend.
   * 8. Agrega el mensaje de la IA al backend.
   * 9. Navega a la ruta '/chat' si todas las operaciones son exitosas.
   * Maneja errores en cada paso y usa `finalize` para limpiar.
   */
  public goToChatBot(): void {
    // Asegura que los mensajes de usuario y IA estén definidos antes de iniciar el flujo
    if (!this.userMessage || !this.aiMessage) {
      console.error('Error de inicialización: El mensaje de usuario o de IA no está definido. Asegúrese de que estén configurados antes de llamar a goToChatBot().');
      // Opcional: mostrar un mensaje amigable al usuario en el frontend
      return;
    }

    // Añade la suscripción principal al gestor de suscripciones del componente
    this.subscriptions.add(
      this.authService.getUserPerEmail(this.UserInfoService.getToken()!).pipe(
        // Verifica que el usuario y su ID existan
        tap(user => {
          if (!user || user.length === 0 || !user[0].id) {
            console.error('Error al obtener usuario: Usuario no encontrado o ID de usuario faltante después de buscar por correo electrónico. Datos de usuario:', user);
            throw new Error('Usuario no encontrado o ID faltante.'); // Lanza un error para ser capturado por catchError
          }
        }),
        // Obtiene el título de la conversación de Gemini
        switchMap(user => {
          return this.gemini.getConvsersationTitle(this.userMessage!.content).pipe(
            catchError(error => {
              console.error('Error del título de Gemini: No se pudo obtener el título de la conversación de Gemini. Usando título predeterminado.', error);
              return of('Conversación con el veterinario (Título por defecto)'); // Título de fallback
            }),
            // Una vez que tenemos el título, creamos la conversación
            switchMap(title => {
              const conversation: Conversation = {
                client: user[0].id!,
                client_name: user[0].name,
                title: title, // Usa el título obtenido de Gemini
                created_at: new Date(),
              };
              console.log('Intentando crear conversación:', conversation);
              return this.conversationsService.addConversation(conversation);
            })
          );
        }),
        // Procesa la respuesta de la creación de la conversación
        tap(conversationResponse => {
          if (!conversationResponse || !conversationResponse.id) {
            console.error('Error al crear conversación: El backend no devolvió un objeto de Conversación válido con un ID. Respuesta:', conversationResponse);
            throw new Error('Falta el ID de la conversación en la respuesta del backend.'); // Propaga el error
          }
          console.log('Conversación creada exitosamente con ID:', conversationResponse.id);
          this.userMessage!.conversation = conversationResponse.id; // Asigna el ID de la conversación al mensaje del usuario
          this.aiMessage!.conversation = conversationResponse.id; // Asigna el ID de la conversación al mensaje de la IA
          // Almacena la conversación creada en el servicio compartido para acceder desde el chat
          this.chatStateService.setConversationItem(conversationResponse);
        }),
        // Agrega el mensaje del usuario a la conversación
        switchMap(() => {
          console.log('Intentando agregar mensaje de usuario:', this.userMessage);
          return this.messagesService.addMessage(this.userMessage!).pipe(
            tap(() => console.log('Mensaje de usuario agregado correctamente')),
            catchError(error => {
              console.error('Error de mensaje de usuario: Error al agregar mensaje de usuario', error);
              throw error; // Lanza el error para ser capturado por el catchError externo
            })
          );
        }),
        // Agrega el mensaje de la IA a la conversación
        switchMap(() => {
          console.log('Intentando agregar mensaje de IA:', this.aiMessage);
          return this.messagesService.addMessage(this.aiMessage!).pipe(
            tap(() => console.log('Mensaje de IA agregado correctamente')),
            catchError(error => {
              console.error('Error de mensaje de IA: Error al agregar mensaje de IA', error);
              throw error; // Lanza el error para ser capturado por el catchError externo
            })
          );
        }),
        // Si todo es exitoso, navega a la página del chat
        tap(() => {
          console.log('Todas las operaciones exitosas. Navegando a /chat.');
          this.route.navigate(['/chat']);
        }),
        // Manejo de errores general para todo el flujo
        catchError(error => {
          console.error('Error en el flujo de inicialización del ChatBot:', error);
          // Opcional: mostrar un mensaje amigable al usuario en el frontend
          // this.errorMessage = 'No se pudo iniciar el chat. Por favor, inténtelo de nuevo.';
          return of(null); // Asegura que el observable se complete elegantemente después de un error
        }),
        // Se ejecuta siempre, independientemente del éxito o error
        finalize(() => console.log('Flujo de inicialización del Chatbot completado.'))
      ).subscribe() // El subscribe() final que ejecuta el flujo
    );
  }
}
