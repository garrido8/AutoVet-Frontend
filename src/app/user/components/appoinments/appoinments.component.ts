import { Component, inject, OnInit } from '@angular/core';
import { UserInfoService } from '../../../services/user-info.service';
import { AuthService } from '../../../services/auth.service';
import { PetService } from '../../../services/pet.service';
import { AppoinmentService } from '../../../services/appoinment.service';
import { Appoinment } from '../../../interfaces/appoinment.interface';
import { Client } from '../../../interfaces/client.interface';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

/**
 * @class AppoinmentsComponent
 * @description
 * Este componente se encarga de mostrar la lista de citas de un cliente.
 * Obtiene las mascotas del cliente logueado y, para cada una, busca sus citas asociadas.
 * Enriquece cada cita con el nombre de la mascota correspondiente antes de mostrarla en la lista.
 */
@Component( {
  selector: 'app-appoinments',
  standalone: true,
  templateUrl: './appoinments.component.html',
  styleUrl: './appoinments.component.css',
  imports: [
    CommonModule,
    RouterModule
  ]
} )
export class AppoinmentsComponent implements OnInit {

  // --- Inyección de Dependencias ---

  /**
   * @private
   * @property {UserInfoService} userInfoService
   * @description Servicio para obtener información del usuario, como el token de sesión.
   */
  private userInfoService = inject( UserInfoService );

  /**
   * @private
   * @property {AuthService} authService
   * @description Servicio de autenticación para obtener los datos del usuario a partir del token.
   */
  private authService = inject( AuthService );

  /**
   * @private
   * @property {PetService} petService
   * @description Servicio para gestionar las operaciones relacionadas con las mascotas.
   */
  private petService = inject( PetService );

  /**
   * @private
   * @property {AppoinmentService} appoinmentService
   * @description Servicio para gestionar las operaciones relacionadas con las citas.
   */
  private appoinmentService = inject( AppoinmentService );

  // --- Propiedades Públicas ---

  /**
   * @property {Appoinment[]} appoinments
   * @description Array que almacena todas las citas del cliente, enriquecidas con el nombre de la mascota.
   */
  public appoinments: Appoinment[] = [];

  /**
   * @method ngOnInit
   * @description
   * Ciclo de vida de Angular que se ejecuta al iniciar el componente.
   * Orquesta la obtención del usuario, sus mascotas y finalmente sus citas,
   * acumulándolas en la propiedad `appoinments`.
   * @returns {void}
   */
  ngOnInit(): void {
    const token = this.userInfoService.getToken();

    if ( token ) {
      this.authService.getUserPerEmail( token )
        .subscribe( response => {
          const user: Client = response[ 0 ];

          this.petService.getPetByOwner( user.id! )
            .subscribe( pets => {

              pets.forEach( pet => {
                this.appoinmentService.getAppoinmentByPet( pet.pk! )
                  .subscribe( appoinments => {
                    // Enriquece cada cita con el nombre de la mascota antes de añadirla a la lista.
                    const enrichedAppoinments = appoinments.map( app => ( {
                      ...app,
                      petName: pet.nombre
                    } ) );

                    // Agrega las citas enriquecidas al array general de forma inmutable.
                    this.appoinments = [ ...this.appoinments, ...enrichedAppoinments ];
                  } );
              } );

            } );
        } );
    }
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
      case 'pendiente':
        return 'Pendiente';
      case 'en_proceso':
        return 'En proceso';
      case 'resuelta':
        return 'Resuelta';
      case 'esperando':
        return 'Esperando cliente';
      default:
        return 'Desconocido';
    }
  }

}
