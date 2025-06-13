import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfileComponent } from './components/profile/profile.component';
import { PetsComponent } from './components/pets/pets.component';
import { AppoinmentsComponent } from './components/appoinments/appoinments.component';
import { CreateComponent } from './components/create/create.component';
import { LoginGuard } from '../guards/login.guard';
import { ClientGuard } from '../guards/client.guard';

const routes: Routes = [
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [LoginGuard]
  },
  {
    path: 'pets',
    component: PetsComponent,
    canActivate: [LoginGuard, ClientGuard]
  },
  {
    path: 'appointments',
    component: AppoinmentsComponent,
    canActivate: [LoginGuard, ClientGuard]
  },
  {
    path: 'create',
    component: CreateComponent,
    canActivate: [LoginGuard, ClientGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }
