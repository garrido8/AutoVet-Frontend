import { Injectable } from '@angular/core';
import { Client } from '../interfaces/client.interface';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserInfoService {

  private userInfo: Subject<Client> = new Subject<Client>();

  public setUserInfo( user: Client ): void {
    this.userInfo.next( user );
  }

  public getUserInfo(): Observable<Client> {
    return this.userInfo.asObservable();
  }
}
