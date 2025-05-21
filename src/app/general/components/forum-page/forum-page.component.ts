import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { AnswersService } from '../../../services/answers.service';
import { Subscription } from 'rxjs';
import { Answer } from '../../../interfaces/answer.interface'; // Ensure this path is correct

@Component({
  selector: 'app-forum-page',
  standalone: false,
  templateUrl: './forum-page.component.html',
  styleUrl: './forum-page.component.css'
})
export class ForumPageComponent implements OnInit, OnDestroy {

  private subscriptions = new Subscription();
  private answesService = inject( AnswersService );

  public allAnswers: Answer[] = [];

  // Modal State
  public showModal: boolean = false;
  public selectedAnswer: Answer | null = null;
  public modalKeywords: string[] = [];

  ngOnInit(): void {
    this.answesService.getAnswers()
      .subscribe( (data) => {
        this.allAnswers = data;
        // Assuming 'time' property exists in your Answer interface for each answer
        // If not, ensure your backend or service provides it.
      });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // Helper to truncate text for card preview
  getTruncatedContent(content: string, limit: number = 150): string {
    if (!content) return '';
    if (content.length <= limit) return content;
    return content.substring(0, content.lastIndexOf(' ', limit)) + '...';
  }

  // New method to format the date string
  formatAnswerTime(dateInput: string | Date | undefined): string {
    if (!dateInput) {
      return ''; // Handle cases where date is not provided
    }

    // Convert input to a Date object. This handles ISO strings, timestamps, etc.
    const date = new Date(dateInput);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'Fecha inválida'; // Or 'N/A' or appropriate error message
    }

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
    const year = date.getFullYear();

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${day}/${month}/${year} a las ${hours}:${minutes}`;
  }


  // Open the modal with the full answer
  openModal(answer: Answer): void {
    this.selectedAnswer = answer;
    this.modalKeywords = answer.keywords ? answer.keywords.split(',') : [];
    this.showModal = true;
    document.body.style.overflow = 'hidden';
  }

  // Close the modal
  closeModal(): void {
    this.showModal = false;
    this.selectedAnswer = null;
    this.modalKeywords = [];
    document.body.style.overflow = '';
  }
}
