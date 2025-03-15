import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { VetRoutingModule } from './vet-routing.module';
import { DiagnosisComponent } from './components/diagnosis/diagnosis.component';
import { SharedModule } from '../shared/shared.module';


@NgModule({
  declarations: [
    DiagnosisComponent
  ],
  imports: [
    CommonModule,
    VetRoutingModule,
    SharedModule
  ]
})
export class VetModule { }
