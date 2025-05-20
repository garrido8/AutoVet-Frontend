import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { finalize, switchMap, tap } from 'rxjs/operators';
import { marked } from 'marked';

import { GeminiService } from '../../../services/gemini.service';
import { AnswersService } from '../../../services/answers.service';
import { Answer } from '../../../interfaces/answer.interface';
import { UserInfoService } from '../../../services/user-info.service';

@Component({
  selector: 'app-diagnosis',
  standalone: true,
  templateUrl: './diagnosis.component.html',
  styleUrl: './diagnosis.component.css',
  imports: [
    CommonModule,
    FormsModule
  ]
})
export class DiagnosisComponent {

  private gemini = inject(GeminiService);
  private answersService = inject( AnswersService )
  private UserInfoService = inject( UserInfoService )

  public isLoading: boolean = false;

  @ViewChild('promptValue') promptValue?: ElementRef;
  @ViewChild('responseContainer') responseContainer?: ElementRef; // Get a reference to the response container

  public responseText: string = '';
  public formattedResponse: string = '';
  public promptValueText: string = '';

  public sendPrompt() {
    this.isLoading = true;
    this.responseText = ''; // Clear previous response
    this.formattedResponse = '';
    if (this.responseContainer) {
      this.responseContainer.nativeElement.classList.remove('show'); // Hide previous response
    }

    const prompt = this.promptValue?.nativeElement.value;

    this.gemini.formalConversation(prompt)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: response => {
          this.addAnswer( response )
          this.responseText = response;
          this.formattedResponse = marked(response).toString(); // Convert Markdown to HTML
          // Add the 'show' class to trigger the animation
          if (this.responseContainer) {
            this.responseContainer.nativeElement.classList.add('show');
          }
        },
        error: err => {
          console.error('Error generating content:', err);
          this.responseText = 'There was an error processing your request.';
          this.formattedResponse = ''; // Clear formatted response on error
          // Optionally, still show an error message in the response container
          if (this.responseContainer) {
            this.responseContainer.nativeElement.classList.add('show');
          }
        }
      });
  }

public addAnswer(response: string): void {
  const email = this.UserInfoService.getToken();
  const answer: Answer = {
    time: new Date(),
    content: response,
    keywords: '',
    votes: 0,
    votedEmails: '',
    userEmail: email || 'Anónimo'
  };

  this.gemini.getKeyWords(response)
    .pipe(
      tap(words => answer.keywords = words),
      switchMap(() => this.answersService.addAnswer(answer))
    )
    .subscribe(
      response => console.log('Respuesta agregada correctamente'),
      error => console.error('Error al agregar respuesta', error)
    );
}


}
