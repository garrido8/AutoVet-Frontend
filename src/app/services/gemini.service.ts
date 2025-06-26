import { Injectable } from '@angular/core';
import { GoogleGenAI } from '@google/genai';
import { apiKey, breedsNames, conversationTitle, expertPrompt, foodsPropmt, generateDescription, generateSummaryName, keyWords } from '../../environments/prompt-settings';
import { Observable, from } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

/**
 * @class GeminiService
 * @description Servicio para interactuar con la API de Google Gemini.
 * Proporciona métodos para generar contenido basado en diferentes prompts.
 */
@Injectable( {
  providedIn: 'root'
} )
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI( { apiKey: apiKey } );
  }

  /**
   * @method progressConversation
   * @description Envía un prompt a Gemini con un contexto de experto para obtener una respuesta progresiva.
   * @param { string } prompt - El prompt del usuario para la conversación.
   * @returns { Observable<string> } Un observable que emite la respuesta generada por la IA.
   */
  progressConversation( prompt: string ): Observable<string> {
    const newPrompt: string = expertPrompt + prompt;

    return from(
      this.ai.models.generateContent( {
        model: 'gemini-2.0-flash',
        contents: newPrompt,
      } )
    ).pipe(
      map( response => response.text || 'No response received' ),
      catchError( error => {
        console.error( 'Error generating content:', error );
        return [ 'Error occurred' ];
      } )
    );
  }

  /**
   * @method formalConversation
   * @description Envía un prompt a Gemini con un contexto de experto para una conversación formal.
   * @param { string } prompt - El prompt del usuario para la conversación.
   * @returns { Observable<string> } Un observable que emite la respuesta generada por la IA.
   */
  formalConversation( prompt: string ): Observable<string> {
    const newPrompt: string = expertPrompt + prompt;

    return from(
      this.ai.models.generateContent( {
        model: 'gemini-2.0-flash',
        contents: newPrompt,
      } )
    ).pipe(
      map( response => response.text || 'No response received' ),
      catchError( error => {
        console.error( 'Error generating content:', error );
        return [ 'Error occurred' ];
      } )
    );
  }

  /**
   * @method informalConversation
   * @description Envía un prompt directamente a Gemini para una conversación informal.
   * @param { string } prompt - El prompt del usuario para la conversación.
   * @returns { Observable<string> } Un observable que emite la respuesta generada por la IA.
   */
  informalConversation( prompt: string ): Observable<string> {
    return from(
      this.ai.models.generateContent( {
        model: 'gemini-2.0-flash',
        contents: prompt,
      } )
    ).pipe(
      map( response => response.text || 'No response received' ),
      catchError( error => {
        console.error( 'Error generating content:', error );
        return [ 'Error occurred' ];
      } )
    );
  }

  /**
   * @method generateName
   * @description Genera un nombre basado en un prompt.
   * @param { string } prompt - El prompt que describe el contexto para generar el nombre.
   * @returns { Observable<string> } Un observable que emite el nombre generado.
   */
  generateName( prompt: string ): Observable<string> {
    const newPrompt: string = generateSummaryName + prompt;

    return from(
      this.ai.models.generateContent( {
        model: 'gemini-2.0-flash',
        contents: newPrompt,
      } )
    ).pipe(
      map( response => response.text || 'No response received' ),
      catchError( error => {
        console.error( 'Error generating content:', error );
        return [ 'Error occurred' ];
      } )
    );
  }

  /**
   * @method generateProffesionalSummary
   * @description Genera un resumen profesional a partir de un prompt.
   * @param { string } prompt - El prompt con la información a resumir.
   * @returns { Observable<string> } Un observable que emite el resumen generado.
   */
  generateProffesionalSummary( prompt: string ): Observable<string> {
    const newPrompt: string = generateDescription + prompt;

    return from(
      this.ai.models.generateContent( {
        model: 'gemini-2.0-flash',
        contents: newPrompt,
      } )
    ).pipe(
      map( response => response.text || 'No response received' ),
      catchError( error => {
        console.error( 'Error generating content:', error );
        return [ 'Error occurred' ];
      } )
    );
  }

  /**
   * @method getBreeds
   * @description Obtiene una lista de razas basada en un prompt.
   * @param { string } prompt - El prompt que especifica el tipo de razas a buscar.
   * @returns { Observable<string> } Un observable que emite las razas obtenidas.
   */
  getBreeds( prompt: string ): Observable<string> {
    const newPrompt: string = breedsNames + prompt;

    return from(
      this.ai.models.generateContent( {
        model: 'gemini-2.0-flash',
        contents: newPrompt,
      } )
    ).pipe(
      map( response => response.text || 'No response received' ),
      catchError( error => {
        console.error( 'Error generating content:', error );
        return [ 'Error occurred' ];
      } )
    );
  }

  /**
   * @method getFoods
   * @description Obtiene una lista de alimentos basada en un prompt.
   * @param { string } prompt - El prompt que especifica el tipo de alimentos a buscar.
   * @returns { Observable<string> } Un observable que emite los alimentos obtenidos.
   */
  getFoods( prompt: string ): Observable<string> {
    const newPrompt: string = foodsPropmt + prompt;

    return from(
      this.ai.models.generateContent( {
        model: 'gemini-2.0-flash',
        contents: newPrompt,
      } )
    ).pipe(
      map( response => response.text || 'No response received' ),
      catchError( error => {
        console.error( 'Error generating content:', error );
        return [ 'Error occurred' ];
      } )
    );
  }

  /**
   * @method getKeyWords
   * @description Extrae palabras clave de un texto proporcionado en el prompt.
   * @param { string } prompt - El texto del cual se extraerán las palabras clave.
   * @returns { Observable<string> } Un observable que emite las palabras clave extraídas.
   */
  getKeyWords( prompt: string ): Observable<string> {
    const newPrompt: string = keyWords + '\n' + prompt

    return from(
      this.ai.models.generateContent( {
        model: 'gemini-2.0-flash',
        contents: newPrompt,
      } )
    ).pipe(
      map( response => response.text || 'No response received' ),
      catchError( error => {
        console.error( 'Error generating content:', error );
        return [ 'Error occurred' ];
      } )
    );
  }

  /**
   * @method getConvsersationTitle
   * @description Genera un título para una conversación a partir de un prompt.
   * @param { string } prompt - El contenido de la conversación para generar el título.
   * @returns { Observable<string> } Un observable que emite el título generado.
   */
  public getConvsersationTitle( prompt: string ): Observable<string> {
    const newPrompt: string = conversationTitle + '\n' + prompt

    return from(
      this.ai.models.generateContent( {
        model: 'gemini-2.0-flash',
        contents: newPrompt,
      } )
    ).pipe(
      map( response => response.text || 'No response received' ),
      catchError( error => {
        console.error( 'Error generating content:', error );
        return [ 'Error occurred' ];
      } )
    );
  }
}
