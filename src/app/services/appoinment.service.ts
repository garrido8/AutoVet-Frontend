import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Appoinment } from '../interfaces/appoinment.interface';
import { backendURL } from '../../environments/urls';

/**
 * @class AppoinmentService
 * @description Servicio para gestionar las operaciones CRUD de las citas (appointments).
 * Se comunica con la API del backend para obtener, crear y editar citas.
 */
@Injectable( {
  providedIn: 'root'
} )
export class AppoinmentService {

  private http: HttpClient = inject( HttpClient )

  private appoinmentUrl = backendURL + 'appoinment/'

  /**
   * @method getAppoinments
   * @description Obtiene todas las citas desde la API.
   * @returns { Observable<Appoinment[]> } Un Observable que emite un array de todas las citas.
   */
  public getAppoinments(): Observable<Appoinment[]> {
    return this.http.get<Appoinment[]>( this.appoinmentUrl );
  }

  /**
   * @method getAppoinmentByPet
   * @description Obtiene las citas asociadas a una mascota específica.
   * @param { number } petId El ID de la mascota para filtrar las citas.
   * @returns { Observable<Appoinment[]> } Un Observable que emite un array de citas para la mascota especificada.
   */
  public getAppoinmentByPet( petId: number ): Observable<Appoinment[]> {
    return this.http.get<Appoinment[]>( `${ this.appoinmentUrl }?mascota=${ petId }` );
  }

  /**
   * @method getAppoinmentById
   * @description Obtiene una cita específica por su ID.
   * @param { number } id El ID de la cita a obtener.
   * @returns { Observable<Appoinment> } Un Observable que emite el objeto de la cita solicitada.
   */
  public getAppoinmentById( id: number ): Observable<Appoinment> {
    const url = `${ this.appoinmentUrl }${ id }/`;
    return this.http.get<Appoinment>( url );
  }

  /**
   * @method addAppoinment
   * @description Añade una nueva cita a la API.
   * @param { Appoinment } appoinment El objeto de la cita que se va a añadir.
   * @returns { Observable<Appoinment> } Un Observable que emite el objeto de la cita recién creada.
   */
  public addAppoinment( appoinment: Appoinment ): Observable<Appoinment> {
    return this.http.post<Appoinment>( this.appoinmentUrl, appoinment );
  }

  /**
   * @method getNonAssignedAppoinments
   * @description Obtiene todas las citas que no tienen un trabajador asignado.
   * @returns { Observable<Appoinment[]> } Un Observable que emite un array de citas no asignadas.
   */
  public getNonAssignedAppoinments(): Observable<Appoinment[]> {
    return this.http.get<Appoinment[]>( `${ this.appoinmentUrl }?trabajador_asignado=null` );
  }

  /**
   * @method getAppoinmentsByWorkerId
   * @description Obtiene todas las citas asignadas a un trabajador específico.
   * @param { number } id El ID del trabajador.
   * @returns { Observable<Appoinment[]> } Un Observable que emite un array de citas asignadas al trabajador.
   */
  public getAppoinmentsByWorkerId( id: number ): Observable<Appoinment[]> {
    return this.http.get<Appoinment[]>( `${ this.appoinmentUrl }?trabajador_asignado=${ id }` );
  }

  /**
   * @method editAppoinment
   * @description Edita una cita existente por su ID.
   * @param { number } id El ID de la cita a editar.
   * @param { Appoinment } appoinment El objeto de la cita con los datos actualizados.
   * @returns { Observable<Appoinment> } Un Observable que emite el objeto de la cita actualizada.
   */
  public editAppoinment( id: number, appoinment: Appoinment ): Observable<Appoinment> {
    const url = `${ this.appoinmentUrl }${ id }/`;
    return this.http.put<Appoinment>( url, appoinment );
  }

}
