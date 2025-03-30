import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../shared/shared.module';
import { ChatbotComponent } from './components/chatbot/chatbot.component';
import { FoodsComponent } from './components/foods/foods.component';
import { ContactComponent } from './components/contact/contact.component';

import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    ChatbotComponent,
    FoodsComponent,
    ContactComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class VetModule { }
