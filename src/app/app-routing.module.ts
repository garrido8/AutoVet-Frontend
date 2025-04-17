import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DiagnosisComponent } from './vet/components/diagnosis/diagnosis.component';
import { ChatbotComponent } from './vet/components/chatbot/chatbot.component';
import { FoodsComponent } from './vet/components/foods/foods.component';
import { ContactComponent } from './vet/components/contact/contact.component';

const routes: Routes = [
  {
    path: 'question',
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
  {
    path: 'auth',
    loadChildren: () => import( './auth/auth-routing.module' ).then( m => m.AuthRoutingModule )
  },
  { path: '', redirectTo: '/question', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
