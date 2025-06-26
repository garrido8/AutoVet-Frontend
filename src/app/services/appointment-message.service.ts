import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppointmentMessage } from '../interfaces/appointment-message.interface';
import { backendURL } from '../../environments/urls';

/**
 * @class AppointmentMessageService
 * @description Servicio para gestionar las operaciones CRUD de los mensajes de una cita.
 * Se comunica con el backend para obtener, crear, editar y eliminar mensajes asociados a una cita específica.
 */
@Injectable( {
  providedIn: 'root'
} )
export class AppointmentMessageService {

  private http: HttpClient = inject( HttpClient );
  private messagesUrl: string = backendURL + 'appointment-messages/';

  /**
   * @method getMessagesByAppointment
   * @description Obtiene todos los mensajes de una cita específica.
   * @param { number } appointmentId El ID de la cita para la cual se quieren obtener los mensajes.
   * @returns { Observable<AppointmentMessage[]> } Un Observable que emite un array de objetos AppointmentMessage.
   */
  public getMessagesByAppointment( appointmentId: number ): Observable<AppointmentMessage[]> {
    return this.http.get<AppointmentMessage[]>( `${ this.messagesUrl }?appointment=${ appointmentId }` );
  }

  /**
   * @method addMessage
   * @description Añade un nuevo mensaje a una cita.
   * @param { Partial<AppointmentMessage> } message Un objeto parcial de mensaje, que típicamente contiene 'appointment' y 'content'.
   * @returns { Observable<AppointmentMessage> } Un Observable que emite el objeto AppointmentMessage recién creado.
   */
  public addMessage( message: Partial<AppointmentMessage> ): Observable<AppointmentMessage> {
    return this.http.post<AppointmentMessage>( this.messagesUrl, message );
  }

  /**
   * @method editMessage
   * @description Edita un mensaje existente por su ID.
   * @param { number } id La clave primaria (pk) del mensaje a editar.
   * @param { Partial<AppointmentMessage> } message Un objeto parcial de mensaje con los campos a actualizar ( p. ej., { content: 'nuevo texto' } ).
   * @returns { Observable<AppointmentMessage> } Un Observable que emite el objeto AppointmentMessage actualizado.
   */
  public editMessage( id: number, message: Partial<AppointmentMessage> ): Observable<AppointmentMessage> {
    const url = `${ this.messagesUrl }${ id }/`;
    return this.http.put<AppointmentMessage>( url, message );
  }

  /**
   * @method deleteMessage
   * @description Elimina un mensaje por su ID.
   * @param { number } id La clave primaria (pk) del mensaje a eliminar.
   * @returns { Observable<any> } Un Observable que se completa tras la eliminación exitosa ( normalmente no emite ningún valor ).
   */
  public deleteMessage( id: number ): Observable<any> {
    const url = `${ this.messagesUrl }${ id }/`;
    return this.http.delete( url );
  }
}
