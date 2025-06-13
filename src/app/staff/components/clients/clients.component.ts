import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

// Servicios
import { AuthService } from '../../../services/auth.service';
import { UserInfoService } from '../../../services/user-info.service';

// Interfaces
import { Client } from '../../../interfaces/client.interface';
import { Staff } from '../../../interfaces/staff.interface';

/**
 * @class ClientsComponent
 * @description Componente encargado de mostrar una lista de clientes.
 * La lista de clientes mostrada varía según el rol del usuario logueado:
 * - Si el usuario es **administrador**, se muestran todos los clientes.
 * - Si el usuario es **personal (staff)**, se muestran solo los clientes que le han sido asignados.
 */
@Component({
  selector: 'app-clients',
  standalone: true,
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.css',
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class ClientsComponent implements OnInit, OnDestroy {

  /**
   * @private
   * @property {Subscription} subscriptions - Objeto para gestionar todas las suscripciones de RxJS.
   * Permite desuscribirse de todas las suscripciones activas en `ngOnDestroy` para prevenir fugas de memoria.
   */
  private subscriptions = new Subscription();

  /**
   * @private
   * @property {UserInfoService} userInfoService - Servicio inyectado para obtener información del usuario, como el token y el rol.
   */
  private userInfoService = inject( UserInfoService );

  /**
   * @private
   * @property {AuthService} authService - Servicio inyectado para realizar operaciones de autenticación y obtener datos de usuarios/clientes.
   */
  private authService = inject( AuthService );

  /**
   * @public
   * @property {boolean} isAdmin - Bandera que indica si el usuario logueado tiene rol de administrador.
   * Se inicializa leyendo el valor de 'isAdmin' del `localStorage`.
   */
  public isAdmin: boolean = localStorage.getItem('isAdmin') === 'true';

  /**
   * @private
   * @property {Router} router - Servicio inyectado para la navegación programática dentro de la aplicación.
   */
  private router = inject( Router );

  /**
   * @public
   * @property {Client[]} clients - Array que almacena los objetos de clientes a mostrar en la interfaz.
   * Se rellena dinámicamente en `ngOnInit` según el rol del usuario.
   */
  public clients: Client[] = [];

  /**
   * @method ngOnInit
   * @description Hook del ciclo de vida que se ejecuta después de que se inicializan las propiedades enlazadas a datos del componente.
   * Implementa la lógica para cargar los clientes:
   * - Si `isAdmin` es `true`, obtiene todos los clientes a través de `authService.getClients()`.
   * - Si no es administrador, obtiene el token del usuario y luego el miembro del personal asociado a ese token,
   * para finalmente cargar solo los clientes que le han sido asignados.
   */
  ngOnInit(): void {
    const token = this.userInfoService.getToken();

    // Lógica para administradores: Obtener todos los clientes
    if ( this.isAdmin ) {
      console.log('Fetching all clients for admin user...');
      const allClientsSub = this.authService.getClients()
        .subscribe( response => {
          if ( response ) {
            this.clients = response;
            console.log('All clients loaded:', this.clients);
          } else {
            console.log('No clients found for admin.');
          }
        });
      this.subscriptions.add(allClientsSub); // Añadir suscripción para desuscripción en ngOnDestroy
      return; // Salir de la función ya que la lógica para admin es exclusiva
    }

    // Lógica para personal (staff): Obtener clientes asignados
    if ( token ) {
      console.log('Fetching assigned clients for staff user...');
      const staffMemberSub = this.authService.getStaffPerEmail(token)
        .subscribe( response => {
          if ( response.length > 0 ) {
            const staffMember: Staff = response[0];
            const clientsIds = staffMember.assigned_clients;

            if (clientsIds && clientsIds.length > 0) {
              // Para cada ID de cliente asignado, obtener los detalles del cliente
              clientsIds.forEach( (clientId: number) => {
                const userPerIdSub = this.authService.getUserPerId(clientId)
                  .subscribe( clientResponse => {
                    if ( clientResponse ) {
                      this.clients.push(clientResponse);
                      // Opcional: ordenar la lista de clientes si es necesario
                      // this.clients.sort((a, b) => a.name.localeCompare(b.name));
                    } else {
                      console.log(`No client found with ID: ${clientId}`);
                    }
                  });
                this.subscriptions.add(userPerIdSub); // Añadir suscripción de cada cliente
              });
              console.log('Client Data received and being processed:', this.clients);
            } else {
              console.log('No assigned clients for this staff member.');
            }
          } else {
            console.log('No staff member found with this email token.');
          }
        });
      this.subscriptions.add(staffMemberSub); // Añadir suscripción del miembro del personal
    } else {
      console.log('No token found, cannot fetch client data.');
    }
  }

  /**
   * @method ngOnDestroy
   * @description Hook del ciclo de vida que se ejecuta cuando el componente se destruye.
   * Desuscribe todas las suscripciones de RxJS gestionadas por el objeto `subscriptions`
   * para evitar fugas de memoria.
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // /**
  //  * @public
  //  * @method goToClient
  //  * @description Método de navegación para ir a la página de información de un cliente específico.
  //  * (Actualmente comentado en el código original, pero puede ser útil si se implementa).
  //  * @param {Client} client - El objeto cliente al que se desea navegar.
  //  */
  // public goToClient(client: Client): void {
  //   this.router.navigate(['/staff/client-info', client.id]); // Ejemplo: Pasando el ID del cliente
  // }

}
