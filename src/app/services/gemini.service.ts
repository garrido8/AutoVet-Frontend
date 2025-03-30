import { Injectable } from '@angular/core';
import { GoogleGenAI } from '@google/genai';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: 'AIzaSyAv950D51AxiOGHZMCmghSLzV074ECOsPQ' });
  }

  async formalConversation(prompt: string): Promise<string> {
    const newPrompt: string = 'Eres un experto en veterinaria que sabes todo sobre animales y eres capaz de dar consejos sobre animales de manera profesional' + prompt
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: newPrompt,
      });
      return response.text || 'No response received';
    } catch (error) {
      console.error('Error generating content:', error);
      return 'Error occurred';
    }
  }

  async informalConversation(prompt: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });
      return response.text || 'No response received';
    } catch (error) {
      console.error('Error generating content:', error);
      return 'Error occurred';
    }
  }
}
