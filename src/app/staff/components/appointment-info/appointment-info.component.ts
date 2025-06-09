import { CommonModule, formatDate, registerLocaleData } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';

// Services
import { AppoinmentService } from '../../../services/appoinment.service';
import { PetService } from '../../../services/pet.service';
import { UserInfoService } from '../../../services/user-info.service';
import { ReassignmentService } from '../../../services/reassignment.service';
import { AppointmentMessageService } from '../../../services/appointment-message.service';
import { ShareAppointmentService } from '../../../services/share-appointment.service';
import { AuthService } from '../../../services/auth.service';

// Interfaces
import { Appoinment } from '../../../interfaces/appoinment.interface';
import { Reassignment } from '../../../interfaces/reassignment.interface';
import { Staff } from '../../../interfaces/staff.interface';
import { AppointmentMessage } from '../../../interfaces/appointment-message.interface';
import { ShareAppointment } from '../../../interfaces/share-appointment.interface';
import { Client } from '../../../interfaces/client.interface';

// Locale configuration
import localeEs from '@angular/common/locales/es';
registerLocaleData( localeEs, 'es-ES' );

@Component( {
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
} )
export class AppointmentInfoComponent implements OnInit, OnDestroy {

  public estados: string[] = [ 'Pendiente', 'En proceso', 'Resuelta' ];
  // FIX 1: Use this object to manage permissions for the view and backend
  public permissionLevels = [
    { value: 'readonly', display: 'Solo Ver' },
    { value: 'editing', display: 'Ver y Editar' }
  ];

  public showModal = false;
  public modalMessage = '';
  public showReassignmentModal = false;
  public showShareModal = false;

  public possibleColaborators: Staff[] = [];
  public selectedCollaborators = new Set<Staff>();

  private fb = inject( FormBuilder );
  private appointmentService = inject( AppoinmentService );
  private userInfoService = inject( UserInfoService );
  private petService = inject( PetService );
  private route = inject( ActivatedRoute );
  private router = inject( Router );
  private reassignmentService = inject( ReassignmentService );
  private appointmentMessageService = inject( AppointmentMessageService );
  private authService = inject( AuthService );
  private shareAppointmentService = inject( ShareAppointmentService );

  private subscriptions = new Subscription();
  public petName: string = '';
  public appointment?: Appoinment;
  private user: Client | Staff | null = null;
  private staff: Staff | null = null; // This is the logged-in staff member
  public fechaResolucionInput: string | null = null;

  public form = this.fb.group( {
    fecha_resolucion: [ null as Date | null ],
    estado: [ 'pendiente', Validators.required ],
    urgencia: [ false ],
  } );

  public reassignmentForm = this.fb.group( {
    reason: [ '', Validators.required ]
  } );

  public messageForm = this.fb.group( {
    content: [ '', Validators.required ]
  } );

  // FIX 2: Use the correct backend value for the default
  public shareForm = this.fb.group( {
    permission: [ 'readonly', Validators.required ]
  } );

  ngOnInit(): void {
    this.user = this.userInfoService.getFullStaffToken() || this.userInfoService.getFullClientToken();
    this.staff = this.userInfoService.getFullStaffToken();
    const id = parseInt( this.route.snapshot.paramMap.get( 'id' )! );

    this.authService.getStaffMembers().subscribe( response => {
      if ( response && this.staff ) {
        this.possibleColaborators = response.filter( staff => staff.pk !== this.staff!.pk && !staff.email.includes( 'admin' ) );
      }
    } )

    const appointmentSub = this.appointmentService.getAppoinmentById( id )
      .subscribe( response => {
        if ( response ) {
          this.appointment = response;
          this.loadRelatedData( response );
        }
      } );
    this.subscriptions.add( appointmentSub );
  }

  private loadRelatedData( appointment: Appoinment ): void {
    const petNameSub = this.petService.getPetById( appointment.mascota )
      .subscribe( petResponse => {
        if ( petResponse ) this.petName = petResponse.nombre;
      } );
    this.subscriptions.add( petNameSub );

    const messagesSub = this.appointmentMessageService.getMessagesByAppointment( appointment.pk! )
      .subscribe( messages => {
        if ( this.appointment ) this.appointment.messages = messages;
      } );
    this.subscriptions.add( messagesSub );

    this.form.patchValue( {
      estado: this.getDisplayStatus( appointment.estado ),
      urgencia: appointment.urgencia,
    } );

    if ( appointment.fecha_resolucion ) {
      this.fechaResolucionInput = this._formatDateForInput( appointment.fecha_resolucion );
      this.form.controls.fecha_resolucion.setValue( new Date( appointment.fecha_resolucion ) );
    }
  }


  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public openShareModal(): void {
    this.selectedCollaborators.clear();
    // FIX 3: Ensure the form resets to the correct default value
    this.shareForm.reset( { permission: 'readonly' } );
    this.showShareModal = true;
  }

  // FIX 4: Complete rewrite of this method
  public confirmShare(): void {
    if ( this.shareForm.invalid || this.selectedCollaborators.size === 0 || !this.appointment ) {
      return;
    }

    const permission = this.shareForm.value.permission as 'readonly' | 'editing';
    const collaboratorsArray = Array.from( this.selectedCollaborators );

    const shareRequests = collaboratorsArray.map( collaborator => {
      // This is the corrected data payload
      const shareData: Partial<ShareAppointment> = {
        appointment: this.appointment!.pk,
        shared_with: collaborator.pk, // Send only the ID
        permission: permission,
        shared_by: this.staff!.pk!
      };
      return this.shareAppointmentService.shareAppointment( shareData );
    } );

    const shareSub = forkJoin( shareRequests ).subscribe( {
      next: () => {
        // Wrap UI updates in setTimeout to prevent ExpressionChanged error
        setTimeout(() => {
          const names = collaboratorsArray.map( c => c.name ).join( ', ' );
          this.modalMessage = `Cita compartida correctamente con: ${ names }.`;
          this.closeShareModal();
          this.showModal = true;
        }, 0);
      },
      error: ( err ) => {
        // Wrap UI updates in setTimeout to prevent ExpressionChanged error
        setTimeout(() => {
          console.error( 'Error sharing appointment:', err );
          this.modalMessage = 'Error al compartir la cita. Por favor, inténtelo de nuevo.';
          this.closeShareModal();
          this.showModal = true;
        }, 0);
      }
    } );

    this.subscriptions.add( shareSub );
  }

