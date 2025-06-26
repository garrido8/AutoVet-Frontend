import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

/**
 * @class StyleService
 * @description Servicio para gestionar y comunicar estados de la interfaz de usuario (UI)
 * entre componentes, como la visibilidad de elementos o estados específicos del cliente.
 */
@Injectable( {
  providedIn: 'root'
} )
export class StyleService {

  constructor() { }

  private headerOff: Subject<boolean> = new Subject<boolean>();
  private clientStatus: Subject<boolean> = new Subject<boolean>();

  /**
   * @method setHeaderOff
   * @description Establece el estado de visibilidad del encabezado.
   * @param { boolean } value `true` para indicar que el encabezado debe estar oculto, `false` en caso contrario.
   */
  public setHeaderOff( value: boolean ): void {
    this.headerOff.next( value );
  }

  /**
   * @method getHeaderOff
   * @description Obtiene un observable que notifica los cambios en el estado de visibilidad del encabezado.
   * @returns { Observable<boolean> } Un observable que emite el estado actual de visibilidad del encabezado.
   */
  public getHeaderOff(): Observable<boolean> {
    return this.headerOff.asObservable();
  }

  /**
   * @method setClientStatus
   * @description Establece el estado del cliente.
   * @param { boolean } value El nuevo estado del cliente.
   */
  public setClientStatus( value: boolean ): void {
    this.clientStatus.next( value );
  }

  /**
   * @method getClientStatus
   * @description Obtiene un observable que notifica los cambios en el estado del cliente.
   * @returns { Observable<boolean> } Un observable que emite el estado actual del cliente.
   */
  public getClientStatus(): Observable<boolean> {
    return this.clientStatus.asObservable();
  }
}
