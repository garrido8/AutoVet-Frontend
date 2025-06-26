import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * @class KeywordsService
 * @description Servicio para gestionar y compartir el estado de las palabras clave (keywords)
 * a través de la aplicación utilizando un BehaviorSubject.
 */
@Injectable( {
  providedIn: 'root'
} )
export class KeywordsService {

  private keywords: BehaviorSubject<string | null> = new BehaviorSubject<string | null>( null )

  /**
   * @method setKeywords
   * @description Establece o actualiza las palabras clave actuales.
   * Notifica a todos los suscriptores con el nuevo valor.
   * @param { string } keyWords Las nuevas palabras clave a establecer.
   */
  public setKeywords( keyWords: string ): void {
    this.keywords.next( keyWords )
  }

  /**
   * @method getKeywords
   * @description Devuelve un observable que emite el valor actual de las palabras clave.
   * Permite a los componentes suscribirse y reaccionar a los cambios en las palabras clave.
   * @returns { Observable<string | null> } Un observable con el string de las palabras clave o null.
   */
  public getKeywords(): Observable<string | null> {
    return this.keywords.asObservable()
  }

  constructor() { }
}
