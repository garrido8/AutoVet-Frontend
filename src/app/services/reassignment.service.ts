import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Reassignment } from '../interfaces/reassignment.interface';
import { backendURL } from '../../environments/urls';


/**
 * @class ReassignmentService
 * @description Servicio para gestionar las operaciones CRUD para las solicitudes de reasignación.
 * Se comunica con la API de backend para obtener, añadir, editar y eliminar reasignaciones.
 */
@Injectable( {
  providedIn: 'root'
} )
export class ReassignmentService {

  private http: HttpClient = inject( HttpClient );
  private reassignmentUrl: string = backendURL + 'reassignments/';

  /**
   * @method getReassignments
   * @description Obtiene todas las solicitudes de reasignación desde la API.
   * @returns { Observable<Reassignment[]> } Un Observable que emite un array de objetos Reassignment.
   */
  public getReassignments(): Observable<Reassignment[]> {
    return this.http.get<Reassignment[]>( this.reassignmentUrl );
  }

  /**
   * @method getReassignmentByUser
   * @description Obtiene las reasignaciones de un usuario específico.
   * @param { number } id El ID del usuario.
   * @returns { Observable<Reassignment[]> } Un Observable que emite un array de objetos Reassignment.
   */
  public getReassignmentByUser( id: number ): Observable<Reassignment[]> {
    return this.http.get<Reassignment[]>( `${ this.reassignmentUrl }?requesting_worker_id=${ id }` );
  }

  /**
   * @method addReassignment
   * @description Añade una nueva solicitud de reasignación a la API.
   * @param { Reassignment } reassignment El objeto Reassignment que se va a añadir.
   * @returns { Observable<Reassignment> } Un Observable que emite el objeto Reassignment recién creado.
   */
  public addReassignment( reassignment: Reassignment ): Observable<Reassignment> {
    return this.http.post<Reassignment>( this.reassignmentUrl, reassignment );
  }

  /**
   * @method editReassignment
   * @description Edita una solicitud de reasignación existente por su ID.
   * @param { number } id El ID de la solicitud de reasignación a editar.
   * @param { Reassignment } reassignment El objeto Reassignment actualizado.
   * @returns { Observable<Reassignment> } Un Observable que emite el objeto Reassignment actualizado.
   */
  public editReassignment( id: number, reassignment: Reassignment ): Observable<Reassignment> {
    const url = `${ this.reassignmentUrl }${ id }/`;
    return this.http.put<Reassignment>( url, reassignment );
  }

  /**
   * @method deleteReassignment
   * @description Elimina una solicitud de reasignación por su ID.
   * @param { number } id El ID de la solicitud de reasignación a eliminar.
   * @returns { Observable<any> } Un Observable que se completa tras la eliminación exitosa.
   */
  public deleteReassignment( id: number ): Observable<any> {
    const url = `${ this.reassignmentUrl }${ id }/`;
    return this.http.delete( url );
  }
}
