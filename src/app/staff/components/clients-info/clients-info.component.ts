import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map, Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { Client } from '../../../interfaces/client.interface';
import { PetService } from '../../../services/pet.service';
import { Pet } from '../../../interfaces/pet.interface';
import { AppoinmentService } from '../../../services/appoinment.service';
import { Appoinment } from '../../../interfaces/appoinment.interface';
import { UserInfoService } from '../../../services/user-info.service';
import { forkJoin } from 'rxjs';
import { Staff } from '../../../interfaces/staff.interface';

/**
 * @class ClientsInfoComponent
 * @description
 * Este componente se encarga de mostrar la información detallada de un cliente,
 * incluyendo sus mascotas y las citas asociadas a cada una. Permite al personal
 * de la clínica ver los datos del cliente y gestionar sus mascotas y citas.
 * También filtra las citas para que el personal no administrador solo vea las que tiene asignadas.
 */
@Component( {
  selector: 'app-clients-info',
  standalone: false,
  templateUrl: './clients-info.component.html',
  styleUrl: './clients-info.component.css'
} )
export class ClientsInfoComponent implements OnInit, OnDestroy {

  // --- Inyección de Dependencias ---

  /**
   * @private
   * @property {ActivatedRoute} route
   * @description Proporciona acceso a la información de la ruta asociada con este componente.
   */
  private route = inject( ActivatedRoute );

  /**
   * @private
   * @property {Router} router
   * @description Proporciona capacidades de navegación para moverse entre vistas.
   */
  private router = inject( Router );

  /**
   * @private
   * @property {AuthService} authService
   * @description Servicio para gestionar la autenticación y obtener datos de usuarios y personal.
   */
  private authService = inject( AuthService );

  /**
   * @private
   * @property {PetService} petService
   * @description Servicio para gestionar las operaciones CRUD relacionadas con las mascotas.
   */
  private petService = inject( PetService );

  /**
   * @private
   * @property {AppoinmentService} appoinmentService
   * @description Servicio para gestionar las operaciones CRUD relacionadas con las citas.
   */
  private appoinmentService = inject( AppoinmentService );

  /**
   * @private
   * @property {UserInfoService} userInfoService
   * @description Servicio para compartir información del usuario entre componentes.
   */
  private userInfoService = inject( UserInfoService );

  /**
   * @private
   * @property {Subscription} subscriptions
   * @description Contenedor para todas las suscripciones de RxJS, facilitando su anulación en ngOnDestroy.
   */
  private subscriptions = new Subscription();

  // --- Propiedades Públicas del Componente ---

  /**
   * @property {Client | null} client
   * @description Almacena los datos del cliente que se está visualizando. Es nulo hasta que los datos se cargan.
   */
  public client: Client | null = null;

  /**
   * @property {Pet[]} pets
   * @description Array que contiene las mascotas del cliente, incluyendo sus respectivas citas.
   */
  public pets: Pet[] = [];

  /**
   * @property {{ [petId: number]: boolean }} appointmentsVisibility
   * @description Objeto para controlar la visibilidad (mostrar/ocultar) de la lista de citas para cada mascota.
   */
  public appointmentsVisibility: { [petId: number]: boolean } = {};

  /**
   * @property {number | null} selectedPetPk
   * @description Almacena la clave primaria (PK) de la mascota seleccionada.
   */
  public selectedPetPk: number | null = null;

  /**
   * @property {string} profileUrl
   * @description URL de la foto de perfil del cliente.
   * @deprecated Esta propiedad no se usa directamente en la plantilla, se usa `client.photo`.
   */
  public profileUrl: string = '';

  /**
   * @private
   * @property {string} backendBaseUrl
   * @description URL base del backend para construir las rutas completas de los recursos (ej. fotos).
   */
  private backendBaseUrl: string = 'http://127.0.0.1:8000';

  /**
   * @property {Staff | null} currentWorker
   * @description Almacena la información del miembro del personal (trabajador) que ha iniciado sesión.
   */
  public currentWorker: Staff | null = null;

  /**
   * @property {boolean} isAdmin
   * @description Flag que indica si el usuario actual es un administrador, leído desde el localStorage.
   */
  public isAdmin: boolean = localStorage.getItem( 'isAdmin' ) === 'true';

  /**
   * @method ngOnInit
   * @description
   * Ciclo de vida de Angular. Se ejecuta al iniciar el componente.
   * Obtiene el email del token del usuario logueado para identificar al trabajador actual.
   * Una vez identificado el trabajador (o si no se encuentra), carga los datos del cliente.
   * @returns {void}
   */
  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get( 'id' );
    const userEmail = this.userInfoService.getToken();

