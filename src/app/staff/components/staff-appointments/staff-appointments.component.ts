import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Appoinment } from '../../../interfaces/appoinment.interface';
import { AppoinmentService } from '../../../services/appoinment.service';
import { forkJoin, map, of, Subscription, switchMap, tap, catchError } from 'rxjs';
import { Staff } from '../../../interfaces/staff.interface';
import { UserInfoService } from '../../../services/user-info.service';
import { AuthService } from '../../../services/auth.service';
import { PetService } from '../../../services/pet.service';
import { Client } from '../../../interfaces/client.interface';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ShareAppointmentService } from '../../../services/share-appointment.service';

/**
 * @class StaffAppointmentsComponent
 * @description
 * Componente para gestionar y visualizar las citas del personal.
 * - Los administradores pueden ver todas las citas, las de cada trabajador y reasignarlas.
 * - El personal no administrador ve sus citas asignadas, las citas sin asignar, y aquellas
 * en las que figura como colaborador.
 * - Permite asignar citas pendientes y gestiona la lógica de asignación de clientes al personal.
 */
@Component( {
  selector: 'app-staff-appointments',
  standalone: true,
  templateUrl: './staff-appointments.component.html',
  styleUrl: './staff-appointments.component.css',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
  ],
} )
export class StaffAppointmentsComponent implements OnInit, OnDestroy {

  // --- Propiedades Públicas del Componente ---

  /**
   * @property {Appoinment[]} allAppoinments
   * @description Almacena todas las citas (para administradores) o las citas no asignadas (para el personal).
   */
  public allAppoinments: Appoinment[] = [];

  /**
   * @property {Appoinment[]} workerAppoinments
   * @description Almacena las citas asignadas específicamente al trabajador que ha iniciado sesión.
   */
  public workerAppoinments: Appoinment[] = [];

  /**
   * @property {Staff[]} allStaffMembers
   * @description Contiene la lista de todos los miembros del personal. Usado por administradores para reasignar citas.
   */
  public allStaffMembers: Staff[] = [];

  /**
   * @private
   * @property {Subscription} subscriptions
   * @description Agrupa todas las suscripciones de RxJS para anularlas fácilmente al destruir el componente.
   */
  private subscriptions = new Subscription();

  /**
   * @property {Staff | null} user
   * @description Almacena los datos del miembro del personal que ha iniciado sesión.
   */
  public user?: Staff | null = null;

  // --- Inyección de Dependencias ---

  /**
   * @private
   * @property {AppoinmentService} appoinmentService
   * @description Servicio para gestionar las operaciones relacionadas con las citas.
   */
  private appoinmentService = inject( AppoinmentService );

  /**
   * @private
   * @property {UserInfoService} userInfoService
   * @description Servicio para obtener información del usuario/token almacenado.
   */
  private userInfoService = inject( UserInfoService );

  /**
   * @private
   * @property {AuthService} authService
   * @description Servicio para la autenticación y obtención de datos de usuarios y personal.
   */
  private authService = inject( AuthService );

  /**
   * @private
   * @property {PetService} petService
   * @description Servicio para obtener información sobre las mascotas.
   */
  private petService = inject( PetService );

  /**
   * @private
   * @property {ShareAppointmentService} shareAppointmentService
   * @description Servicio para gestionar las citas compartidas con colaboradores.
   */
  private shareAppointmentService = inject( ShareAppointmentService );

  /**
   * @property {Appoinment[]} colaboratorAppointments
   * @description Almacena las citas en las que el usuario actual es un colaborador.
   */
  public colaboratorAppointments: Appoinment[] = [];

  /**
   * @property {boolean} isAdmin
   * @description Un flag booleano que indica si el usuario actual es administrador.
   */
  public isAdmin: boolean = localStorage.getItem( 'isAdmin' ) === 'true' ? true : false;

  /**
   * @private
   * @property {string | null} userEmail
   * @description Email del usuario logueado, obtenido del token.
   */
  private userEmail: string | null = null;

