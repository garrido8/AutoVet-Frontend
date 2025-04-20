import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserRoutingModule } from './user-routing.module';
import { ProfileComponent } from './components/profile/profile.component';
import { PetsComponent } from './components/pets/pets.component';
import { AppoinmentsComponent } from './components/appoinments/appoinments.component';
import { CreateComponent } from './components/create/create.component';


@NgModule({
  declarations: [
    ProfileComponent,
    PetsComponent,
    AppoinmentsComponent,
    CreateComponent
  ],
  imports: [
    CommonModule,
    UserRoutingModule
  ]
})
export class UserModule { }
