import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Client } from '../interfaces/client.interface';
import { HttpClient } from '@angular/common/http';
import { Staff } from '../interfaces/staff.interface';
import { backendURL } from '../../environments/urls';

/**
 * @class AuthService
 * @description Gestiona la autenticación, el estado de la sesión y las operaciones
 * de datos de usuario (tanto clientes como personal) para la aplicación.
 */
@Injectable( {
  providedIn: 'root'
} )
export class AuthService {

  private isLoggedIn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>( false );

  private clientsUrl = backendURL + 'clients/';
  private staffUrl = backendURL + 'staff/';

  private http: HttpClient = inject( HttpClient )

  /**
   * @method getIsLoggedIn
   * @description Obtiene un observable del estado de autenticación.
   * Permite a los componentes suscribirse y reaccionar a los cambios en el estado de inicio de sesión.
   * @returns { Observable<boolean> } Un observable que emite `true` si el usuario está autenticado, y `false` en caso contrario.
   */
  getIsLoggedIn(): Observable<boolean> {
    return this.isLoggedIn.asObservable();
  }

  /**
   * @method setIsLoggedIn
   * @description Establece el estado de autenticación del usuario.
   * Actualiza el BehaviorSubject y persiste el estado en localStorage.
   * @param { boolean } value El nuevo estado de autenticación.
   */
  setIsLoggedIn( value: boolean ): void {
    this.isLoggedIn.next( value );
    localStorage.setItem( 'isLoggedIn', value.toString() );
  }

  /**
   * @method getUserPerEmail
   * @description Obtiene los usuarios cliente que coinciden con un correo electrónico.
   * @param { string } email El correo electrónico a buscar.
   * @returns { Observable<Client[]> } Un observable que emite un array de clientes.
   */
  public getUserPerEmail( email: string ): Observable<Client[]> {
    return this.http.get<Client[]>( `${ this.clientsUrl }?email=${ email }` );
  }

  /**
   * @method getUserPerId
   * @description Obtiene un usuario cliente por su ID.
   * @param { number } id El ID del cliente.
   * @returns { Observable<Client> } Un observable que emite los datos del cliente.
   */
  public getUserPerId( id: number ): Observable<Client> {
    return this.http.get<Client>( `${ this.clientsUrl }${ id }/` );
  }

  /**
   * @method getClients
   * @description Obtiene una lista de todos los clientes.
   * @returns { Observable<Client[]> } Un observable que emite un array de todos los clientes.
   */
  public getClients(): Observable<Client[]> {
    return this.http.get<Client[]>( this.clientsUrl );
  }

  /**
   * @method getStaffMembers
   * @description Obtiene una lista de todos los miembros del personal.
   * @returns { Observable<Staff[]> } Un observable que emite un array de todos los miembros del personal.
   */
  public getStaffMembers(): Observable<Staff[]> {
    return this.http.get<Staff[]>( this.staffUrl );
  }

  /**
   * @method getStaffPerEmail
   * @description Obtiene los miembros del personal que coinciden con un correo electrónico.
   * @param { string } email El correo electrónico a buscar.
   * @returns { Observable<Staff[]> } Un observable que emite un array de miembros del personal.
   */
  public getStaffPerEmail( email: string ): Observable<Staff[]> {
    return this.http.get<Staff[]>( `${ this.staffUrl }?email=${ email }` );
  }

  /**
   * @method getStaffPerId
   * @description Obtiene un miembro del personal por su ID.
   * @param { number } id El ID del miembro del personal.
   * @returns { Observable<Staff> } Un observable que emite los datos del miembro del personal.
   */
  public getStaffPerId( id: number ): Observable<Staff> {
    return this.http.get<Staff>( `${ this.staffUrl }${ id }/` );
  }

  /**
   * @method editStaffMember
   * @description Actualiza los datos de un miembro del personal.
   * @param { number } id El ID del miembro del personal a editar.
   * @param { Staff } staff El objeto con los datos actualizados.
   * @returns { Observable<Staff> } Un observable que emite los datos actualizados del miembro del personal.
   */
  public editStaffMember( id: number, staff: Staff ): Observable<Staff> {
    const url = `${ this.staffUrl }${ id }/`;
    return this.http.put<Staff>( url, staff );
  }

  /**
   * @method addUser
   * @description Registra un nuevo cliente.
   * @param { Client } client El objeto del cliente a añadir.
   * @returns { Observable<Client> } Un observable que emite los datos del cliente recién creado.
   */
  public addUser( client: Client ): Observable<Client> {
    return this.http.post<Client>( this.clientsUrl, client );
  }

  /**
   * @method addWorker
   * @description Registra un nuevo miembro del personal.
   * @param { Staff } staff El objeto del miembro del personal a añadir.
   * @returns { Observable<Staff> } Un observable que emite los datos del miembro del personal recién creado.
   */
  public addWorker( staff: Staff ): Observable<Staff> {
    return this.http.post<Staff>( this.staffUrl, staff );
  }

  /**
   * @method updateClientPhoto
   * @description Actualiza la foto de perfil de un cliente.
   * @param { number } clientId El ID del cliente a actualizar.
   * @param { FormData } formData El objeto FormData que contiene la nueva imagen.
   * @returns { Observable<Client> } Un observable que emite los datos del cliente con la foto actualizada.
   */
  public updateClientPhoto( clientId: number, formData: FormData ): Observable<Client> {
    return this.http.patch<Client>( `${ this.clientsUrl }${ clientId }/`, formData );
  }

  /**
   * @method updateStaffPhoto
   * @description Actualiza la foto de perfil de un miembro del personal.
   * @param { number } staffId El ID del miembro del personal a actualizar.
   * @param { FormData } formData El objeto FormData que contiene la nueva imagen.
   * @returns { Observable<Staff> } Un observable que emite los datos del miembro del personal con la foto actualizada.
   */
  public updateStaffPhoto( staffId: number, formData: FormData ): Observable<Staff> {
    return this.http.patch<Staff>( `${ this.staffUrl }${ staffId }/`, formData );
  }

  /**
   * @method logout
   * @description Cierra la sesión del usuario actual.
   * Limpia el estado de autenticación y elimina los datos de sesión de localStorage.
   */
  public logout(): void {
    this.setIsLoggedIn( false );
    localStorage.removeItem( 'isLoggedIn' );
    localStorage.removeItem( 'token' );
    localStorage.removeItem( 'fullToken' );
  }

}
