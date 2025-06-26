import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ShareAppointment } from '../interfaces/share-appointment.interface';
import { backendURL } from '../../environments/urls';

/**
 * @class ShareAppointmentService
 * @description Servicio para gestionar las operaciones CRUD de citas compartidas.
 * Se comunica con el backend para obtener, crear, actualizar y eliminar registros de citas compartidas.
 */
@Injectable( {
  providedIn: 'root'
} )
export class ShareAppointmentService {

  private http: HttpClient = inject( HttpClient );
  private shareAppointmentUrl: string = backendURL + 'shares/';

  /**
   * @method getSharedAppointmentsByAppointment
   * @description Obtiene todas las instancias compartidas para una cita específica.
   * @param { number } appointmentId El ID de la cita para la cual se quieren obtener las instancias compartidas.
   * @returns { Observable<ShareAppointment[]> } Un Observable que emite un array de objetos ShareAppointment.
   */
  public getSharedAppointmentsByAppointment( appointmentId: number ): Observable<ShareAppointment[]> {
    return this.http.get<ShareAppointment[]>( `${ this.shareAppointmentUrl }?appointment=${ appointmentId }` );
  }

  /**
   * @method getSharedAppointmentsByCollaborator
   * @description Obtiene todas las instancias compartidas para un colaborador (miembro del personal) específico.
   * @param { number } collaboratorId El ID del colaborador (el usuario 'shared_with').
   * @returns { Observable<ShareAppointment[]> } Un Observable que emite un array de objetos ShareAppointment.
   */
  public getSharedAppointmentsByCollaborator( collaboratorId: number ): Observable<ShareAppointment[]> {
    return this.http.get<ShareAppointment[]>( `${ this.shareAppointmentUrl }?shared_with=${ collaboratorId }` );
  }

  /**
   * @method shareAppointment
   * @description Crea un nuevo registro de cita compartida.
   * @param { Partial<ShareAppointment> } sharedAppointment Un objeto parcial que contiene los detalles de la compartición.
   * @returns { Observable<ShareAppointment> } Un Observable que emite el objeto ShareAppointment recién creado.
   */
  public shareAppointment( sharedAppointment: Partial<ShareAppointment> ): Observable<ShareAppointment> {
    return this.http.post<ShareAppointment>( this.shareAppointmentUrl, sharedAppointment );
  }

  /**
   * @method updateSharedAppointment
   * @description Actualiza una cita compartida existente, por ejemplo, para cambiar los permisos.
   * @param { number } id La clave primaria (pk) del registro de cita compartida a editar.
   * @param { Partial<ShareAppointment> } sharedAppointment Un objeto parcial con los campos a actualizar (p. ej., { permission: 'VIEW' }).
   * @returns { Observable<ShareAppointment> } Un Observable que emite el objeto ShareAppointment actualizado.
   */
  public updateSharedAppointment( id: number, sharedAppointment: Partial<ShareAppointment> ): Observable<ShareAppointment> {
    const url = `${ this.shareAppointmentUrl }${ id }/`;
    return this.http.put<ShareAppointment>( url, sharedAppointment );
  }

  /**
   * @method deleteSharedAppointment
   * @description Elimina un registro de cita compartida por su ID, revocando el acceso.
   * @param { number } id La clave primaria (pk) del registro de cita compartida a eliminar.
   * @returns { Observable<any> } Un Observable que se completa tras la eliminación exitosa (normalmente no emite ningún valor).
   */
  public deleteSharedAppointment( id: number ): Observable<any> {
    const url = `${ this.shareAppointmentUrl }${ id }/`;
    return this.http.delete( url );
  }
}
