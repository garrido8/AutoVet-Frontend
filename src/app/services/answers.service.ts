import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Answer } from '../interfaces/answer.interface';

@Injectable({
  providedIn: 'root'
})
export class AnswersService {

  private http: HttpClient = inject( HttpClient );

  private answerUrl: string = 'http://127.0.0.1:8000/answer/';

  /**
   * Fetches all answers from the API.
   * @returns An Observable that emits an array of Answer objects.
   */
  public getAnswers(): Observable<Answer[]> {
    return this.http.get<Answer[]>(this.answerUrl);
  }

  /**
   * Adds a new answer to the API.
   * @param answer The Answer object to be added.
   * @returns An Observable that emits the newly created Answer object.
   */
  public addAnswer( answer: Answer ): Observable<Answer> {
    return this.http.post<Answer>(this.answerUrl, answer);
  }

  /**
   * Edits an existing answer by its ID.
   * @param id The ID of the answer to edit.
   * @param answer The updated Answer object.
   * @returns An Observable that emits the updated Answer object.
   */
  public editAnswer(id: number, answer: Answer): Observable<Answer> {
    // Construct the URL for the specific answer using its ID
    const url = `${this.answerUrl}${id}/`;
    // Use the HTTP PUT method to send the updated answer object to the URL
    return this.http.put<Answer>(url, answer);
  }
}
