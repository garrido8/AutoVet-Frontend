import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Client } from '../interfaces/client.interface';
import { HttpClient } from '@angular/common/http';
import { Staff } from '../interfaces/staff.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private isLoggedIn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  private clientsUrl = 'http://127.0.0.1:8000/clients/';
  private staffUrl = 'http://127.0.0.1:8000/staff/';

  private http: HttpClient = inject(HttpClient)

  // Getter - para que otros puedan escuchar sin modificar directamente
  getIsLoggedIn(): Observable<boolean> {
    return this.isLoggedIn.asObservable();
  }

  // Setter - para cambiar el estado de login
  setIsLoggedIn(value: boolean): void {
    this.isLoggedIn.next(value);
    localStorage.setItem('isLoggedIn', value.toString());
  }

  public getUserPerEmail(email: string): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.clientsUrl}?email=${email}`);
  }

  public getStaffPerEmail(email: string): Observable<Staff[]> {
    return this.http.get<Staff[]>(`${this.staffUrl}?email=${email}`);
  }

  public addUser(client: Client): Observable<Client> {
    console.log(client);
    return this.http.post<Client>(this.clientsUrl, client);
  }

  public logout(): void {
    this.setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
  }

}
