import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { RouterModule } from '@angular/router';
import { NoLoginHeaderComponent } from './no-login-header/no-login-header.component';



@NgModule({
  declarations: [
    HeaderComponent,
    NoLoginHeaderComponent
  ],
  imports: [
    CommonModule,
    RouterModule
  ],
  exports: [
    HeaderComponent,
    NoLoginHeaderComponent
  ]
})
export class SharedModule { }
