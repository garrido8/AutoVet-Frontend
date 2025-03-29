import { Component, inject, OnInit } from '@angular/core';
import { GeminiService } from '../../../services/gemini.service';

@Component({
  selector: 'app-chatbot',
  standalone: false,
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.css'
})
export class ChatbotComponent implements OnInit{

  private gemini = inject( GeminiService )

  public responseText: string = ''

  async ngOnInit() {
    this.responseText = await this.gemini.generateContent('Explain how AI works in a few words');
    console.log(this.responseText);
  }
}
