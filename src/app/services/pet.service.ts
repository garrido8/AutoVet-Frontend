import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Pet } from '../interfaces/pet.interface';
import { Observable } from 'rxjs';
import { backendURL } from '../../environments/urls';

/**
 * @class PetService
 * @description Servicio para gestionar las operaciones CRUD para las mascotas.
 * Se comunica con la API de backend para obtener y añadir mascotas.
 */
@Injectable( {
  providedIn: 'root'
} )
export class PetService {

  private http: HttpClient = inject( HttpClient )

  private petsUrl = backendURL + 'pet/'

  /**
   * @method getPets
   * @description Obtiene una lista de todas las mascotas desde la API.
   * @returns { Observable<Pet[]> } Un observable que emite un array de todas las mascotas.
   */
  public getPets(): Observable<Pet[]> {
    return this.http.get<Pet[]>( this.petsUrl );
  }

  /**
   * @method getPetById
   * @description Obtiene una mascota específica por su ID.
   * @param { number } id El ID de la mascota a obtener.
   * @returns { Observable<Pet> } Un observable que emite los datos de la mascota solicitada.
   */
  public getPetById( id: number ): Observable<Pet> {
    return this.http.get<Pet>( `${ this.petsUrl }${ id }/` );
  }

  /**
   * @method getPetByOwner
   * @description Obtiene todas las mascotas que pertenecen a un propietario específico.
   * @param { number } ownerId El ID del propietario de las mascotas.
   * @returns { Observable<Pet[]> } Un observable que emite un array de las mascotas del propietario.
   */
  public getPetByOwner( ownerId: number ): Observable<Pet[]> {
    return this.http.get<Pet[]>( `${ this.petsUrl }?propietario=${ ownerId }` );
  }

  /**
   * @method addPet
   * @description Añade una nueva mascota a la base de datos.
   * @param { Pet } pet El objeto de la mascota a añadir.
   * @returns { Observable<Pet> } Un observable que emite los datos de la mascota recién creada.
   */
  public addPet( pet: Pet ): Observable<Pet> {
    const headers = new HttpHeaders( { 'Content-Type': 'application/json' } );
    return this.http.post<Pet>( this.petsUrl, pet, { headers } );
  }
}
