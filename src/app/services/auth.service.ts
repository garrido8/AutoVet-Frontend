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

  public getUserPerId(id: number): Observable<Client> {
    return this.http.get<Client>(`${this.clientsUrl}${id}/`);
  }

  public getClients(): Observable<Client[]> {
    return this.http.get<Client[]>(this.clientsUrl);
  }

  public getStaffMembers(): Observable<Staff[]> {
    return this.http.get<Staff[]>(this.staffUrl);
  }

  public getStaffPerEmail(email: string): Observable<Staff[]> {
    return this.http.get<Staff[]>(`${this.staffUrl}?email=${email}`);
  }

  public getStaffPerId(id: number): Observable<Staff> {
    return this.http.get<Staff>(`${this.staffUrl}${id}/`);
  }

  public editStaffMember(id: number, staff: Staff): Observable<Staff> {
    const url = `${this.staffUrl}${id}/`;
    return this.http.put<Staff>(url, staff);
  }

  public addUser(client: Client): Observable<Client> {
    console.log(client);
    return this.http.post<Client>(this.clientsUrl, client);
  }

  public addWorker(staff: Staff): Observable<Staff> {
    console.log(staff);
    return this.http.post<Staff>(this.staffUrl, staff);
  }

  // New method to update client's photo
  public updateClientPhoto(clientId: number, formData: FormData): Observable<Client> {
    // We use PATCH because we are only updating a single field ('photo').
    // Django REST Framework's ModelViewSet handles PATCH for partial updates.
    // Ensure your Django URL for client detail is something like /clients/<int:pk>/
    return this.http.patch<Client>(`${this.clientsUrl}${clientId}/`, formData);
  }

  public updateStaffPhoto(staffId: number, formData: FormData): Observable<Staff> {
    // We use PATCH because we are only updating a single field ('photo').
    // Django REST Framework's ModelViewSet handles PATCH for partial updates.
    // Ensure your Django URL for client detail is something like /clients/<int:pk>/
    return this.http.patch<Staff>(`${this.staffUrl}${staffId}/`, formData);
  }

  public logout(): void {
    this.setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('token');
    localStorage.removeItem('fullToken');
  }

}
