import { Injectable } from '@angular/core';
import { Client } from '../interfaces/client.interface';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Staff } from '../interfaces/staff.interface';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class UserInfoService {

  private SECRET_KEY = 'dD92!r8&n$1Lm#tY*V@wQz4Rb7%JcXoL';

  private userInfo: BehaviorSubject<Client | null> = new BehaviorSubject<Client | null>(null);
  private staffInfo: BehaviorSubject<Staff | null> = new BehaviorSubject<Staff | null>(null);

  public setUserInfo( user: Client ): void {
    this.userInfo.next( user );
  }

  public setUserId( id: number ): void {
    const encryptedId = CryptoJS.AES.encrypt(id.toString(), this.SECRET_KEY).toString();
    localStorage.setItem('t45vjf', encryptedId);
  }

  public getUserId(): number | null {
    const encryptedId = localStorage.getItem('t45vjf');
    if (!encryptedId) return null;

    const bytes = CryptoJS.AES.decrypt(encryptedId, this.SECRET_KEY);
    const decryptedId = bytes.toString(CryptoJS.enc.Utf8);
    return Number(decryptedId);
  }

  public removeUserId(): void {
    localStorage.removeItem('t45vjf');
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

  public setToken( email: string ): void {
    const encryptedEmail = CryptoJS.AES.encrypt(email, this.SECRET_KEY).toString();
    localStorage.setItem('token', encryptedEmail);
  }

  public getToken(): string | null {
    const encryptedEmail = localStorage.getItem('token');
    if (!encryptedEmail) return null;

    const bytes = CryptoJS.AES.decrypt(encryptedEmail, this.SECRET_KEY);
    const decryptedEmail = bytes.toString(CryptoJS.enc.Utf8);
    return decryptedEmail;
  }

}
