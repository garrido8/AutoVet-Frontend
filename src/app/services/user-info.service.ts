import { Injectable } from '@angular/core';
import { Client } from '../interfaces/client.interface';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Staff } from '../interfaces/staff.interface';

@Injectable({
  providedIn: 'root'
})
export class UserInfoService {

  private userInfo: BehaviorSubject<Client | null> = new BehaviorSubject<Client | null>(null);
  private staffInfo: BehaviorSubject<Staff | null> = new BehaviorSubject<Staff | null>(null);

  public setUserInfo( user: Client ): void {
    this.userInfo.next( user );
  }

  public getUserInfo(): Observable<Client | null> {
    return this.userInfo.asObservable();
  }

  public setStaffInfo( user: Staff ): void {
    this.staffInfo.next( user );
  }

  public getStaffInfo(): Observable<Staff | null> {
    return this.staffInfo.asObservable();
  }

}
