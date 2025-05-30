import { CommonModule, formatDate, registerLocaleData } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AppoinmentService } from '../../../services/appoinment.service';
import { Subscription } from 'rxjs';
import { PetService } from '../../../services/pet.service';
import { Appoinment } from '../../../interfaces/appoinment.interface';
import localeEs from '@angular/common/locales/es';
import { Reassignment } from '../../../interfaces/reassignment.interface';
import { UserInfoService } from '../../../services/user-info.service';
import { Staff } from '../../../interfaces/staff.interface';
import { ReassignmentService } from '../../../services/reassignment.service';

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
    'En proceso',
    'Resuelta'
  ];

  public showModal = false; // For general success/error messages
  public modalMessage = '';

  public showReassignmentModal = false; // New: For the reassignment modal

  private fb = inject( FormBuilder );
  private appointmentService = inject( AppoinmentService );
  private userInfoService = inject( UserInfoService );
  private petService = inject( PetService )
  private route = inject( ActivatedRoute )
  private router = inject( Router );
  private reassignmentService = inject( ReassignmentService )

  private subscriptions = new Subscription();

  public petName: string = '';

  public form = this.fb.group( {
    fecha_resolucion: [null as any], // Changed Date to null for proper form initialization
    estado: ['pendiente', Validators.required], // Valor por defecto
    urgencia: [false], // Valor por defecto
  } )

  // New: Form for reassignment
  public reassignmentForm = this.fb.group({
    reason: ['', Validators.required]
  });

  public appointment?: Appoinment

  private staff: Staff | null = null;

  ngOnInit(): void {
    this.staff = this.userInfoService.getFullStaffToken()!;


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
      case 'En proceso':
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
        return 'En proceso';
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

        console.log('Updating appointment:', appointment);
        const editAppointmentSub = this.appointmentService.editAppoinment(this.appointment!.pk!, appointment)
          .subscribe(response => {
            if (response === null) {
              this.modalMessage = 'Cita modificada correctamente.'; // Set the message
              this.showModal = true; // Show the modal
            } else {
              // Handle error case if the service returns something else
              this.modalMessage = 'Error al modificar la cita. Por favor, inténtelo de nuevo.';
              this.showModal = true;
            }
          },
          error => {
            console.error('Error modifying appointment:', error);
            this.modalMessage = 'Error de conexión al modificar la cita.';
            this.showModal = true;
          });
        this.subscriptions.add(editAppointmentSub);
      }
    }

    closeModalAndNavigate() {
      this.showModal = false;
      this.router.navigate(['/staff/appointments']);
    }

    // New: Functions for the reassignment modal
    public openReassignmentModal() {
      this.showReassignmentModal = true;
      this.reassignmentForm.reset(); // Reset form when opening
    }

    public closeReassignmentModal() {
      this.showReassignmentModal = false;
      this.reassignmentForm.reset(); // Reset form when closing
    }

    public onReassignmentSubmit() {
      if (this.reassignmentForm.valid) {
        const reassignment: Reassignment = {
          appointment: this.appointment?.pk!,
          appointment_title: this.appointment?.titulo!,
          // NOTE: 'requesting_worker' and 'requesting_worker_name' are placeholders.
          // In a real application, you would fetch the current logged-in user's ID and name.
          requesting_worker: this.staff?.pk!, // Example placeholder ID
          requesting_worker_name: this.staff?.name!, // Example placeholder name
          reason: this.reassignmentForm.value.reason!,
          status: 'pending', // Initial status for a new reassignment request
          requested_at: new Date()
        };

        this.reassignmentService.addReassignment( reassignment )
          .subscribe( response => {
            if( response ) {
              console.log('Reassignment added:', response);

              // Here you would typically call a service to save the reassignment.
              // For this example, we'll just log it and show a success message.

              this.modalMessage = 'Solicitud de reasignación enviada correctamente.';
              this.showReassignmentModal = false; // Close the reassignment modal
              this.showModal = true; // Show the general success modal
            }
          } )

      } else {
        console.log('Reassignment form is invalid.');
        // Optionally, show an error message
        this.modalMessage = 'Por favor, introduce un motivo para la reasignación.';
        this.showModal = true;
      }
    }
  }