  /**
   * @method ngOnInit
   * @description
   * Ciclo de vida de Angular. Se ejecuta al iniciar el componente.
   * Carga los datos necesarios según el rol del usuario (admin o personal).
   * - Si es admin, carga todos los miembros del personal y todas las citas.
   * - Si no es admin, carga su propio perfil, sus citas asignadas y las citas no asignadas.
   * - También carga las citas en las que el usuario participa como colaborador.
   * @returns {void}
   */
  ngOnInit(): void {
    const staff = this.userInfoService.getFullStaffToken();

    if ( this.isAdmin ) {
      this.subscriptions.add(
        this.authService.getStaffMembers().subscribe(
          response => this.allStaffMembers = response,
          error => console.error( 'Error al obtener los miembros del personal:', error )
        )
      );

      const allSub = this.appoinmentService.getAppoinments().pipe(
        switchMap( ( appointments: Appoinment[] ) => {
          if ( appointments.length === 0 ) return of( [] );
          const observables = appointments.map( appointment =>
            appointment.trabajador_asignado
              ? this.authService.getStaffPerId( appointment.trabajador_asignado ).pipe(
                  map( worker => ( { ...appointment, workerName: worker ? worker.name : 'Sin Asignar' } ) )
                )
              : of( { ...appointment, workerName: 'Sin Asignar' } )
          );
          return forkJoin( observables );
        } )
      ).subscribe( response => this.allAppoinments = response );
      this.subscriptions.add( allSub );
    }

    this.userEmail = this.userInfoService.getToken();
    if ( this.userEmail ) {
      const staffSub = this.authService.getStaffPerEmail( this.userEmail! )
        .subscribe( response => {
          if ( response.length > 0 ) {
            this.user = response[ 0 ];
            const appoinmentSub = this.appoinmentService.getAppoinmentsByWorkerId( this.user.pk! )
              .subscribe( response => this.workerAppoinments = response.length > 0 ? response : [] );
            this.subscriptions.add( appoinmentSub );
          } else {
            this.user = null;
          }
        } );
      this.subscriptions.add( staffSub );
    }

    if ( !this.isAdmin ) {
      const getAppoinments = this.appoinmentService.getNonAssignedAppoinments()
        .subscribe(
          response => this.allAppoinments = response.length > 0 ? response : [],
          error => console.error( 'Error al obtener citas no asignadas (no-admin):', error )
        );
      this.subscriptions.add( getAppoinments );
    }

    if ( staff ) {
      this.shareAppointmentService.getSharedAppointmentsByCollaborator( staff.pk! ).subscribe( response => {
        if ( response.length > 0 ) {
          const ids = response.map( share => share.appointment );
          ids.forEach( id => {
            this.appoinmentService.getAppoinmentById( id ).subscribe( appoinment => {
              if ( appoinment ) this.colaboratorAppointments.push( appoinment );
              else console.warn( 'Cita no encontrada para el ID compartido:', id );
            }, error => console.error( 'Error al obtener cita por ID:', id, error ) );
          } );
        }
      } );
    }
  }

  /**
   * @method ngOnDestroy
   * @description
   * Ciclo de vida de Angular. Se ejecuta al destruir el componente para anular
   * todas las suscripciones y prevenir fugas de memoria.
   * @returns {void}
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * @method getDisplayStatus
   * @description
   * Convierte el estado interno de una cita (ej. 'en_proceso') a un formato legible
   * para el usuario (ej. 'En proceso').
   * @param {string} estado - El estado interno de la cita.
   * @returns {string} El estado de la cita formateado para mostrar en la UI.
   */
  public getDisplayStatus( estado: string ): string {
    switch ( estado ) {
      case 'pendiente': return 'Pendiente';
      case 'en_proceso': return 'En proceso';
      case 'resuelta': return 'Resuelta';
      case 'esperando': return 'Esperando cliente';
      default: return 'Desconocido';
    }
  }

