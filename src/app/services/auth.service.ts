import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private isLoggedIn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor() { }

  // Getter - para que otros puedan escuchar sin modificar directamente
  getIsLoggedIn(): Observable<boolean> {
    return this.isLoggedIn.asObservable();
  }

  // Setter - para cambiar el estado de login
  setIsLoggedIn(value: boolean): void {
    this.isLoggedIn.next(value);
  }
}
