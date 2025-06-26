import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Answer } from '../interfaces/answer.interface';
import { backendURL } from '../../environments/urls';

/**
 * @class AnswersService
 * @description Servicio para gestionar las operaciones CRUD para las respuestas (answers).
 * Se comunica con la API de backend para obtener, añadir y editar respuestas.
 */
@Injectable( {
  providedIn: 'root'
} )
export class AnswersService {

  private http: HttpClient = inject( HttpClient );
  private answerUrl: string = backendURL + 'answer/';

  /**
   * @method getAnswers
   * @description Obtiene todas las respuestas desde la API.
   * @returns { Observable<Answer[]> } Un Observable que emite un array de objetos Answer.
   */
  public getAnswers(): Observable<Answer[]> {
    return this.http.get<Answer[]>( this.answerUrl );
  }

  /**
   * @method addAnswer
   * @description Añade una nueva respuesta a la API.
   * @param { Answer } answer El objeto Answer que se va a añadir.
   * @returns { Observable<Answer> } Un Observable que emite el objeto Answer recién creado.
   */
  public addAnswer( answer: Answer ): Observable<Answer> {
    return this.http.post<Answer>( this.answerUrl, answer );
  }

  /**
   * @method editAnswer
   * @description Edita una respuesta existente por su ID.
   * @param { number } id El ID de la respuesta a editar.
   * @param { Answer } answer El objeto Answer actualizado.
   * @returns { Observable<Answer> } Un Observable que emite el objeto Answer actualizado.
   */
  public editAnswer( id: number, answer: Answer ): Observable<Answer> {
    const url = `${ this.answerUrl }${ id }/`;
    return this.http.put<Answer>( url, answer );
  }
}
