// forum-page.component.ts
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { marked } from 'marked';

import { AnswersService } from '../../../services/answers.service';
import { UserInfoService } from '../../../services/user-info.service';
import { KeywordsService } from '../../../services/keywords.service';
import { VoteService } from './services/vote.service'; // Importa el nuevo servicio
import { Answer } from '../../../interfaces/answer.interface';

/**
 * @class ForumPageComponent
 * @description Este componente muestra una lista de respuestas del foro, permitiendo a los usuarios buscar, votar y ver los detalles completos de la respuesta.
 * Se integra con varios servicios para obtener datos, gestionar la información del usuario y manejar la lógica de votación.
 */
@Component({
  selector: 'app-forum-page',
  standalone: true,
  templateUrl: './forum-page.component.html',
  styleUrl: './forum-page.component.css',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ],
})
export class ForumPageComponent implements OnInit, OnDestroy {

  /**
   * @private
   * @property {Subscription} subscriptions - Gestiona todas las suscripciones de RxJS para evitar fugas de memoria.
   */
  private subscriptions = new Subscription();

  /**
   * @private
   * @property {AnswersService} answersService - Servicio inyectado para interactuar con los datos de las respuestas.
   */
  private answersService = inject( AnswersService );

  /**
   * @private
   * @property {UserInfoService} userInfoService - Servicio inyectado para obtener información del usuario actual.
   */
  private userInfoService = inject( UserInfoService );

  /**
   * @private
   * @property {KeywordsService} keywordsService - Servicio inyectado para gestionar las palabras clave de búsqueda.
   */
  private keywordsService = inject( KeywordsService );

  /**
   * @private
   * @property {VoteService} voteService - Servicio inyectado para manejar la lógica relacionada con los votos.
   */
  private voteService = inject( VoteService );

  /**
   * @public
   * @property {Answer[]} allAnswers - Almacena la lista completa de respuestas obtenidas del backend.
   */
  public allAnswers: Answer[] = [];

  /**
   * @public
   * @property {Answer[]} filteredAnswers - Almacena la lista de respuestas después de aplicar los filtros de búsqueda y ordenación.
   */
  public filteredAnswers: Answer[] = [];

  /**
   * @public
   * @property {string} searchTerm - Se enlaza con el campo de entrada de búsqueda.
   */
  public searchTerm: string = '';

  /**
   * @public
   * @property {boolean} showLoginRequiredModal - Controla la visibilidad del modal de "inicio de sesión requerido".
   */
  public showLoginRequiredModal: boolean = false;

  /**
   * @private
   * @property {string} currentUserEmail - Getter para el correo electrónico del usuario actualmente logueado.
   * @returns {string} El correo electrónico del usuario actual, o una cadena vacía si no está disponible.
   */
  private get currentUserEmail(): string {
    return this.userInfoService.getToken() || '';
  }

  // Estado del Modal
  /**
   * @public
   * @property {boolean} showModal - Controla la visibilidad del modal de respuesta detallada.
   */
  public showModal: boolean = false;

  /**
   * @public
   * @property {Answer | null} selectedAnswer - Almacena la respuesta actualmente mostrada en el modal.
   */
  public selectedAnswer: Answer | null = null;

  /**
   * @public
   * @property {string[]} modalKeywords - Palabras clave asociadas con la respuesta mostrada en el modal.
   */
  public modalKeywords: string[] = [];

  /**
   * @public
   * @property {string} answerContent - Contenido HTML de la respuesta seleccionada, parseado desde Markdown.
   */
  public answerContent: string = '';

  /**
   * @method ngOnInit
   * @description Hook del ciclo de vida que se ejecuta después de que se inicializan las propiedades enlazadas a datos del componente.
   * Se suscribe a las palabras clave y luego obtiene todas las respuestas, inicializando las propiedades relacionadas con los votos.
   */
  ngOnInit(): void {
    this.subscriptions.add(
      this.keywordsService.getKeywords().subscribe( response => {
        if (response && response?.length > 0) {
          this.searchTerm = response;
        }
      })
    );

    this.subscriptions.add(
      this.answersService.getAnswers().subscribe( (data) => {
        this.allAnswers = data;
        this.allAnswers.forEach(answer => {
          // Inicializa las propiedades relacionadas con los votos si faltan o son nulas
          answer.votes = answer.votes ?? 0;
          answer.votedEmails = answer.votedEmails ?? '';
          answer.topAnswer = answer.topAnswer ?? false;

          // Actualiza el estado topAnswer para cada respuesta al cargar
          this._updateTopAnswerStatus(answer);
        });
        this.filteredAnswers = [...this.allAnswers];
        this.performSearch(); // Realiza la búsqueda y ordenación inicial
      })
    );
  }