  /**
   * @method assignAppoinment
   * @description
   * Asigna una cita pendiente al usuario actual. Este proceso implica:
   * 1. Actualizar la cita con el PK del trabajador.
   * 2. Obtener el propietario de la mascota de la cita.
   * 3. Añadir el ID del propietario a la lista `assigned_clients` del trabajador si no está ya incluido.
   * 4. Refrescar las listas de citas en la UI.
   * @param {Appoinment} appoinment - La cita que se va a asignar.
   * @returns {void}
   */
  public assignAppoinment( appoinment: Appoinment ): void {
    if ( !this.user || !this.user.pk ) {
      console.error( 'No se puede asignar: El PK del trabajador actual no está disponible.' );
      return;
    }

    const updatedAppointment: Appoinment = { ...appoinment, trabajador_asignado: this.user!.pk };

    this.appoinmentService.editAppoinment( appoinment.pk!, updatedAppointment ).pipe(
      switchMap( () => this.petService.getPetById( appoinment.mascota ) ),
      switchMap( petResponse => {
        if ( !petResponse ) {
          console.warn( 'Mascota no encontrada para la cita asignada:', appoinment.pk );
          return of( null );
        }
        return this.authService.getUserPerId( petResponse.propietario );
      } ),
      switchMap( ownerResponse => {
        if ( !ownerResponse ) {
          console.warn( 'Propietario no encontrado para la mascota de la cita asignada:', appoinment.pk );
          return of( null );
        }

        const ownerId = ownerResponse.id!;
        return this.authService.getStaffPerId( this.user!.pk! ).pipe(
          switchMap( currentUserStaff => {
            if ( currentUserStaff ) {
              if ( !currentUserStaff.assigned_clients ) currentUserStaff.assigned_clients = [];
              if ( !currentUserStaff.assigned_clients.includes( ownerId ) ) {
                currentUserStaff.assigned_clients.push( ownerId );
                return this.authService.editStaffMember( currentUserStaff.pk!, currentUserStaff );
              }
              return of( null );
            }
            return of( null );
          } )
        );
      } ),
      switchMap( () => this.appoinmentService.getNonAssignedAppoinments() ),
      switchMap( nonAssignedResponse => {
        this.allAppoinments = nonAssignedResponse;
        return this.user && this.user.pk ? this.appoinmentService.getAppoinmentsByWorkerId( this.user.pk! ) : of( [] );
      } )
    ).subscribe(
      workerAppointmentsResponse => this.workerAppoinments = workerAppointmentsResponse || [],
      error => console.error( 'Error durante el proceso de assignAppoinment:', error )
    );
  }

