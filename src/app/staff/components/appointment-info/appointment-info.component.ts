import { CommonModule, formatDate, registerLocaleData } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';
import localeEs from '@angular/common/locales/es';

import { AppoinmentService } from '../../../services/appoinment.service';
import { PetService } from '../../../services/pet.service';
import { UserInfoService } from '../../../services/user-info.service';
import { ReassignmentService } from '../../../services/reassignment.service';
import { AppointmentMessageService } from '../../../services/appointment-message.service';
import { ShareAppointmentService } from '../../../services/share-appointment.service';
import { AuthService } from '../../../services/auth.service';

import { Appoinment } from '../../../interfaces/appoinment.interface';
import { Reassignment } from '../../../interfaces/reassignment.interface';
import { Staff } from '../../../interfaces/staff.interface';
import { Client } from '../../../interfaces/client.interface';
import { AppointmentMessage } from '../../../interfaces/appointment-message.interface';
import { ShareAppointment } from '../../../interfaces/share-appointment.interface';

registerLocaleData( localeEs, 'es-ES' );

/**
 * Componente para mostrar y gestionar la información detallada de una cita,
 * incluyendo su estado, chat, y opciones para compartir o reasignar.
 */
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

  /**
   * Almacena los detalles de la cita que se está visualizando.
   */
  public appointment?: Appoinment;

  /**
   * Almacena la lista de comparticiones asociadas a la cita actual.
   */
  public shares?: ShareAppointment[];

  /**
   * Nombre de la mascota asociada a la cita.
   */
  public petName: string = '';

  /**
   * Valor del input de fecha de resolución, formateado para el control `datetime-local`.
   */
  public fechaResolucionInput: string | null = null;

  /**
   * Indica si el usuario actual tiene permisos para editar la cita.
   */
  public canEditAppointment: boolean = false;

  /**
   * Indica si el usuario actual es un usuario al que se le ha compartido la incidencia.
   */
  public isSharedStaff: boolean = false;

  /**
   * Lista de miembros del personal con los que se puede compartir la cita.
   */
  public possibleColaborators: Staff[] = [];

  /**
   * Lista de miembros del personal con los que ya se ha compartido la cita.
   */
  public existingColaborators: Staff[] = [];

  /**
   * Conjunto de colaboradores seleccionados en el modal de compartir.
   */
  public selectedCollaborators = new Set<Staff>();

  /**
   * Controla la visibilidad del modal genérico de notificaciones.
   */
  public showModal = false;

  /**
   * Mensaje que se mostrará en el modal genérico.
   */
  public modalMessage = '';

  /**
   * Controla la visibilidad del modal de solicitud de reasignación.
   */
  public showReassignmentModal = false;

  /**
   * Controla la visibilidad del modal para compartir la cita.
   */
  public showShareModal = false;

  /**
   * Indica si el usuario logueado es un cliente.
   */
  public isClient: boolean = localStorage.getItem( 'isClient' ) === 'true';

  /**
   * Lista de estados posibles para una cita.
   */
  public estados: string[] = [ 'Pendiente', 'En proceso', 'Resuelta', 'Esperando cliente' ];

  /**
   * Mapa que asocia el ID de un colaborador con su nivel de permiso.
   */
  public permissionMap = new Map<number, string>();

  /**
   * Niveles de permiso disponibles al compartir una cita.
   */
  public permissionLevels = [
    { value: 'readonly', display: 'Solo Ver' },
    { value: 'editing', display: 'Ver y Editar' }
  ];

  /**
   * Formulario para editar los detalles principales de la cita.
   */
  public form = this.fb.group( {
    fecha_resolucion: [ null as Date | null ],
    estado: [ 'pendiente', Validators.required ],
    urgencia: [ false ],
  } );

  /**
   * Formulario para la solicitud de reasignación de la cita.
   */
  public reassignmentForm = this.fb.group( {
    reason: [ '', Validators.required ]
  } );

  /**
   * Formulario para enviar un nuevo mensaje en el chat de la cita.
   */
  public messageForm = this.fb.group( {
    content: [ '', Validators.required ]
  } );

  /**
   * Formulario utilizado en el modal de compartir para asignar permisos.
   */
  public shareForm = this.fb.group( {
    permission: [ 'readonly', Validators.required ]
  } );

  /**
   * Almacena todas las suscripciones del componente para anularlas en `ngOnDestroy`.
   */
  private subscriptions = new Subscription();

  /**
   * Información del usuario logueado si es un miembro del personal.
   */
  private staff: Staff | null = null;

  /**
   * Información del usuario logueado (puede ser personal o cliente).
   */
  private user: Staff | Client | null = null;

  /**
   * Se ejecuta al iniciar el componente. Carga toda la información necesaria de la cita.
   */
  ngOnInit(): void {
    this.staff = this.userInfoService.getFullStaffToken();
    this.user = this.staff || this.userInfoService.getFullClientToken();

    const appointmentId = parseInt( this.route.snapshot.paramMap.get( 'id' )! );

    const data$ = forkJoin( {
      appointment: this.appointmentService.getAppoinmentById( appointmentId ),
      shares: this.shareAppointmentService.getSharedAppointmentsByAppointment( appointmentId ),
      allStaff: this.authService.getStaffMembers()
    } );

    const dataSub = data$.subscribe( ( { appointment, shares, allStaff } ) => {
      if ( !appointment ) {
        return;
      }

      this.appointment = appointment;
      this.shares = shares;
      this.permissionMap.clear();
      for ( const share of shares ) {
        this.permissionMap.set( share.shared_with, share.permission );
      }
      this.determineUserPermissions( appointment, shares );
      this.loadRelatedData( appointment );

      if ( allStaff && this.staff ) {
        const sharedWithPks = new Set( shares.map( s => s.shared_with ) );

        const potentialCollaborators = allStaff.filter(
          staff => staff.pk !== this.staff!.pk && !staff.email.includes( 'admin' )
        );

        this.existingColaborators = potentialCollaborators.filter( p => sharedWithPks.has( p.pk! ) );
        this.possibleColaborators = potentialCollaborators.filter( p => !sharedWithPks.has( p.pk! ) );
      }
    } );

    this.subscriptions.add( dataSub );
  }

  /**
   * Se ejecuta al destruir el componente. Anula todas las suscripciones para evitar fugas de memoria.
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Determina si el usuario actual puede editar la cita basándose en si es el asignado o un colaborador con permisos de edición.
   * @param appointment - La cita actual.
   * @param shares - La lista de comparticiones de la cita.
   */
  private determineUserPermissions( appointment: Appoinment, shares: ShareAppointment[] ): void {
    if ( !this.staff ) {
      this.canEditAppointment = false;
      return;
    }

    if ( appointment.trabajador_asignado === this.staff.pk ) {
      this.canEditAppointment = true;
      return;
    }

    const userShare = shares.find( share => share.shared_with === this.staff!.pk );
    if ( userShare && userShare.permission === 'editing' ) {
      this.canEditAppointment = true;
      this.isSharedStaff = true;
      return;
    }

    this.canEditAppointment = false;
  }

  /**
   * Carga datos relacionados con la cita, como el nombre de la mascota y los mensajes del chat.
   * @param appointment - La cita para la que se cargarán los datos.
   */
  private loadRelatedData( appointment: Appoinment ): void {
    const petNameSub = this.petService.getPetById( appointment.mascota )
      .subscribe( petResponse => {
        if ( petResponse ) {
          this.petName = petResponse.nombre;
        }
      } );
    this.subscriptions.add( petNameSub );

    const messagesSub = this.appointmentMessageService.getMessagesByAppointment( appointment.pk! )
      .subscribe( messages => {
        if ( this.appointment ) {
          this.appointment.messages = messages;
        }
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


  /**
   * Se ejecuta al enviar el formulario de edición de la cita. Guarda los cambios.
   */
  public onSubmit(): void {
    if ( this.form.valid && this.appointment ) {
      const appointmentToUpdate: Appoinment = {
        ...this.appointment,
        estado: this.getStatus( this.form.value.estado! ),
        urgencia: this.form.value.urgencia!,
        fecha_resolucion: this.form.value.fecha_resolucion!,
      };

      const editSub = this.appointmentService.editAppoinment( this.appointment.pk!, appointmentToUpdate ).subscribe( {
        next: () => {
          this.modalMessage = 'Cita modificada correctamente.';
          this.showModal = true;
        },
        error: () => {
          this.modalMessage = 'Error al modificar la cita.';
          this.showModal = true;
        }
      } );
      this.subscriptions.add( editSub );
    }
  }

  /**
   * Se ejecuta al enviar un mensaje en el chat. Añade el mensaje y actualiza el estado de la cita si es necesario.
   */
  public onSendMessage(): void {
    if ( !this.messageForm.valid || !this.appointment?.pk ) {
      return;
    }

    const newMessage: Partial<AppointmentMessage> = {
      user: this.messageUser(),
      appointment: this.appointment.pk,
      content: this.messageForm.value.content!,
    };

    const messageSub = this.appointmentMessageService.addMessage( newMessage ).subscribe( {
      next: ( savedMessage ) => {
        this.appointment?.messages?.push( savedMessage );
        this.messageForm.reset();
      },
      error: ( err ) => console.error( 'Error al enviar el mensaje:', err )
    } );
    this.subscriptions.add( messageSub );

    if ( !this.canEditAppointment && this.appointment && this.appointment.estado !== 'en_proceso' && newMessage.user?.includes( 'Cliente' ) ) {
      const appointmentToUpdate: Appoinment = {
        ...this.appointment,
        estado: 'en_proceso',
      };

      const statusUpdateSub = this.appointmentService.editAppoinment( this.appointment.pk, appointmentToUpdate )
        .subscribe( {
          next: () => {
            if ( this.appointment ) {
              this.appointment.estado = 'en_proceso';
            }
          },
          error: ( err ) => console.error( 'Error al actualizar el estado de la cita:', err )
        } );

      this.subscriptions.add( statusUpdateSub );
    }
  }


  /**
   * Se ejecuta al enviar el formulario de reasignación. Envía la solicitud al servicio.
   */
  public onReassignmentSubmit(): void {
    if ( this.reassignmentForm.valid && this.appointment && this.staff ) {
      const reassignment: Reassignment = {
        appointment: this.appointment.pk!,
        appointment_title: this.appointment.titulo!,
        requesting_worker: this.staff.pk!,
        requesting_worker_name: this.staff.name!,
        reason: this.reassignmentForm.value.reason!,
        status: 'pending',
        requested_at: new Date()
      };
      const reassignmentSub = this.reassignmentService.addReassignment( reassignment ).subscribe( {
        next: () => {
          this.modalMessage = 'Solicitud de reasignación enviada.';
          this.showReassignmentModal = false;
          this.showModal = true;
        },
        error: () => {
          this.modalMessage = 'Error al enviar la solicitud.';
          this.showModal = true;
        }
      } );
      this.subscriptions.add( reassignmentSub );
    }
  }

  /**
   * Confirma y envía las solicitudes para compartir la cita con los colaboradores seleccionados.
   */
  public confirmShare(): void {
    if ( this.shareForm.invalid || this.selectedCollaborators.size === 0 || !this.appointment || !this.staff ) {
      return;
    }

    const permission = this.shareForm.value.permission as 'readonly' | 'editing';
    const collaboratorsArray = Array.from( this.selectedCollaborators );

    const shareRequests = collaboratorsArray.map( collaborator => {
      const shareData: Partial<ShareAppointment> = {
        appointment: this.appointment!.pk,
        shared_with: collaborator.pk,
        permission: permission,
        shared_by: this.staff!.pk
      };
      return this.shareAppointmentService.shareAppointment( shareData );
    } );

    const shareSub = forkJoin( shareRequests ).subscribe( {
      next: ( newShares: ShareAppointment[] ) => {
        setTimeout( () => {
          const addedCollaborators = Array.from( this.selectedCollaborators );
          const addedCollaboratorPks = new Set( addedCollaborators.map( c => c.pk ) );

          this.existingColaborators = [ ...this.existingColaborators, ...addedCollaborators ];
          this.possibleColaborators = this.possibleColaborators.filter(
            c => !addedCollaboratorPks.has( c.pk )
          );
          this.shares = [ ...( this.shares || [] ), ...newShares ];
          newShares.forEach( share => this.permissionMap.set( share.shared_with, share.permission ) );

          this.selectedCollaborators.clear();
          const names = addedCollaborators.map( c => c.name ).join( ', ' );
          this.modalMessage = `Cita compartida correctamente con: ${ names }.`;
          this.closeShareModal();
          this.showModal = true;
        }, 0 );
      },
      error: ( err ) => {
        setTimeout( () => {
          console.error( 'Error al compartir la cita:', err );
          this.modalMessage = 'Error al compartir la cita. Por favor, inténtelo de nuevo.';
          this.closeShareModal();
          this.showModal = true;
        }, 0 );
      }
    } );

    this.subscriptions.add( shareSub );
  }

  /**
   * Abre el modal para compartir la cita.
   */
  public openShareModal(): void {
    this.selectedCollaborators.clear();
    this.shareForm.reset( { permission: 'readonly' } );
    this.showShareModal = true;
  }

  /**
   * Abre el modal para solicitar la reasignación.
   */
  public openReassignmentModal(): void {
    this.showReassignmentModal = true;
    this.reassignmentForm.reset();
  }

  /**
   * Cierra el modal de notificación genérico y navega si es necesario.
   */
  public closeModal(): void {
    const shouldNavigate = this.modalMessage.includes( 'modificada correctamente' ) || this.modalMessage.includes( 'reasignación enviada' ) || this.modalMessage.includes( 'compartida' );
    this.showModal = false;
    if ( shouldNavigate && !this.modalMessage.includes( 'Error' ) ) {
      if ( this.modalMessage.includes( 'modificada' ) || this.modalMessage.includes( 'reasignación' ) ) {
        this.router.navigate( [ '/staff/appointments' ] );
      }
    }
  }

  /**
   * Cierra el modal de reasignación.
   */
  public closeReassignmentModal(): void {
    this.showReassignmentModal = false;
  }

  /**
   * Cierra el modal de compartir.
   */
  public closeShareModal(): void {
    this.showShareModal = false;
  }

  /**
   * Añade o elimina un colaborador de la lista de selección en el modal de compartir.
   * @param collaborator - El colaborador a añadir o quitar.
   */
  public toggleCollaboratorSelection( collaborator: Staff ): void {
    if ( this.selectedCollaborators.has( collaborator ) ) {
      this.selectedCollaborators.delete( collaborator );
    } else {
      this.selectedCollaborators.add( collaborator );
    }
  }

  /**
   * Comprueba si un colaborador está actualmente seleccionado.
   * @param collaborator - El colaborador a comprobar.
   * @returns `true` si está seleccionado, `false` en caso contrario.
   */
  public isSelected( collaborator: Staff ): boolean {
    return this.selectedCollaborators.has( collaborator );
  }

  /**
   * Genera el nombre de usuario para mostrar en un mensaje del chat.
   * @returns El nombre del usuario y su rol.
   */
  private messageUser(): string {
    if ( !this.user ) {
      return 'Usuario desconocido';
    }
    const role = this.isClient ? '(Cliente)' : '(Trabajador)';
    return `${ this.user.name } ${ role }`;
  }

  /**
   * Formatea un objeto Date a una cadena `dd/MM/yyyy`.
   * @param date - La fecha a formatear.
   * @returns La fecha formateada.
   */
  public getDate( date: Date ): string {
    return formatDate( date, 'dd/MM/yyyy', 'es-ES' );
  }

  /**
   * Formatea una fecha para ser usada en un input `datetime-local`.
   * @param dateInput - La fecha a formatear.
   * @returns La cadena de fecha y hora formateada.
   */
  private _formatDateForInput( dateInput: string | Date ): string {
    const date = new Date( dateInput );
    if ( isNaN( date.getTime() ) ) {
      return '';
    }
    const year = date.getFullYear();
    const month = ( date.getMonth() + 1 ).toString().padStart( 2, '0' );
    const day = date.getDate().toString().padStart( 2, '0' );
    const hours = date.getHours().toString().padStart( 2, '0' );
    const minutes = date.getMinutes().toString().padStart( 2, '0' );
    return `${ year }-${ month }-${ day }T${ hours }:${ minutes }`;
  }

  /**
   * Actualiza el valor de `fecha_resolucion` en el formulario cuando cambia el input.
   * @param event - El evento de input del elemento.
   */
  public updateFechaResolucion( event: Event ): void {
    const inputElement = event.target as HTMLInputElement;
    const dateString = inputElement.value;
    const dateObject = dateString ? new Date( dateString ) : null;
    this.form.controls.fecha_resolucion.setValue( dateObject && !isNaN( dateObject.getTime() ) ? dateObject : null );
  }

  /**
   * Convierte un estado legible para el usuario a su valor interno para la API.
   * @param estado - El estado legible ('Pendiente', 'En proceso', etc.).
   * @returns El estado interno ('pendiente', 'en_proceso', etc.).
   */
  private getStatus( estado: string ): string {
    const statusMap: { [ key: string ]: string; } = {
      'Pendiente': 'pendiente',
      'En proceso': 'en_proceso',
      'Resuelta': 'resuelta',
      'Esperando cliente': 'esperando'
    };
    return statusMap[ estado ] || 'pendiente';
  }

  /**
   * Convierte un estado interno de la API a un formato legible para el usuario.
   * @param estado - El estado interno ('pendiente', 'en_proceso', etc.).
   * @returns El estado legible ('Pendiente', 'En proceso', etc.).
   */
  public getDisplayStatus( estado: string ): string {
    const displayMap: { [ key: string ]: string; } = {
      'pendiente': 'Pendiente',
      'en_proceso': 'En proceso',
      'resuelta': 'Resuelta',
      'esperando': 'Esperando cliente'
    };
    return displayMap[ estado ] || 'Desconocido';
  }

  /**
   * Elimina el acceso de un colaborador a la cita.
   * @param collaboratorToRemove - El colaborador al que se le quitará el acceso.
   */
  public removeCollaborator( collaboratorToRemove: Staff ): void {
    const share = this.shares!.find( s => s.shared_with === collaboratorToRemove.pk );

    if ( !share || !share.id ) {
      console.error( 'No se pudo encontrar la compartición para eliminar' );
      this.modalMessage = 'Error al quitar el acceso.';
      this.showModal = true;
      return;
    }

    this.shareAppointmentService.deleteSharedAppointment( share.id ).subscribe( {
      next: () => {
        this.existingColaborators = this.existingColaborators.filter(
          c => c.pk !== collaboratorToRemove.pk
        );
        this.possibleColaborators = [ ...this.possibleColaborators, collaboratorToRemove ];
        this.shares = this.shares!.filter( s => s.id !== share.id );
        this.permissionMap.delete( collaboratorToRemove.pk! );

        this.modalMessage = `${ collaboratorToRemove.name } ya no tiene acceso.`;
        this.showModal = true;
      },
      error: ( err ) => {
        console.error( 'Error al eliminar el colaborador', err );
        this.modalMessage = 'Error al quitar el acceso.';
        this.showModal = true;
      }
    } );
  }

  /**
   * Gestiona el cambio de permiso desde el `select` en el modal de compartir.
   * @param collaborator - El colaborador cuyo permiso se está cambiando.
   * @param newPermission - El nuevo valor del permiso ('readonly' o 'editing').
   */
  public onPermissionChange( collaborator: Staff, newPermission: 'readonly' | 'editing' ): void {
    const share = this.shares!.find( s => s.shared_with === collaborator.pk );

    if ( !share || !share.id ) {
      console.error( 'No se pudo encontrar la compartición para actualizar' );
      this.modalMessage = 'Error al actualizar el permiso: no se encontró la compartición.';
      this.showModal = true;
      return;
    }

    this.shareAppointmentService.updateSharedAppointment( share.id, { permission: newPermission } ).subscribe( {
      next: ( updatedShare ) => {
        this.permissionMap.set( collaborator.pk!, updatedShare.permission );
        share.permission = updatedShare.permission;
        this.modalMessage = `Permiso de ${ collaborator.name } actualizado.`;
        this.showModal = true;
      },
      error: ( err ) => {
        console.error( 'Error al actualizar el permiso', err );
        this.modalMessage = 'Error al actualizar el permiso. El cambio no se guardó.';
        this.showModal = true;
      }
    } );
  }
}
