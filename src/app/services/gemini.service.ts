import { Injectable } from '@angular/core';
import { GoogleGenAI } from '@google/genai';
import { apiKey, breedsNames, expertPrompt, foodsPropmt, generateDescription, generateSummaryName, keyWords } from '../../environments/prompt-settings';
import { Observable, from } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: apiKey });
  }

  formalConversation(prompt: string): Observable<string> {
    const newPrompt: string = expertPrompt + prompt;

    return from(
      this.ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: newPrompt,
      })
    ).pipe(
      map(response => response.text || 'No response received'),
      catchError(error => {
        console.error('Error generating content:', error);
        return ['Error occurred']; // Emits a fallback value
      })
    );
  }

  informalConversation(prompt: string): Observable<string> {
    return from(
      this.ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      })
    ).pipe(
      map(response => response.text || 'No response received'),
      catchError(error => {
        console.error('Error generating content:', error);
        return ['Error occurred']; // Emits a fallback value
      })
    );
  }

  generateName(prompt: string): Observable<string> {
    const newPrompt: string = generateSummaryName + prompt;

    return from(
      this.ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: newPrompt,
      })
    ).pipe(
      map(response => response.text || 'No response received'),
      catchError(error => {
        console.error('Error generating content:', error);
        return ['Error occurred']; // Emits a fallback value
      })
    );
  }

  generateProffesionalSummary(prompt: string): Observable<string> {
    const newPrompt: string = generateDescription + prompt;

    return from(
      this.ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: newPrompt,
      })
    ).pipe(
      map(response => response.text || 'No response received'),
      catchError(error => {
        console.error('Error generating content:', error);
        return ['Error occurred']; // Emits a fallback value
      })
    );
  }

  getBreeds(prompt: string): Observable<string> {
    const newPrompt: string = breedsNames + prompt;

    return from(
      this.ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: newPrompt,
      })
    ).pipe(
      map(response => response.text || 'No response received'),
      catchError(error => {
        console.error('Error generating content:', error);
        return ['Error occurred']; // Emits a fallback value
      })
    );
  }

  getFoods(prompt: string): Observable<string> {
    const newPrompt: string = foodsPropmt + prompt;

    return from(
      this.ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: newPrompt,
      })
    ).pipe(
      map(response => response.text || 'No response received'),
      catchError(error => {
        console.error('Error generating content:', error);
        return ['Error occurred']; // Emits a fallback value
      })
    );
  }

  getKeyWords( prompt: string ): Observable<string> {
    const newPrompt: string = keyWords + '\n' + prompt

    return from(
      this.ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: newPrompt,
      })
    ).pipe(
      map(response => response.text || 'No response received'),
      catchError(error => {
        console.error('Error generating content:', error);
        return ['Error occurred']; // Emits a fallback value
      })
    );
  }
}
