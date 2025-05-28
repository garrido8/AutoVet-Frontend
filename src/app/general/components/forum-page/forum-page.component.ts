import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { AnswersService } from '../../../services/answers.service';
import { Subscription } from 'rxjs';
import { Answer } from '../../../interfaces/answer.interface';
import { marked } from 'marked';
import { UserInfoService } from '../../../services/user-info.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { KeywordsService } from '../../../services/keywords.service';

@Component({
  selector: 'app-forum-page',
  standalone: true,
  templateUrl: './forum-page.component.html',
  styleUrl: './forum-page.component.css',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ],
})
export class ForumPageComponent implements OnInit, OnDestroy {

  private subscriptions = new Subscription();
  private answersService = inject( AnswersService );
  private userInfoService = inject( UserInfoService );
  private keywordsService = inject( KeywordsService )

  public allAnswers: Answer[] = [];
  public filteredAnswers: Answer[] = [];
  public searchTerm: string = '';

  private get currentUserEmail(): string {
    return this.userInfoService.getToken()!;
  }

  // Modal State
  public showModal: boolean = false;
  public selectedAnswer: Answer | null = null;
  public modalKeywords: string[] = [];
  public answerContent: string = '';

  ngOnInit(): void {
    // Subscribe to keywords first to potentially set the initial search term
    this.subscriptions.add( // Add to subscriptions for proper unsubscription
      this.keywordsService.getKeywords()
        .subscribe( response => {
          if (response && response?.length > 0) {
            this.searchTerm = response;
            // No need to call performSearch here yet, it will be called after answers are loaded
          }
        })
    );

    // Then, fetch all answers
    this.subscriptions.add( // Add to subscriptions for proper unsubscription
      this.answersService.getAnswers()
        .subscribe( (data) => {
          this.allAnswers = data;
          this.allAnswers.forEach(answer => {
            // Initialize vote-related properties if they are missing
            if (typeof answer.votes === 'undefined' || answer.votes === null) {
              answer.votes = 0;
            }
            if (typeof answer.votedEmails === 'undefined' || answer.votedEmails === null) {
              answer.votedEmails = '';
            }
            // Ensure topAnswer is initialized to false if not set (Django default)
            if (typeof answer.topAnswer === 'undefined' || answer.topAnswer === null) {
              answer.topAnswer = false;
            }
            // Update the topAnswer status for each answer on load
            this._updateTopAnswerStatus(answer);
          });
          this.filteredAnswers = [...this.allAnswers]; // Initialize filteredAnswers with all answers
          this.performSearch(); // Now perform the search, using the potentially pre-set searchTerm
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Helper method to determine and set the topAnswer status.
   * This method updates the `topAnswer` property of an `Answer` object
   * based on whether any of its `votedEmails` contain the "autovet" substring.
   * This logic *only* updates the local `answer` object; the persistence to the backend
   * must be handled by calling `answersService.editAnswer()` subsequently.
   */
  private _updateTopAnswerStatus(answer: Answer): void {
    const votedEmailsArr = this.parseVotedEmails(answer.votedEmails);
    // Check if any of the parsed emails (case-sensitive) contains 'autovet'
    const hasAutovetVote = votedEmailsArr.some(vote => vote.email.includes('autovet'));

    // Update the topAnswer field locally
    answer.topAnswer = hasAutovetVote;
    // console.log(`[DEBUG] Answer by ${answer.userEmail}, TopAnswer updated to: ${answer.topAnswer}`);
  }

  /**
   * Method to perform the search filtering.
   * - Supports multiple keywords in the search term (e.g., "word1 word2").
   * - Filters for answers that contain ALL of the search words ("AND" logic).
   * - Parses answer keywords using both spaces and commas as separators.
   * - NEW: Sorts the filtered answers with `topAnswer`s first, then by date ascending.
   */
  public performSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredAnswers = [...this.allAnswers]; // Show all answers if search term is empty or just whitespace
      // Apply sorting even when no search term is provided
      this.filteredAnswers.sort((a, b) => {
        // Primary sort: topAnswer (true comes before false)
        if (a.topAnswer && !b.topAnswer) {
          return -1; // a (true) comes before b (false)
        }
        if (!a.topAnswer && b.topAnswer) {
          return 1; // b (true) comes before a (false)
        }

        // Secondary sort: If topAnswer status is the same, sort by date ascending (oldest first)
        const dateA = new Date(a.time!);
        const dateB = new Date(b.time!);
        return dateA.getTime() - dateB.getTime(); // Ascending sort for dates
      });
      return;
    }

    // Split the user's search query by spaces into individual terms.
    const searchTerms = this.searchTerm.toLowerCase().split(' ').filter(term => term.length > 0);

    this.filteredAnswers = this.allAnswers.filter(answer => {
      // Get the answer's keywords, clean them, and convert them to lowercase.
      // Use a regular expression to split by one or more whitespace characters OR commas.
      const answerKeywords = (answer.keywords || '')
        .split(/[\s,]+/)
        .map(k => k.trim().toLowerCase())
        .filter(k => k.length > 0); // Ensure no empty keywords from splitting (e.g., ", ,")

      // Use 'every' for searchTerms (AND logic)
      return searchTerms.every(searchTerm => {
        // For each searchTerm, check if it's included in any of the answer's keywords.
        return answerKeywords.some(answerKeyword => answerKeyword.includes(searchTerm));
      });
    });

    // NEW: Sort filteredAnswers with topAnswers first, then by date ascending
    this.filteredAnswers.sort((a, b) => {
      // Primary sort: topAnswer (true comes before false)
      if (a.topAnswer && !b.topAnswer) {
        return -1; // a (true) comes before b (false)
      }
      if (!a.topAnswer && b.topAnswer) {
        return 1; // b (true) comes before a (false)
      }

      // Secondary sort: If topAnswer status is the same, sort by date ascending (oldest first)
      const dateA = new Date(a.time!);
      const dateB = new Date(b.time!);
      return dateA.getTime() - dateB.getTime(); // Ascending sort for dates
    });
  }

  // Helper to truncate text for card preview
  getTruncatedContent(content: string, limit: number = 150): string {
    if (!content) return '';
    if (content.length <= limit) return content;
    return content.substring(0, content.lastIndexOf(' ', limit)) + '...';
  }

  // Method to format the date string
  formatAnswerTime(dateInput: string | Date | undefined): string {
    if (!dateInput) {
      return '';
    }
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} a las ${hours}:${minutes}`;
  }

  private parseVotedEmails(votedEmailsStr: string): { email: string, type: 'up' | 'down' }[] {
    if (!votedEmailsStr) return [];
    return votedEmailsStr.split(',').map(entry => {
      const parts = entry.split(':');
      return { email: parts[0], type: parts[1] as 'up' | 'down' };
    }).filter(entry => entry.email && entry.type);
  }

  private serializeVotedEmails(votedEmailsArr: { email: string, type: 'up' | 'down' }[]): string {
    return votedEmailsArr.map(entry => `${entry.email}:${entry.type}`).join(',');
  }

  getUserVoteType(answer: Answer): 'up' | 'down' | null {
    if (!this.currentUserEmail || !answer.votedEmails) {
      return null;
    }
    const votedEmailsArr = this.parseVotedEmails(answer.votedEmails);
    const userVote = votedEmailsArr.find(v => v.email === this.currentUserEmail);
    return userVote ? userVote.type : null;
  }

  // --- Vote Logic ---
  voteUp(answer: Answer): void {
    if (!answer || !this.currentUserEmail) {
      console.warn('Cannot vote: Answer or current user email is missing.');
      return;
    }

    let currentVotes = answer.votes || 0;
    let votedEmailsArr = this.parseVotedEmails(answer.votedEmails);
    const userVoteIndex = votedEmailsArr.findIndex(v => v.email === this.currentUserEmail);
    const userHasVoted = userVoteIndex !== -1;
    const userCurrentVoteType = userHasVoted ? votedEmailsArr[userVoteIndex].type : null;

    console.log(`[Upvote] Initial state for ${answer.userEmail}: Votes=${currentVotes}, UserVoteType=${userCurrentVoteType}, VotedEmails='${answer.votedEmails}'`);

    if (userHasVoted) {
      if (userCurrentVoteType === 'up') {
        currentVotes--;
        votedEmailsArr.splice(userVoteIndex, 1);
        console.log(`[Upvote] Action: User ${this.currentUserEmail} removed their UPVOTE.`);
      } else { // userCurrentVoteType === 'down'
        currentVotes += 2;
        votedEmailsArr[userVoteIndex].type = 'up';
        console.log(`[Upvote] Action: User ${this.currentUserEmail} changed vote from DOWN to UP.`);
      }
    } else {
      currentVotes++;
      votedEmailsArr.push({ email: this.currentUserEmail, type: 'up' });
      console.log(`[Upvote] Action: User ${this.currentUserEmail} added an UPVOTE.`);
    }

    answer.votes = currentVotes;
    answer.votedEmails = this.serializeVotedEmails(votedEmailsArr);

    // Update topAnswer locally based on the new votedEmails state, *before* sending to backend
    this._updateTopAnswerStatus(answer);

    console.log(`[Upvote] Local state updated: Votes=${answer.votes}, VotedEmails='${answer.votedEmails}', TopAnswer=${answer.topAnswer}`);

    this.answersService.editAnswer(answer.id!, answer).subscribe({
      next: (updatedAnswer) => {
        console.log(`[Upvote] Backend updated successfully. Final votes from backend: ${updatedAnswer.votes}`);
        const index = this.allAnswers.findIndex(a => a.id === updatedAnswer.id);
        if (index !== -1) {
          this.allAnswers[index] = updatedAnswer;
          // Re-apply topAnswer status just to be absolutely sure local state matches
          this._updateTopAnswerStatus(this.allAnswers[index]);
          this.performSearch(); // Re-run search to update filtered list and re-sort
        }
      },
      error: (err) => {
        console.error('[Upvote] Error updating answer on backend:', err);
        // Revert local changes if backend update fails
        if (userHasVoted) {
          if (userCurrentVoteType === 'up') {
            answer.votes++;
            votedEmailsArr.push({ email: this.currentUserEmail, type: 'up' });
          } else {
            answer.votes -= 2;
            votedEmailsArr[userVoteIndex].type = 'down';
          }
        } else {
          answer.votes--;
          votedEmailsArr.pop();
        }
        answer.votedEmails = this.serializeVotedEmails(votedEmailsArr);
        // Revert topAnswer locally based on the reverted votedEmails state
        this._updateTopAnswerStatus(answer);

        console.log(`[Upvote] Local state reverted due to backend error: Votes=${answer.votes}, VotedEmails='${answer.votedEmails}', TopAnswer=${answer.topAnswer}`);
        this.performSearch(); // Re-run search after reverting to maintain UI consistency and re-sort
      }
    });
  }

  // Open the modal with the full answer
  openModal(answer: Answer): void {
    this.selectedAnswer = answer;
    this.answerContent = marked(answer.content || '').toString();
    // Use flexible separator for modal keywords as well
    this.modalKeywords = answer.keywords ? answer.keywords.split(/[\s,]+/).filter(k => k.length > 0) : [];
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

        // voteDown(answer: Answer): void {
  //   // Access currentUserEmail via the getter to get the latest value
  //   if (!answer || !this.currentUserEmail) {
  //     console.warn('Cannot vote: Answer or current user email is missing.');
  //     return;
  //   }

  //   let currentVotes = answer.votes || 0;
  //   let votedEmailsArr = this.parseVotedEmails(answer.votedEmails);
  //   const userVoteIndex = votedEmailsArr.findIndex(v => v.email === this.currentUserEmail);
  //   const userHasVoted = userVoteIndex !== -1;
  //   const userCurrentVoteType = userHasVoted ? votedEmailsArr[userVoteIndex].type : null;

  //   console.log(`[Downvote] Initial state for ${answer.userEmail}: Votes=${currentVotes}, UserVoteType=${userCurrentVoteType}, VotedEmails='${answer.votedEmails}'`);


  //   if (userHasVoted) {
  //     if (userCurrentVoteType === 'down') {
  //       // User previously downvoted and clicked downvote again -> Remove vote
  //       // This increments the vote count because it's undoing the effect of a previous downvote.
  //       currentVotes++;
  //       votedEmailsArr.splice(userVoteIndex, 1);
  //       console.log(`[Downvote] Action: User ${this.currentUserEmail} removed their DOWNVOTE.`);
  //     } else { // userCurrentVoteType === 'up'
  //       // User previously upvoted and clicked downvote -> Change vote from up to down
  //       currentVotes -= 2; // Undo upvote (-1) and add downvote (-1)
  //       votedEmailsArr[userVoteIndex].type = 'down';
  //       console.log(`[Downvote] Action: User ${this.currentUserEmail} changed vote from UP to DOWN.`);
  //     }
  //   } else {
  //     // User has not voted yet -> Add downvote (only if votes > 0 after decrement)
  //     if (currentVotes > 0) { // Only decrement if current votes are positive
  //       currentVotes--;
  //       votedEmailsArr.push({ email: this.currentUserEmail, type: 'down' });
  //       console.log(`[Downvote] Action: User ${this.currentUserEmail} added a DOWNVOTE.`);
  //     } else {
  //       console.log(`[Downvote] Action: Cannot downvote when votes are already 0. User ${this.currentUserEmail} attempted to downvote.`);
  //     }
  //   }

  //   // Ensure votes don't go negative
  //   answer.votes = Math.max(0, currentVotes);
  //   answer.votedEmails = this.serializeVotedEmails(votedEmailsArr);

  //   console.log(`[Downvote] Local state updated: Votes=${answer.votes}, VotedEmails='${answer.votedEmails}'`);

  //   // Call service to update backend
  //   this.answersService.editAnswer(answer.id!, answer).subscribe({
  //     next: (updatedAnswer) => {
  //       console.log(`[Downvote] Backend updated successfully. Final votes from backend: ${updatedAnswer.votes}`);
  //       // IMPORTANT: Ensure your backend correctly merges the 'votedEmails' string for this PUT request.
  //       // If the backend simply overwrites the 'votedEmails' field with the string sent from frontend,
  //       // it will lead to previous users' votes being lost. The backend should parse the string,
  //       // update its internal list of voters, and then serialize it back for persistence.
  //       const index = this.allAnswers.findIndex(a => a.id === updatedAnswer.id);
  //       if (index !== -1) {
  //         this.allAnswers[index] = updatedAnswer;
  //       }
  //     },
  //     error: (err) => {
  //       console.error('[Downvote] Error updating answer on backend:', err);
  //       // Revert local changes if backend update fails
  //       if (userHasVoted) {
  //         if (userCurrentVoteType === 'down') {
  //           answer.votes--; // Revert increment
  //           votedEmailsArr.push({ email: this.currentUserEmail, type: 'down' });
  //         } else {
  //           answer.votes += 2; // Revert decrement
  //           votedEmailsArr[userVoteIndex].type = 'up';
  //         }
  //       } else {
  //         // Only revert if a downvote was actually added (i.e., currentVotes was > 0 before decrement)
  //         if (currentVotes > 0) { // Check the value of currentVotes *before* the Math.max(0, currentVotes)
  //           answer.votes++; // Revert decrement
  //           votedEmailsArr.pop(); // Remove added vote
  //         }
  //       }
  //       answer.votedEmails = this.serializeVotedEmails(votedEmailsArr);
  //       console.log(`[Downvote] Local state reverted due to backend error: Votes=${answer.votes}, VotedEmails='${answer.votedEmails}'`);
  //     }
  //   });
  // }
}
