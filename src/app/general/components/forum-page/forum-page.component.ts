import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { AnswersService } from '../../../services/answers.service';
import { Subscription } from 'rxjs';
import { Answer } from '../../../interfaces/answer.interface';

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
  public keywords: string[] = [];

  ngOnInit(): void {
    this.answesService.getAnswers()
      .subscribe( (data) => {
        this.allAnswers = data;
        this.allAnswers.forEach( (answer) => {
          this.keywords.push( ...answer.keywords.split(',') );
        });
      });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

}
