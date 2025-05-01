import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientsComponent } from './components/clients/clients.component';
import { StaffAppointmentsComponent } from './components/staff-appointments/staff-appointments.component';



@NgModule({
  declarations: [
    ClientsComponent,
    StaffAppointmentsComponent
  ],
  imports: [
    CommonModule
  ]
})
export class StaffModule { }