  /**
   * @method ngOnDestroy
   * @description Hook del ciclo de vida que se ejecuta cuando el componente es destruido.
   * Cancela la suscripción de todas las suscripciones activas para evitar fugas de memoria.
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * @private
   * @method _updateTopAnswerStatus
   * @description Método auxiliar para determinar y establecer el estado `topAnswer` para una respuesta dada.
   * Una respuesta se considera "respuesta principal" si alguno de sus `votedEmails` contiene la subcadena "autovet".
   * Este método solo actualiza el objeto `answer` localmente; la persistencia en el backend debe manejarse por separado.
   * @param {Answer} answer - El objeto de respuesta a actualizar.
   */
  private _updateTopAnswerStatus(answer: Answer): void {
    const votedEmailsArr = this.voteService.parseVotedEmails(answer.votedEmails);
    const hasAutovetVote = votedEmailsArr.some(vote => vote.email.includes('autovet'));
    answer.topAnswer = hasAutovetVote;
  }

  /**
   * @public
   * @method performSearch
   * @description Filtra y ordena las respuestas basándose en el `searchTerm`.
   * Soporta múltiples palabras clave, aplica lógica "AND" para la búsqueda,
   * y ordena las respuestas primero por el estado `topAnswer`, luego por fecha ascendente.
   */
  public performSearch(): void {
    if ( !this.searchTerm.trim() ) {
      this.filteredAnswers = [ ...this.allAnswers ]; // Muestra todas las respuestas si el término de búsqueda está vacío
    } else {
      const searchTerms = this.searchTerm.toLowerCase().split(' ').filter( term => term.length > 0 );

      this.filteredAnswers = this.allAnswers.filter( answer => {
        const answerKeywords = ( answer.keywords || '' )
          .split( /[\s,]+/ ) // Divide por espacios o comas
          .map( k => k.trim().toLowerCase() )
          .filter( k => k.length > 0 );

        return searchTerms.some( searchTerm =>
          answerKeywords.some( answerKeyword => answerKeyword.includes( searchTerm ) )
        );
      } );
    }

    // Aplica la ordenación a las respuestas filtradas (o a todas)
    this.filteredAnswers.sort( ( a, b ) => {
      // Ordenación primaria: topAnswer (true va antes que false)
      if ( a.topAnswer && !b.topAnswer ) {
        return -1;
      }
      if ( !a.topAnswer && b.topAnswer ) {
        return 1;
      }

      // Ordenación secundaria: Si el estado topAnswer es el mismo, ordena por fecha ascendente (más antiguas primero)
      const dateA = new Date( a.time! );
      const dateB = new Date( b.time! );
      return dateA.getTime() - dateB.getTime();
    } );
  }

  /**
   * @public
   * @method getTruncatedContent
   * @description Trunca una cadena de contenido dada a un límite especificado para fines de vista previa.
   * Intenta cortar en la última palabra completa antes del límite.
   * @param {string} content - La cadena de contenido original.
   * @param {number} [limit=150] - La longitud máxima del contenido truncado.
   * @returns {string} El contenido truncado con puntos suspensivos, o el contenido original si es más corto que el límite.
   */
  public getTruncatedContent(content: string, limit: number = 150): string {
    if (!content) return '';
    if (content.length <= limit) return content;
    // Encuentra el último espacio antes del límite para evitar cortar palabras por la mitad
    const lastSpace = content.lastIndexOf(' ', limit);
    return content.substring(0, lastSpace > 0 ? lastSpace : limit) + '...';
  }

