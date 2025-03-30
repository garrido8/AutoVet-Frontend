import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { marked } from 'marked';

import { GeminiService } from '../../../services/gemini.service';

@Component({
  selector: 'app-diagnosis',
  standalone: true,
  templateUrl: './diagnosis.component.html',
  styleUrl: './diagnosis.component.css',
  imports:[
    CommonModule,
    FormsModule
  ]
})
export class DiagnosisComponent {

  private gemini = inject(GeminiService);

  public isLoading: boolean = false;

  @ViewChild('promptValue') promptValue?: ElementRef;

  public responseText: string = '';
  public formattedResponse: string = '';
  public promptValueText: string = '';

  public sendPrompt() {
    this.isLoading = true;

    const prompt = this.promptValue?.nativeElement.value;

    this.gemini.formalConversation(prompt)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: response => {
          this.responseText = response;
          this.formattedResponse = marked(response).toString(); // Convert Markdown to HTML
        },
        error: err => {
          console.error('Error generating content:', err);
          this.responseText = 'There was an error processing your request.';
          this.formattedResponse = ''; // Clear formatted response on error
        }
      });
  }

}
