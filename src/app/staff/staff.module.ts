import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientsComponent } from './components/clients/clients.component';
import { StaffAppointmentsComponent } from './components/staff-appointments/staff-appointments.component';
import { ClientsInfoComponent } from './components/clients-info/clients-info.component';
import { AddPetComponent } from './components/add-pet/add-pet.component';
import { AppointmentInfoComponent } from './components/appointment-info/appointment-info.component';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    // ClientsComponent,
    StaffAppointmentsComponent,
    ClientsInfoComponent,
    // AddPetComponent,
    AppointmentInfoComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule
  ]
})
export class StaffModule { }
