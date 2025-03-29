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

  @ViewChild( 'promptValue' ) promptValue?: ElementRef

  public responseText: string = ''

  public async sendPrompt() {
    this.responseText = await this.gemini.generateContent(this.promptValue?.nativeElement.value);
  }

  // async ngOnInit() {
  //   this.responseText = await this.gemini.generateContent('Mi gato está enfermo, hace días que no come');
  //   console.log(this.responseText);
  // }

}
