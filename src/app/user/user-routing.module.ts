import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfileComponent } from './components/profile/profile.component';
import { PetsComponent } from './components/pets/pets.component';
import { AppoinmentsComponent } from './components/appoinments/appoinments.component';
import { CreateComponent } from './components/create/create.component';

const routes: Routes = [
  {
    path: 'profile',
    component: ProfileComponent
  },
  {
    path: 'pets',
    component: PetsComponent
  },
  {
    path: 'appointments',
    component: AppoinmentsComponent
  },
  {
    path: 'create',
    component: CreateComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }
