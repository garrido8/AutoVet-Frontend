import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClientsComponent } from './components/clients/clients.component';
import { StaffAppointmentsComponent } from './components/staff-appointments/staff-appointments.component';
import { ClientsInfoComponent } from './components/clients-info/clients-info.component';
import { AddPetComponent } from './components/add-pet/add-pet.component';
import { AppointmentInfoComponent } from './components/appointment-info/appointment-info.component';
import { CreateUserComponent } from './components/create-user/create-user.component';
import { LoginGuard } from '../guards/login.guard';
import { WorkerGuard } from '../guards/worker.guard';
import { AdminGuard } from '../guards/admin.guard';
import { ReassignmentsComponent } from './components/reassignments/reassignments/reassignments.component';

const routes: Routes = [
  {
    path: 'clients',
    component: ClientsComponent,
    canActivate: [LoginGuard, WorkerGuard]
  },
  {
    path: 'appointments',
    component: StaffAppointmentsComponent,
    canActivate: [LoginGuard, WorkerGuard]
  },
  {
    path: 'client-info/:id',
    component: ClientsInfoComponent,
    canActivate: [LoginGuard, WorkerGuard]
  },
  {
    path:'appointment-info/:id',
    component: AppointmentInfoComponent,
    canActivate: [LoginGuard, WorkerGuard]
  },
  {
    path: 'add-pet',
    component: AddPetComponent,
    canActivate: [LoginGuard, WorkerGuard]
  },
  {
    path: 'add-client',
    component: CreateUserComponent,
    canActivate: [LoginGuard, AdminGuard]
  },
  {
    path: 'add-worker',
    component: CreateUserComponent,
    canActivate: [LoginGuard, AdminGuard]
  },
  {
    path: 'reassignments',
    component: ReassignmentsComponent,
    canActivate: [LoginGuard, AdminGuard]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StaffRoutingModule { }
