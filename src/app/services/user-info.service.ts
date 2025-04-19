import { Injectable } from '@angular/core';
import { Client } from '../interfaces/client.interface';
import { Observable, Subject } from 'rxjs';
import { Staff } from '../interfaces/staff.interface';

@Injectable({
  providedIn: 'root'
})
export class UserInfoService {

  private userInfo: Subject<Client> = new Subject<Client>();
  private staffInfo: Subject<Staff> = new Subject<Staff>();

  public setUserInfo( user: Client ): void {
    this.userInfo.next( user );
  }

  public getUserInfo(): Observable<Client> {
    return this.userInfo.asObservable();
  }

  public setStaffInfo( user: Staff ): void {
    this.staffInfo.next( user );
  }

  public getStaffInfo(): Observable<Staff> {
    return this.staffInfo.asObservable();
  }

}
