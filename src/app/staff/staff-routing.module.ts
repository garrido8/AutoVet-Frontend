import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClientsComponent } from './components/clients/clients.component';
import { StaffAppointmentsComponent } from './components/staff-appointments/staff-appointments.component';
import { ClientsInfoComponent } from './components/clients-info/clients-info.component';
import { AddPetComponent } from './components/add-pet/add-pet.component';
import { AppointmentInfoComponent } from './components/appointment-info/appointment-info.component';
import { CreateUserComponent } from './components/create-user/create-user.component';
import { LoginGuard } from '../guards/login.guard';

const routes: Routes = [
  {
    path: 'clients',
    component: ClientsComponent,
    canActivate: [LoginGuard]
  },
  {
    path: 'appointments',
    component: StaffAppointmentsComponent,
    canActivate: [LoginGuard]
  },
  {
    path: 'client-info/:id',
    component: ClientsInfoComponent,
    canActivate: [LoginGuard]
  },
  {
    path:'appointment-info/:id',
    component: AppointmentInfoComponent,
    canActivate: [LoginGuard]
  },
  {
    path: 'add-pet',
    component: AddPetComponent,
    canActivate: [LoginGuard]
  },
  {
    path: 'add-client',
    component: CreateUserComponent,
    canActivate: [LoginGuard]
  },
  {
    path: 'add-worker',
    component: CreateUserComponent,
    canActivate: [LoginGuard]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StaffRoutingModule { }
