import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfileComponent } from './components/profile/profile.component';
import { PetsComponent } from './components/pets/pets.component';
import { AppoinmentsComponent } from './components/appoinments/appoinments.component';
import { CreateComponent } from './components/create/create.component';
import { LoginGuard } from '../guards/login.guard';

const routes: Routes = [
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [LoginGuard]
  },
  {
    path: 'pets',
    component: PetsComponent,
    canActivate: [LoginGuard]
  },
  {
    path: 'appointments',
    component: AppoinmentsComponent,
    canActivate: [LoginGuard]
  },
  {
    path: 'create',
    component: CreateComponent,
    canActivate: [LoginGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }
