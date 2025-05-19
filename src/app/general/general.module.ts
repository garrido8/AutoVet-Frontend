import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './components/home/home.component';
import { ErrorPageComponent } from './error-page/error-page.component';
import { RouterModule } from '@angular/router';
import { ForumPageComponent } from './components/forum-page/forum-page.component';



@NgModule({
  declarations: [
    HomeComponent,
    ForumPageComponent,
  ],
  imports: [
    CommonModule,
    RouterModule
  ],
})
export class GeneralModule { }
