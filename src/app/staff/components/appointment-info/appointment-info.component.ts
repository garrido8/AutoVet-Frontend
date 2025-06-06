import { CommonModule, formatDate, registerLocaleData } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

// Services
import { AppoinmentService } from '../../../services/appoinment.service';
import { PetService } from '../../../services/pet.service';
import { UserInfoService } from '../../../services/user-info.service';
import { ReassignmentService } from '../../../services/reassignment.service';
import { AppointmentMessageService } from '../../../services/appointment-message.service';

// Interfaces
import { Appoinment } from '../../../interfaces/appoinment.interface';
import { Reassignment } from '../../../interfaces/reassignment.interface';
import { Staff } from '../../../interfaces/staff.interface';
import { AppointmentMessage } from '../../../interfaces/appointment-message.interface';

// Locale configuration
import localeEs from '@angular/common/locales/es';
import { Client } from '../../../interfaces/client.interface';
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

  public estados: string[] = ['Pendiente', 'En proceso', 'Resuelta'];
  public showModal = false;
  public modalMessage = '';
  public showReassignmentModal = false;

  private fb = inject(FormBuilder);
  private appointmentService = inject(AppoinmentService);
  private userInfoService = inject(UserInfoService);
  private petService = inject(PetService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reassignmentService = inject(ReassignmentService);
  private appointmentMessageService = inject(AppointmentMessageService);

  private subscriptions = new Subscription();
  public petName: string = '';
  public appointment?: Appoinment;
  private user: Client | Staff | null = null;
  private staff: Staff | null = null;
  public fechaResolucionInput: string | null = null;

  public form = this.fb.group({
    fecha_resolucion: [null as Date | null],
    estado: ['pendiente', Validators.required],
    urgencia: [false],
  });

  public reassignmentForm = this.fb.group({
    reason: ['', Validators.required]
  });

  public messageForm = this.fb.group({
    content: ['', Validators.required]
  });

  ngOnInit(): void {
    this.user = this.userInfoService.getFullStaffToken() || this.userInfoService.getFullClientToken();
    this.staff = this.userInfoService.getFullStaffToken();
    const id = parseInt(this.route.snapshot.paramMap.get('id')!);

    const appointmentSub = this.appointmentService.getAppoinmentById(id)
      .subscribe(response => {
        if (response) {
          this.appointment = response;

          const petNameSub = this.petService.getPetById(response.mascota)
            .subscribe(petResponse => {
              if (petResponse) this.petName = petResponse.nombre;
            });
          this.subscriptions.add(petNameSub);

          const messagesSub = this.appointmentMessageService.getMessagesByAppointment(response.pk!)
            .subscribe(messages => {
              if (this.appointment) this.appointment.messages = messages;
            });
          this.subscriptions.add(messagesSub);

          this.form.patchValue({
            estado: this.getDisplayStatus(response.estado),
            urgencia: response.urgencia,
          });

          if (response.fecha_resolucion) {
            this.fechaResolucionInput = this._formatDateForInput(response.fecha_resolucion);
            this.form.controls.fecha_resolucion.setValue(new Date(response.fecha_resolucion));
          }
        }
      });
    this.subscriptions.add(appointmentSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private messageUser(): string {
    // Ensure we have a user object before trying to access its properties
    if (!this.user) {
      return 'Usuario Desconocido'; // Return a default value if user is null
    }

    // CORRECTED: Use ${...} to insert the variable's value into the string
    if (this.user.email.includes('autovet')) {
      return `${this.user!.name} (Trabajador)`;
    } else {
      return `${this.user!.name} (Cliente)`;
    }
  }

  public onSendMessage(): void {
    if (this.messageForm.valid && this.appointment?.pk) {
      const newMessage: Partial<AppointmentMessage> = {
        user: this.messageUser(),
        appointment: this.appointment.pk,
        content: this.messageForm.value.content!,
      };

      const messageSub = this.appointmentMessageService.addMessage(newMessage)
        .subscribe({
          next: (savedMessage) => {
            this.appointment?.messages?.push(savedMessage);
            this.messageForm.reset();
          },
          error: (err) => console.error('Error sending message:', err)
        });
      this.subscriptions.add(messageSub);
    }
  }

  public getDate(date: Date): string {
    return formatDate(date, 'dd/MM/yyyy', 'es-ES');
  }

  private _formatDateForInput(dateInput: string | Date): string {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  public updateFechaResolucion(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const dateString = inputElement.value;
    const dateObject = dateString ? new Date(dateString) : null;
    this.form.controls.fecha_resolucion.setValue(dateObject && !isNaN(dateObject.getTime()) ? dateObject : null);
  }

  private getStatus(estado: string): string {
    const statusMap: { [key: string]: string } = { 'Pendiente': 'pendiente', 'En proceso': 'en_proceso', 'Resuelta': 'resuelta' };
    return statusMap[estado] || 'pendiente';
  }

  private getDisplayStatus(estado: string): string {
    const displayMap: { [key: string]: string } = { 'pendiente': 'Pendiente', 'en_proceso': 'En proceso', 'resuelta': 'Resuelta' };
    return displayMap[estado] || 'Desconocido';
  }

  public onSubmit(): void {
    if (this.form.valid && this.appointment) {
      const appointmentToUpdate: Appoinment = {
        ...this.appointment,
        estado: this.getStatus(this.form.value.estado!),
        urgencia: this.form.value.urgencia!,
        fecha_resolucion: this.form.value.fecha_resolucion!,
      };
      const editSub = this.appointmentService.editAppoinment(this.appointment.pk!, appointmentToUpdate)
        .subscribe({
          next: () => {
            this.modalMessage = 'Cita modificada correctamente.';
            this.showModal = true;
          },
          error: () => {
            this.modalMessage = 'Error al modificar la cita.';
            this.showModal = true;
          }
        });
      this.subscriptions.add(editSub);
    }
  }

  public onReassignmentSubmit(): void {
    if (this.reassignmentForm.valid && this.appointment && this.staff) {
      const reassignment: Reassignment = {
        appointment: this.appointment.pk!,
        appointment_title: this.appointment.titulo!,
        requesting_worker: this.staff.pk!,
        requesting_worker_name: this.staff.name!,
        reason: this.reassignmentForm.value.reason!,
        status: 'pending',
        requested_at: new Date()
      };
      const reassignmentSub = this.reassignmentService.addReassignment(reassignment)
        .subscribe({
          next: () => {
            this.modalMessage = 'Solicitud de reasignación enviada.';
            this.showReassignmentModal = false;
            this.showModal = true;
          },
          error: () => {
            this.modalMessage = 'Error al enviar la solicitud.';
            this.showModal = true;
          }
        });
      this.subscriptions.add(reassignmentSub);
    }
  }

  public closeModalAndNavigate(): void {
    this.showModal = false;
    this.router.navigate(['/staff/appointments']);
  }

  public openReassignmentModal(): void {
    this.showReassignmentModal = true;
    this.reassignmentForm.reset();
  }

  public closeReassignmentModal(): void {
    this.showReassignmentModal = false;
  }
}
