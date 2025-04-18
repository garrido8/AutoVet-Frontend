import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StyleService {

  constructor() { }

  private headerOff: Subject<boolean> = new Subject<boolean>();

  public setHeaderOff(value: boolean): void {
    this.headerOff.next(value);
  }

  public getHeaderOff(): Observable<boolean> {
    return this.headerOff.asObservable();
  }
}