  /**
   * @method reassignAppoinment
   * @description
   * Reasigna una cita de un trabajador a otro (o la deja sin asignar). Esta compleja operación:
   * 1. Actualiza la cita con el PK del nuevo trabajador (o null).
   * 2. Obtiene el propietario de la mascota asociada.
   * 3. Gestiona la lista `assigned_clients` del *antiguo* trabajador: si ya no tiene más citas con
   * ese cliente, se elimina el cliente de su lista.
   * 4. Gestiona la lista `assigned_clients` del *nuevo* trabajador: añade el cliente si no estaba ya.
   * 5. Refresca la lista completa de citas en la UI para el administrador.
   * @param {Appoinment} appoinment - La cita a reasignar.
   * @param {number | null} newWorkerPk - El PK del nuevo trabajador, o null para dejarla "Sin Asignar".
   * @returns {void}
   */
  public reassignAppoinment( appoinment: Appoinment, newWorkerPk: number | null ): void {
    if ( appoinment.trabajador_asignado === newWorkerPk ) return;

    const oldWorkerPk = appoinment.trabajador_asignado;
    const updatedAppointment: Appoinment = { ...appoinment, trabajador_asignado: newWorkerPk };

    this.appoinmentService.editAppoinment( appoinment.pk!, updatedAppointment ).pipe(
      switchMap( () => this.petService.getPetById( appoinment.mascota ) ),
      switchMap( petResponse => {
        if ( !petResponse ) return of( null );
        return this.authService.getUserPerId( petResponse.propietario );
      } ),
      switchMap( ownerResponse => {
        if ( !ownerResponse ) return of( null );
        const ownerId = ownerResponse.id!;
        const staffUpdateObservables: Array<any> = [];

        // Lógica para el ANTIGUO trabajador
        if ( oldWorkerPk ) {
          const oldWorkerUpdate$ = this.authService.getStaffPerId( oldWorkerPk ).pipe(
            switchMap( oldWorker => {
              if ( !oldWorker ) return of( null );
              return this.appoinmentService.getAppoinmentsByWorkerId( oldWorker.pk! ).pipe(
                switchMap( oldWorkerAppointments => {
                  const otherAppointmentsWithOwner = oldWorkerAppointments
                    .filter( appt => appt.pk !== appoinment.pk )
                    .map( appt => this.petService.getPetById( appt.mascota ) );

                  if ( otherAppointmentsWithOwner.length > 0 ) {
                    return forkJoin( otherAppointmentsWithOwner ).pipe(
                      map( pets => {
                        const stillHasAppointments = pets.some( p => p && p.propietario === ownerId );
                        if ( !stillHasAppointments && oldWorker.assigned_clients?.includes( ownerId ) ) {
                          oldWorker.assigned_clients = oldWorker.assigned_clients.filter( id => id !== ownerId );
                          return this.authService.editStaffMember( oldWorker.pk!, oldWorker );
                        }
                        return of( null );
                      } )
                    );
                  } else {
                    if ( oldWorker.assigned_clients?.includes( ownerId ) ) {
                      oldWorker.assigned_clients = oldWorker.assigned_clients.filter( id => id !== ownerId );
                      return this.authService.editStaffMember( oldWorker.pk!, oldWorker );
                    }
                    return of( null );
                  }
                } )
              );
            } )
          );
          staffUpdateObservables.push( oldWorkerUpdate$.toPromise() );
        }

        // Lógica para el NUEVO trabajador
        if ( newWorkerPk ) {
          const newWorkerUpdate$ = this.authService.getStaffPerId( newWorkerPk ).pipe(
            switchMap( newWorker => {
              if ( newWorker ) {
                if ( !newWorker.assigned_clients ) newWorker.assigned_clients = [];
                if ( !newWorker.assigned_clients.includes( ownerId ) ) {
                  newWorker.assigned_clients.push( ownerId );
                  return this.authService.editStaffMember( newWorker.pk!, newWorker );
                }
              }
              return of( null );
            } )
          );
          staffUpdateObservables.push( newWorkerUpdate$.toPromise() );
        }

        return staffUpdateObservables.length > 0 ? forkJoin( staffUpdateObservables.filter( Boolean ) ) : of( ownerResponse );
      } ),
      switchMap( () => this.appoinmentService.getAppoinments() ),
      switchMap( ( appointments: Appoinment[] ) => {
        if ( appointments.length === 0 ) return of( [] );
        const observables = appointments.map( appt => {
          if ( appt.trabajador_asignado ) {
            return this.authService.getStaffPerId( appt.trabajador_asignado ).pipe(
              map( worker => ( { ...appt, workerName: worker ? worker.name : 'Sin Asignar' } ) ),
              catchError( () => of( { ...appt, workerName: 'Error Worker' } ) )
            );
          }
          return of( { ...appt, workerName: 'Sin Asignar' } );
        } );
        return forkJoin( observables );
      } )
    ).subscribe(
      updatedAllAppoinments => this.allAppoinments = updatedAllAppoinments!,
      error => console.error( 'Error final en la suscripción de reassignAppoinment:', error )
    );
  }
}