    if ( userEmail ) {
      this.subscriptions.add(
        this.authService.getStaffPerEmail( userEmail ).subscribe(
          ( staffMembers: Staff[] ) => {
            if ( staffMembers.length > 0 ) {
              this.currentWorker = staffMembers[ 0 ];
            } else {
              console.warn( 'No se encontró ningún miembro del personal para el email actual.' );
              this.currentWorker = null;
            }
            this.loadClientData( idParam ); // Carga los datos del cliente después de obtener el trabajador.
          },
          error => {
            console.error( 'Error al obtener el miembro del personal actual:', error );
            this.currentWorker = null;
            this.loadClientData( idParam ); // Intenta cargar los datos del cliente igualmente.
          }
        )
      );
    } else {
      console.warn( 'No se encontró email en el token. No se puede identificar al trabajador actual.' );
      this.currentWorker = null;
      this.loadClientData( idParam ); // Carga los datos del cliente sin filtro de trabajador.
    }
  }

  /**
   * @private
   * @method loadClientData
   * @description
   * Carga los datos del cliente y sus mascotas basándose en el ID proporcionado en la ruta.
   * Para cada mascota, obtiene sus citas y las filtra según si el usuario es administrador
   * o el trabajador asignado a la cita.
   * @param {string | null} idParam - El ID del cliente obtenido de los parámetros de la ruta.
   * @returns {void}
   */
  private loadClientData( idParam: string | null ): void {
    if ( idParam ) {
      const clientId = Number( idParam );
      const userSub = this.authService.getUserPerId( clientId )
        .subscribe( user => {
          if ( user ) {
            this.client = user;
            if ( user.photo ) {
              this.client.photo = `${ this.backendBaseUrl }${ user.photo }`;
            } else {
              this.client.photo = '';
            }

            const petSub = this.petService.getPetByOwner( user.id! )
              .subscribe( pets => {
                if ( pets && pets.length > 0 ) {
                  const petAppointmentObservables = pets.map( pet =>
                    this.appoinmentService.getAppoinmentByPet( pet.pk! ).pipe(
                      map( appointments => {
                        const filteredAppointments = this.isAdmin || !this.currentWorker
                          ? appointments
                          : appointments.filter( app => app.trabajador_asignado === this.currentWorker!.pk );

                        return { ...pet, appoinments: filteredAppointments || [] };
                      } )
                    )
                  );

                  this.subscriptions.add(
                    forkJoin( petAppointmentObservables ).subscribe(
                      ( petsWithAppointments: Pet[] ) => {
                        this.pets = petsWithAppointments;
                        this.pets.forEach( pet => {
                          this.appointmentsVisibility[ pet.pk! ] = false;
                        } );
                      },
                      error => console.error( 'Error al obtener las citas de las mascotas:', error )
                    )
                  );
                } else {
                  this.pets = [];
                }
              },
              error => console.error( 'Error al obtener las mascotas del cliente:', error )
              );
            this.subscriptions.add( petSub );
          } else {
            console.warn( 'Cliente no encontrado con el ID:', clientId );
            this.router.navigate( [ '/staff/clients' ] );
          }
        },
        error => console.error( 'Error al obtener la información del cliente:', error )
        );
      this.subscriptions.add( userSub );
    } else {
      console.warn( 'No se proporcionó un ID de cliente en la ruta.' );
      this.router.navigate( [ '/staff/clients' ] );
    }
  }

  /**
   * @method ngOnDestroy
   * @description
   * Ciclo de vida de Angular. Se ejecuta al destruir el componente.
   * Anula todas las suscripciones a observables para prevenir fugas de memoria.
   * @returns {void}
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * @method getText
   * @description
   * Devuelve el texto 'año' o 'años' dependiendo del número proporcionado.
   * @param {number} age - La edad para la cual se determinará el texto.
   * @returns {string} La palabra 'año' o 'años'.
   */
  public getText( age: number ): string {
    return age === 1 ? 'año' : 'años';
  }

  /**
   * @method getAppointmentsByStatus
   * @description
   * Filtra una lista de citas y devuelve solo aquellas que coinciden con el estado especificado.
   * @param {Appoinment[]} appointments - El array de citas a filtrar.
   * @param {string} status - El estado por el cual filtrar ('finalizada', 'pendiente', etc.).
   * @returns {Appoinment[]} Un nuevo array con las citas filtradas.
   */
  public getAppointmentsByStatus( appointments: Appoinment[], status: string ): Appoinment[] {
    return appointments.filter( app => app.estado === status );
  }

  /**
   * @method toggleAppointmentsVisibility
   * @description
   * Cambia el estado de visibilidad (verdadero/falso) de la lista de citas para una mascota específica.
   * @param {number} petId - El ID de la mascota cuya visibilidad de citas se va a cambiar.
   * @returns {void}
   */
  public toggleAppointmentsVisibility( petId: number ): void {
    this.appointmentsVisibility[ petId ] = !this.appointmentsVisibility[ petId ];
  }

  /**
   * @method goToAddPet
   * @description
   * Navega a la página de añadir mascota, guardando primero el ID del cliente actual
   * en `userInfoService` para que el componente de destino sepa a quién pertenece la nueva mascota.
   * @returns {void}
   */
  public goToAddPet(): void {
    if ( this.client && this.client.id ) {
      this.userInfoService.setUserId( this.client.id );
      this.router.navigate( [ '/staff/add-pet' ] );
    } else {
      console.error( 'No se puede añadir mascota: el ID del cliente no está disponible.' );
    }
  }
}
