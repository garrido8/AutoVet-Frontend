import { CommonModule, formatDate, registerLocaleData } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AppoinmentService } from '../../../services/appoinment.service';
import { Subscription } from 'rxjs';
import { PetService } from '../../../services/pet.service';
import { Appoinment } from '../../../interfaces/appoinment.interface';
import localeEs from '@angular/common/locales/es';

registerLocaleData(localeEs, 'es-ES');

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
    'Pendiente',
    'En Proceso',
    'Resuelta'
  ];

  public showModal = false;
  public modalMessage = '';

  private fb = inject( FormBuilder );
  private appointmentService = inject( AppoinmentService );
  private petService = inject( PetService )
  private route = inject( ActivatedRoute )
  private router = inject( Router );

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
            estado: this.getDisplayStatus(response.estado),
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

  public getDate(date: Date): string {
    const dateFormat = 'dd/MM/yyyy';
    const locale = 'es-ES';
    return formatDate(date, dateFormat, locale);
  }

  private getStatus(estado: string): string {
    switch (estado) {
      case 'Pendiente':
        return 'pendiente';
      case 'En Proceso':
        return 'en_proceso';
      case 'Resuelta':
        return 'resuelta';
      default:
        return 'Desconocido';
    }
  }

    private getDisplayStatus(estado: string): string {
      switch (estado) {
        case 'pendiente':
          return 'Pendiente';
        case 'en_proceso':
          return 'En Proceso';
        case 'resuelta':
          return 'Resuelta';
        default:
          return 'Desconocido';
      }
    }



    public onSubmit() {
      if (this.form.valid) {
        const appointment: Appoinment = {
          mascota: this.appointment?.mascota!,
          titulo: this.appointment?.titulo!,
          descripcion: this.appointment?.descripcion!,
          fecha_creacion: this.appointment?.fecha_creacion,
          estado: this.getStatus(this.form.value.estado!),
          urgencia: this.form.value.urgencia!,
        };

        console.log(appointment);
        const editAppointmentSub = this.appointmentService.editAppoinment(this.appointment!.pk!, appointment)
          .subscribe(response => {
            if (response === null) {
              this.modalMessage = 'Cita modificada correctamente.'; // Set the message
              this.showModal = true; // Show the modal
            }
          });
        this.subscriptions.add(editAppointmentSub);
      }
    }

    closeModalAndNavigate() {
      this.showModal = false;
      this.router.navigate(['/staff/appointments']);
    }

}
