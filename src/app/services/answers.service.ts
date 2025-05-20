import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Answer } from '../interfaces/answer.interface';

@Injectable({
  providedIn: 'root'
})
export class AnswersService {

  private http: HttpClient = inject( HttpClient )

  private answerUrl: string = 'http://127.0.0.1:8000/answer/'

  public getAnswers(): Observable<Answer[]> {
    return this.http.get<Answer[]>(this.answerUrl)
  }

  public addAnswer( answer: Answer ): Observable<Answer> {
    return this.http.post<Answer>(this.answerUrl, answer)
  }
}