  // No changes needed for the methods below
  public closeModal(): void {
    const shouldNavigate = this.modalMessage.includes( 'modificada correctamente' ) || this.modalMessage.includes( 'reasignación enviada' ) || this.modalMessage.includes( 'compartida' );
    this.showModal = false;
    if ( shouldNavigate && !this.modalMessage.includes( 'Error' ) ) {
      if ( this.modalMessage.includes( 'modificada' ) || this.modalMessage.includes( 'reasignación' ) ) {
        this.router.navigate( [ '/staff/appointments' ] );
      }
    }
  }

  private messageUser(): string {
    if ( !this.user ) return 'Usuario Desconocido';
    return this.user.email.includes( 'autovet' ) ? `${ this.user.name } (Trabajador)` : `${ this.user.name } (Cliente)`;
  }

  public onSendMessage(): void {
    if ( this.messageForm.valid && this.appointment?.pk ) {
      const newMessage: Partial<AppointmentMessage> = {
        user: this.messageUser(),
        appointment: this.appointment.pk,
        content: this.messageForm.value.content!,
      };
      const messageSub = this.appointmentMessageService.addMessage( newMessage ).subscribe( {
        next: ( savedMessage ) => { this.appointment?.messages?.push( savedMessage ); this.messageForm.reset(); },
        error: ( err ) => console.error( 'Error sending message:', err )
      } );
      this.subscriptions.add( messageSub );
    }
  }

  public getDate( date: Date ): string { return formatDate( date, 'dd/MM/yyyy', 'es-ES' ); }
  private _formatDateForInput( dateInput: string | Date ): string { const date = new Date( dateInput ); if ( isNaN( date.getTime() ) ) return ''; const year = date.getFullYear(); const month = ( date.getMonth() + 1 ).toString().padStart( 2, '0' ); const day = date.getDate().toString().padStart( 2, '0' ); const hours = date.getHours().toString().padStart( 2, '0' ); const minutes = date.getMinutes().toString().padStart( 2, '0' ); return `${ year }-${ month }-${ day }T${ hours }:${ minutes }`; }
  public updateFechaResolucion( event: Event ): void { const inputElement = event.target as HTMLInputElement; const dateString = inputElement.value; const dateObject = dateString ? new Date( dateString ) : null; this.form.controls.fecha_resolucion.setValue( dateObject && !isNaN( dateObject.getTime() ) ? dateObject : null ); }
  private getStatus( estado: string ): string { const statusMap: { [ key: string ]: string } = { 'Pendiente': 'pendiente', 'En proceso': 'en_proceso', 'Resuelta': 'resuelta' }; return statusMap[ estado ] || 'pendiente'; }
  private getDisplayStatus( estado: string ): string { const displayMap: { [ key: string ]: string } = { 'pendiente': 'Pendiente', 'en_proceso': 'En proceso', 'resuelta': 'Resuelta' }; return displayMap[ estado ] || 'Desconocido'; }
  public onSubmit(): void { if ( this.form.valid && this.appointment ) { const appointmentToUpdate: Appoinment = { ...this.appointment, estado: this.getStatus( this.form.value.estado! ), urgencia: this.form.value.urgencia!, fecha_resolucion: this.form.value.fecha_resolucion!, }; const editSub = this.appointmentService.editAppoinment( this.appointment.pk!, appointmentToUpdate ).subscribe( { next: () => { this.modalMessage = 'Cita modificada correctamente.'; this.showModal = true; }, error: () => { this.modalMessage = 'Error al modificar la cita.'; this.showModal = true; } } ); this.subscriptions.add( editSub ); } }
  public onReassignmentSubmit(): void { if ( this.reassignmentForm.valid && this.appointment && this.staff ) { const reassignment: Reassignment = { appointment: this.appointment.pk!, appointment_title: this.appointment.titulo!, requesting_worker: this.staff.pk!, requesting_worker_name: this.staff.name!, reason: this.reassignmentForm.value.reason!, status: 'pending', requested_at: new Date() }; const reassignmentSub = this.reassignmentService.addReassignment( reassignment ).subscribe( { next: () => { this.modalMessage = 'Solicitud de reasignación enviada.'; this.showReassignmentModal = false; this.showModal = true; }, error: () => { this.modalMessage = 'Error al enviar la solicitud.'; this.showModal = true; } } ); this.subscriptions.add( reassignmentSub ); } }
  public openReassignmentModal(): void { this.showReassignmentModal = true; this.reassignmentForm.reset(); }
  public closeReassignmentModal(): void { this.showReassignmentModal = false; }
  public closeShareModal(): void { this.showShareModal = false; }
  public toggleCollaboratorSelection( collaborator: Staff ): void { if ( this.selectedCollaborators.has( collaborator ) ) { this.selectedCollaborators.delete( collaborator ); } else { this.selectedCollaborators.add( collaborator ); } }
  public isSelected( collaborator: Staff ): boolean { return this.selectedCollaborators.has( collaborator ); }
}
