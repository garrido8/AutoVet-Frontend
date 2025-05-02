import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClientsComponent } from './components/clients/clients.component';
import { StaffAppointmentsComponent } from './components/staff-appointments/staff-appointments.component';
import { ClientsInfoComponent } from './components/clients-info/clients-info.component';
import { AddPetComponent } from './components/add-pet/add-pet.component';

const routes: Routes = [
  {
    path: 'clients',
    component: ClientsComponent
  },
  {
    path: 'appointments',
    component: StaffAppointmentsComponent
  },
  {
    path: 'client-info/:id',
    component: ClientsInfoComponent
  },
  {
    path: 'add-pet',
    component: AddPetComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StaffRoutingModule { }
