import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { GeminiService } from '../../../services/gemini.service';

@Component({
  selector: 'app-diagnosis',
  standalone: false,
  templateUrl: './diagnosis.component.html',
  styleUrl: './diagnosis.component.css'
})
export class DiagnosisComponent {

  private gemini = inject( GeminiService )

  public isLoading: boolean = false

  @ViewChild( 'promptValue' ) promptValue?: ElementRef

  public responseText: string = ''

  public async sendPrompt() {
    this.isLoading = true;

    try {
      // Await the response from GeminiService
      this.responseText = await this.gemini.generateContent(this.promptValue?.nativeElement.value);
    } catch (error) {
      console.error('Error generating content:', error);
      this.responseText = 'There was an error processing your request.';
    } finally {
      // Set isLoading to false after the async operation is done
      this.isLoading = false;
    }
  }

}
