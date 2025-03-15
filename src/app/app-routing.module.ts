import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DiagnosisComponent } from './vet/components/diagnosis/diagnosis.component';
import { ChatbotComponent } from './vet/components/chatbot/chatbot.component';
import { FoodsComponent } from './vet/components/foods/foods.component';
import { ContactComponent } from './vet/components/contact/contact.component';

const routes: Routes = [
  {
    path: 'home',
    component: DiagnosisComponent
  },
  {
    path: 'chat',
    component: ChatbotComponent
  },
  {
    path: 'foods',
    component: FoodsComponent
  },
  {
    path: 'contact',
    component: ContactComponent
  },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
