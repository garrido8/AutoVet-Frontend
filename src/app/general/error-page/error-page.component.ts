import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { StyleService } from '../../services/style.service';

@Component({
  selector: 'app-error-page',
  standalone: true,
  templateUrl: './error-page.component.html',
  styleUrl: './error-page.component.css',
  imports: [
    RouterModule
  ]
})
export class ErrorPageComponent implements OnInit, OnDestroy {

  private styleService = inject( StyleService )

  ngOnInit(): void {
    this.styleService.setHeaderOff(true);
  }

  ngOnDestroy(): void {
    this.styleService.setHeaderOff(false);
  }

}