  /**
   * @public
   * @method formatAnswerTime
   * @description Formatea una cadena de fecha o un objeto Date en un formato legible "dd/mm/yyyy a las HH:MM".
   * @param {string | Date | undefined} dateInput - La cadena de fecha o el objeto Date a formatear.
   * @returns {string} La cadena de fecha formateada, o 'Fecha inválida' si la entrada no es válida.
   */
  public formatAnswerTime(dateInput: string | Date | undefined): string {
    if (!dateInput) {
      return '';
    }
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} a las ${hours}:${minutes}`;
  }

  /**
   * @public
   * @method getUserVoteType
   * @description Delega en el `VoteService` para obtener el tipo de voto del usuario actual para una respuesta.
   * @param {Answer} answer - El objeto de respuesta a verificar.
   * @returns {'up' | 'down' | null} El tipo de voto del usuario, o `null` si no hay voto.
   */
  public getUserVoteType(answer: Answer): 'up' | 'down' | null {
    return this.voteService.getUserVoteType(this.currentUserEmail, answer.votedEmails);
  }

  /**
   * @public
   * @method voteUp
   * @description Maneja la lógica para una acción de voto positivo (`upvote`) en una respuesta.
   * Actualiza el recuento de votos local y la cadena `votedEmails`,
   * luego envía la respuesta actualizada al backend. Incluye manejo de errores para fallos del backend.
   * @param {Answer} answer - El objeto de respuesta a votar positivamente.
   */
  public voteUp(answer: Answer): void {
    if (!answer || !this.currentUserEmail) {
      console.warn('No se puede votar: Falta la respuesta o el correo electrónico del usuario actual.');
      this.openLoginRequiredModal();
      return;
    }

    let currentVotes = answer.votes ?? 0;
    let votedEmailsArr = this.voteService.parseVotedEmails(answer.votedEmails);
    const userVoteIndex = votedEmailsArr.findIndex(v => v.email === this.currentUserEmail);
    const userHasVoted = userVoteIndex !== -1;
    const userCurrentVoteType = userHasVoted ? votedEmailsArr[userVoteIndex].type : null;

    if (userHasVoted) {
      if (userCurrentVoteType === 'up') {
        currentVotes--;
        votedEmailsArr.splice(userVoteIndex, 1); // Elimina el voto positivo existente
      } else { // userCurrentVoteType === 'down'
        currentVotes += 2; // Cambia de negativo a positivo (deshace -1, añade +1)
        votedEmailsArr[userVoteIndex].type = 'up';
      }
    } else {
      currentVotes++;
      votedEmailsArr.push({ email: this.currentUserEmail, type: 'up' });
    }

    answer.votes = currentVotes;
    answer.votedEmails = this.voteService.serializeVotedEmails(votedEmailsArr);
    this._updateTopAnswerStatus(answer); // Actualiza topAnswer localmente

    this.answersService.editAnswer(answer.id!, answer).subscribe({
      next: (updatedAnswer) => {
        const index = this.allAnswers.findIndex(a => a.id === updatedAnswer.id);
        if (index !== -1) {
          this.allAnswers[index] = updatedAnswer;
          this._updateTopAnswerStatus(this.allAnswers[index]); // Vuelve a verificar el estado topAnswer de los datos del backend
          this.performSearch(); // Vuelve a ejecutar la búsqueda para actualizar la lista filtrada y reordenar
        }
      },
      error: (err) => {
        console.error('[Voto Positivo] Error al actualizar la respuesta en el backend:', err);
        // Revierte los cambios locales si la actualización del backend falla
        if (userHasVoted) {
          if (userCurrentVoteType === 'up') {
            answer.votes++;
            votedEmailsArr.push({ email: this.currentUserEmail, type: 'up' });
          } else {
            answer.votes -= 2;
            votedEmailsArr[userVoteIndex].type = 'down';
          }
        } else {
          answer.votes--;
          votedEmailsArr.pop();
        }
        answer.votedEmails = this.voteService.serializeVotedEmails(votedEmailsArr);
        this._updateTopAnswerStatus(answer); // Revierte topAnswer localmente
        this.performSearch(); // Vuelve a ejecutar la búsqueda después de revertir
      }
    });
  }

  /**
   * @public
   * @method voteDown
   * @description Maneja la lógica para una acción de voto negativo (`downvote`) en una respuesta.
   * Actualiza el recuento de votos local y la cadena `votedEmails`,
   * luego envía la respuesta actualizada al backend. Incluye manejo de errores para fallos del backend.
   * @param {Answer} answer - El objeto de respuesta a votar negativamente.
   */
  public voteDown(answer: Answer): void {
    if (!answer || !this.currentUserEmail) {
      console.warn('No se puede votar: Falta la respuesta o el correo electrónico del usuario actual.');
      this.openLoginRequiredModal();
      return;
    }

    let currentVotes = answer.votes ?? 0;
    let votedEmailsArr = this.voteService.parseVotedEmails(answer.votedEmails);
    const userVoteIndex = votedEmailsArr.findIndex(v => v.email === this.currentUserEmail);
    const userHasVoted = userVoteIndex !== -1;
    const userCurrentVoteType = userHasVoted ? votedEmailsArr[userVoteIndex].type : null;

    if (userHasVoted) {
      if (userCurrentVoteType === 'down') {
        currentVotes++; // El usuario votó negativo previamente y volvió a hacer clic -> Elimina el voto
        votedEmailsArr.splice(userVoteIndex, 1);
      } else { // userCurrentVoteType === 'up'
        currentVotes -= 2; // El usuario votó positivo previamente y hizo clic en negativo -> Cambia el voto de positivo a negativo
        votedEmailsArr[userVoteIndex].type = 'down';
      }
    } else {
      currentVotes--; // Añade voto negativo
      votedEmailsArr.push({ email: this.currentUserEmail, type: 'down' });
    }

    // Asegúrate de que los votos no sean negativos si ese es un requisito (el backend también debería aplicarlo)
    answer.votes = Math.max(0, currentVotes);
    answer.votedEmails = this.voteService.serializeVotedEmails(votedEmailsArr);
    this._updateTopAnswerStatus(answer); // Actualiza topAnswer localmente

    this.answersService.editAnswer(answer.id!, answer).subscribe({
      next: (updatedAnswer) => {
        const index = this.allAnswers.findIndex(a => a.id === updatedAnswer.id);
        if (index !== -1) {
          this.allAnswers[index] = updatedAnswer;
          this._updateTopAnswerStatus(this.allAnswers[index]); // Vuelve a verificar el estado topAnswer de los datos del backend
          this.performSearch(); // Vuelve a ejecutar la búsqueda para actualizar la lista filtrada y reordenar
        }
      },
      error: (err) => {
        console.error('[Voto Negativo] Error al actualizar la respuesta en el backend:', err);
        // Revierte los cambios locales si la actualización del backend falla
        if (userHasVoted) {
          if (userCurrentVoteType === 'down') {
            answer.votes--; // Revierte el incremento
            votedEmailsArr.push({ email: this.currentUserEmail, type: 'down' });
          } else {
            answer.votes += 2; // Revierte el decremento
            votedEmailsArr[userVoteIndex].type = 'up';
          }
        } else {
          answer.votes++; // Revierte el decremento
          votedEmailsArr.pop();
        }
        answer.votedEmails = this.voteService.serializeVotedEmails(votedEmailsArr);
        this._updateTopAnswerStatus(answer); // Revierte topAnswer localmente
        this.performSearch(); // Vuelve a ejecutar la búsqueda después de revertir
      }
    });
  }

  /**
   * @public
   * @method openLoginRequiredModal
   * @description Establece la bandera `showLoginRequiredModal` a true para mostrar el modal.
   */
  public openLoginRequiredModal(): void {
    this.showLoginRequiredModal = true;
  }

  /**
   * @public
   * @method closeLoginRequiredModal
   * @description Establece la bandera `showLoginRequiredModal` a false para ocultar el modal.
   */
  public closeLoginRequiredModal(): void {
    this.showLoginRequiredModal = false;
  }

  /**
   * @public
   * @method openModal
   * @description Abre el modal de respuesta detallada, populándolo con el contenido y las palabras clave de la respuesta seleccionada.
   * También parsea el contenido de la respuesta de Markdown a HTML.
   * @param {Answer} answer - El objeto de respuesta a mostrar en el modal.
   */
  public openModal(answer: Answer): void {
    this.selectedAnswer = answer;
    this.answerContent = marked(answer.content || '').toString();
    this.modalKeywords = answer.keywords ? answer.keywords.split(/[\s,]+/).filter(k => k.length > 0) : [];
    this.showModal = true;
    document.body.style.overflow = 'hidden'; // Evita el desplazamiento en el cuerpo cuando el modal está abierto
  }

  /**
   * @public
   * @method closeModal
   * @description Cierra el modal de respuesta detallada y restablece las propiedades relacionadas.
   * También restaura el desplazamiento del cuerpo.
   */
  public closeModal(): void {
    this.showModal = false;
    this.selectedAnswer = null;
    this.modalKeywords = [];
    document.body.style.overflow = ''; // Restaura el desplazamiento del cuerpo
  }
}
