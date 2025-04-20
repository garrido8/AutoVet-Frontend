import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Pet } from '../interfaces/pet.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PetService {

  private http: HttpClient = inject(HttpClient)

  private petsUrl = 'http://127.0.0.1:8000/pet/'

  public getPets(): Observable<Pet[]> {
    return this.http.get<Pet[]>(this.petsUrl);
  }

  public getPetByOwner(ownerId: number): Observable<Pet[]> {
    return this.http.get<Pet[]>(`${this.petsUrl}?propietario=${ownerId}`);
  }

  public addPet(pet: Pet): Observable<Pet> {
    return this.http.post<Pet>(this.petsUrl, pet);
  }
}
