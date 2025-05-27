import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KeywordsService {

  private keywords: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null)

  public setKeywords( keyWords: string ): void {
    this.keywords.next( keyWords )
  }

  public getKeywords(): Observable<string | null> {
    return this.keywords.asObservable()
  }

  constructor() { }
}
