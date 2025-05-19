import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DiagnosisComponent } from './vet/components/diagnosis/diagnosis.component';
import { ChatbotComponent } from './vet/components/chatbot/chatbot.component';
import { FoodsComponent } from './vet/components/foods/foods.component';
import { ContactComponent } from './vet/components/contact/contact.component';
import { HomeComponent } from './general/components/home/home.component';
import { ErrorPageComponent } from './general/error-page/error-page.component';
import { ForumPageComponent } from './general/components/forum-page/forum-page.component';

const routes: Routes = [
  {
    path: 'home',
    component: HomeComponent
  },
  {
    path: 'forum',
    component: ForumPageComponent
  },
  {
    path: 'error',
    component: ErrorPageComponent
  },
  {
    path: 'question',
    component: DiagnosisComponent
  },
  // {
  //   path: 'chat',
  //   component: ChatbotComponent
  // },
  {
    path: 'foods',
    component: FoodsComponent
  },
  // {
  //   path: 'contact',
  //   component: ContactComponent
  // },
  {
    path: 'auth',
    loadChildren: () => import( './auth/auth-routing.module' ).then( m => m.AuthRoutingModule )
  },
  {
    path: 'user',
    loadChildren: () => import( './user/user-routing.module' ).then( m => m.UserRoutingModule )
  },
  {
    path: 'staff',
    loadChildren: () => import( './staff/staff-routing.module' ).then( m => m.StaffRoutingModule )
  },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
