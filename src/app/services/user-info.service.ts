import { Injectable } from '@angular/core';
import { Client } from '../interfaces/client.interface';
import { BehaviorSubject, Observable } from 'rxjs';
import { Staff } from '../interfaces/staff.interface';
import * as CryptoJS from 'crypto-js';
import { secretKey } from '../../environments/urls';

/**
 * @class UserInfoService
 * @description Gestiona la información y el estado del usuario (cliente y personal) en la aplicación.
 * Proporciona métodos para almacenar y recuperar datos de usuario de forma segura en el estado
 * de la aplicación (BehaviorSubject) y en el almacenamiento local (localStorage) mediante cifrado.
 */
@Injectable( {
  providedIn: 'root'
} )
export class UserInfoService {

  private SECRET_KEY = secretKey;

  private userInfo: BehaviorSubject<Client | null> = new BehaviorSubject<Client | null>( null );
  private staffInfo: BehaviorSubject<Staff | null> = new BehaviorSubject<Staff | null>( null );

  /**
   * @method setUserInfo
   * @description Establece la información del cliente en el estado del servicio (BehaviorSubject).
   * @param { Client } user El objeto del cliente a establecer.
   */
  public setUserInfo( user: Client ): void {
    this.userInfo.next( user );
  }

  /**
   * @method setUserId
   * @description Cifra y guarda el ID de un usuario en localStorage.
   * @param { number } id El ID del usuario a guardar.
   */
  public setUserId( id: number ): void {
    const encryptedId = CryptoJS.AES.encrypt( id.toString(), this.SECRET_KEY ).toString();
    localStorage.setItem( 't45vjf', encryptedId );
  }

  /**
   * @method getUserId
   * @description Obtiene y descifra el ID de un usuario desde localStorage.
   * @returns { number | null } El ID del usuario descifrado, o null si no se encuentra.
   */
  public getUserId(): number | null {
    const encryptedId = localStorage.getItem( 't45vjf' );
    if ( !encryptedId ) return null;

    const bytes = CryptoJS.AES.decrypt( encryptedId, this.SECRET_KEY );
    const decryptedId = bytes.toString( CryptoJS.enc.Utf8 );
    return Number( decryptedId );
  }

  /**
   * @method removeUserId
   * @description Elimina el ID del usuario de localStorage.
   */
  public removeUserId(): void {
    localStorage.removeItem( 't45vjf' );
  }

  /**
   * @method getUserInfo
   * @description Obtiene un observable con la información del cliente actual.
   * @returns { Observable<Client | null> } Un observable que emite el objeto del cliente o null.
   */
  public getUserInfo(): Observable<Client | null> {
    return this.userInfo.asObservable();
  }

  /**
   * @method setStaffInfo
   * @description Establece la información del miembro del personal en el estado del servicio.
   * @param { Staff } user El objeto del miembro del personal a establecer.
   */
  public setStaffInfo( user: Staff ): void {
    this.staffInfo.next( user );
  }

  /**
   * @method getStaffInfo
   * @description Obtiene un observable con la información del miembro del personal actual.
   * @returns { Observable<Staff | null> } Un observable que emite el objeto del miembro del personal o null.
   */
  public getStaffInfo(): Observable<Staff | null> {
    return this.staffInfo.asObservable();
  }

  /**
   * @method setToken
   * @description Cifra y guarda el email de un usuario como token en localStorage.
   * @param { string } email El email a guardar.
   */
  public setToken( email: string ): void {
    const encryptedEmail = CryptoJS.AES.encrypt( email, this.SECRET_KEY ).toString();
    localStorage.setItem( 'token', encryptedEmail );
  }

  /**
   * @method getToken
   * @description Obtiene y descifra el email (token) de un usuario desde localStorage.
   * @returns { string | null } El email descifrado, o null si no se encuentra.
   */
  public getToken(): string | null {
    const encryptedEmail = localStorage.getItem( 'token' );
    if ( !encryptedEmail ) return null;

    const bytes = CryptoJS.AES.decrypt( encryptedEmail, this.SECRET_KEY );
    const decryptedEmail = bytes.toString( CryptoJS.enc.Utf8 );
    return decryptedEmail;
  }

  /**
   * @method setFullClientToken
   * @description Cifra y guarda el objeto completo de un cliente en localStorage.
   * @param { Client } client El objeto del cliente a guardar.
   */
  public setFullClientToken( client: Client ): void {
    const encryptedUser = CryptoJS.AES.encrypt( JSON.stringify( client ), this.SECRET_KEY ).toString();
    localStorage.setItem( 'fullToken', encryptedUser );
  }

  /**
   * @method getFullClientToken
   * @description Obtiene y descifra el objeto completo de un cliente desde localStorage.
   * @returns { Client | null } El objeto del cliente descifrado, o null si no se encuentra.
   */
  public getFullClientToken(): Client | null {
    const encryptedUser = localStorage.getItem( 'fullToken' );
    if ( !encryptedUser ) return null;

    const bytes = CryptoJS.AES.decrypt( encryptedUser, this.SECRET_KEY );
    const decryptedUser = JSON.parse( bytes.toString( CryptoJS.enc.Utf8 ) );
    return decryptedUser;
  }

  /**
   * @method setFullStaffToken
   * @description Cifra y guarda el objeto completo de un miembro del personal en localStorage.
   * @param { Staff } staff El objeto del miembro del personal a guardar.
   */
  public setFullStaffToken( staff: Staff ): void {
    const encryptedUser = CryptoJS.AES.encrypt( JSON.stringify( staff ), this.SECRET_KEY ).toString();
    localStorage.setItem( 'fullToken', encryptedUser );
  }

  /**
   * @method getFullStaffToken
   * @description Obtiene y descifra el objeto completo de un miembro del personal desde localStorage.
   * @returns { Staff | null } El objeto del miembro del personal descifrado, o null si no se encuentra.
   */
  public getFullStaffToken(): Staff | null {
    const encryptedUser = localStorage.getItem( 'fullToken' );
    if ( !encryptedUser ) return null;

    const bytes = CryptoJS.AES.decrypt( encryptedUser, this.SECRET_KEY );
    const decryptedUser = JSON.parse( bytes.toString( CryptoJS.enc.Utf8 ) );
    return decryptedUser;
  }
}
