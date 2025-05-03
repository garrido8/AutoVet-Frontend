import { CommonModule, formatDate } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AppoinmentService } from '../../../services/appoinment.service';
import { Subscription } from 'rxjs';
import { PetService } from '../../../services/pet.service';
import { Appoinment } from '../../../interfaces/appoinment.interface';

@Component({
  selector: 'app-appointment-info',
  standalone: true,
  templateUrl: './appointment-info.component.html',
  styleUrl: './appointment-info.component.css',
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule
  ]
})
export class AppointmentInfoComponent implements OnInit, OnDestroy {


  public estados: string[] = [
    'pendiente',
    'en_proceso',
    'resuelta'
  ];

  private fb = inject( FormBuilder );
  private appointmentService = inject( AppoinmentService );
  private petService = inject( PetService )
  private route = inject( ActivatedRoute )

  private subscriptions = new Subscription();

  public petName: string = '';

  public form = this.fb.group( {
    fecha_resolucion: [Date], // No obligatorio
    estado: ['pendiente', Validators.required], // Valor por defecto
    urgencia: [false], // Valor por defecto
  } )

  public appointment?: Appoinment

  ngOnInit(): void {
    const id = parseInt( this.route.snapshot.paramMap.get('id')! )

    const appointmentSub = this.appointmentService.getAppoinmentById(id!)
      .subscribe( response => {
        if (response) {
          const petNameSub = this.petService.getPetById(response.mascota)
            .subscribe( petResponse => {
              if (petResponse) {
                this.petName = petResponse.nombre;
              }
            } );

            this.subscriptions.add(petNameSub);

          this.appointment = response;

          this.form.patchValue({
            estado: response.estado,
            urgencia: response.urgencia
          });
        }
      }
      );
    this.subscriptions.add(appointmentSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public onSubmit() {
    if (this.form.valid) {
      const appointment: Appoinment = {
        mascota: this.appointment?.mascota!,
        titulo: this.appointment?.titulo!,
        descripcion: this.appointment?.descripcion!,
        fecha_creacion: this.appointment?.fecha_creacion,
        estado: this.form.value.estado!,
        urgencia: this.form.value.urgencia!,
      }

      console.log(appointment);
      const editAppointmentSub = this.appointmentService.editAppoinment(this.appointment!.pk!, appointment)
        .subscribe( response => {
          if (response) {}
        } );
      this.subscriptions.add(editAppointmentSub);

    }
  }

}
