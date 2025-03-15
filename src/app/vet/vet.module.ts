import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DiagnosisComponent } from './components/diagnosis/diagnosis.component';
import { SharedModule } from '../shared/shared.module';
import { ChatbotComponent } from './components/chatbot/chatbot.component';
import { FoodsComponent } from './components/foods/foods.component';
import { ContactComponent } from './components/contact/contact.component';


@NgModule({
  declarations: [
    DiagnosisComponent,
    ChatbotComponent,
    FoodsComponent,
    ContactComponent,
  ],
  imports: [
    CommonModule,
    SharedModule
  ]
})
export class VetModule { }
