import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Pet } from '../interfaces/pet.interface';
import { Appoinment } from '../interfaces/appoinment.interface';

@Injectable({
  providedIn: 'root'
})
export class AppoinmentService {

  private http: HttpClient = inject(HttpClient)

  private appoinmentUrl = 'http://127.0.0.1:8000/appoinment/'

  public getAppoinments(): Observable<Appoinment[]> {
    return this.http.get<Appoinment[]>(this.appoinmentUrl);
  }

  public getAppoinmentByPet( petId: number ): Observable<Appoinment[]> {
    return this.http.get<Appoinment[]>(`${this.appoinmentUrl}?mascota=${petId}`);
  }

  public getAppoinmentById( id: number ): Observable<Appoinment> {
    const url = `${this.appoinmentUrl}${id}/`;
    return this.http.get<Appoinment>(url);
  }

  public addAppoinment(appoinment: Appoinment): Observable<Appoinment> {
    return this.http.post<Appoinment>(this.appoinmentUrl, appoinment);
  }

  public getNonAssignedAppoinments(): Observable<Appoinment[]> {
    return this.http.get<Appoinment[]>(`${this.appoinmentUrl}?trabajador_asignado=null`);
  }

  public getAppoinmentsByWorkerId( id: number ): Observable<Appoinment[]> {
    return this.http.get<Appoinment[]>(`${this.appoinmentUrl}?trabajador_asignado=${id}`);
  }

  public editAppoinment(id: number, appoinment: Appoinment): Observable<Appoinment> {
    const url = `${this.appoinmentUrl}${id}/`;
    return this.http.put<Appoinment>(url, appoinment);
  }

}
