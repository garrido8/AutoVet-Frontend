import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { PetService } from '../../../services/pet.service';
import { Client } from '../../../interfaces/client.interface';
import { UserInfoService } from '../../../services/user-info.service';
import { Pet } from '../../../interfaces/pet.interface';
import { AppoinmentService } from '../../../services/appoinment.service';

/**
 * @class PetsComponent
 * @description
 * Este componente se encarga de mostrar una lista de las mascotas pertenecientes al cliente
 * que ha iniciado sesión. Para cada mascota, también carga y asocia su historial de citas.
 * Además, proporciona una función para formatear el peso de la mascota.
 */
@Component({
  selector: 'app-pets',
  standalone: false,
  templateUrl: './pets.component.html',
  styleUrl: './pets.component.css'
})
export class PetsComponent implements OnInit {

  // --- Inyección de Dependencias ---

  /**
   * @private
   * @property {AuthService} authService
   * @description Servicio para la autenticación y obtención de datos de usuario.
   */
  private authService = inject(AuthService);

  /**
   * @private
   * @property {UserInfoService} userInfoService
   * @description Servicio para obtener información del usuario logueado, como su token/email.
   */
  private userInfoService = inject(UserInfoService);

  /**
   * @private
   * @property {PetService} petService
   * @description Servicio para realizar operaciones CRUD relacionadas con las mascotas.
   */
  private petService = inject(PetService);

  /**
   * @private
   * @property {AppoinmentService} appoinmentService
   * @description Servicio para realizar operaciones relacionadas con las citas.
   */
  private appoinmentService = inject(AppoinmentService);

  // --- Propiedades Públicas ---

  /**
   * @property {Pet[]} pets
   * @description Array que almacena la lista de mascotas del cliente, incluyendo sus citas.
   */
  public pets: Pet[] = [];

  /**
   * @method ngOnInit
   * @description
   * Ciclo de vida de Angular. Al iniciar el componente, obtiene el email del usuario,
   * busca sus datos, luego obtiene sus mascotas y, para cada mascota, carga sus citas
   * y las adjunta al objeto de la mascota correspondiente.
   * @returns {void}
   */
  ngOnInit(): void {
    const email = this.userInfoService.getToken();

    if (email) {
      this.authService.getUserPerEmail(email)
        .subscribe(response => {
          const user: Client = response[0];

          this.petService.getPetByOwner(user.id!)
            .subscribe(pets => {
              this.pets = pets;

              // Después de obtener las mascotas, se cargan sus citas correspondientes.
              this.pets.forEach(pet => {
                this.appoinmentService.getAppoinmentByPet(pet.pk!)
                  .subscribe(appoinments => {
                    // Se asignan las citas encontradas a la propiedad 'appoinments' de la mascota.
                    pet.appoinments = appoinments;
                  });
              });
            });
        });
    }
  }

  /**
   * @method formatWeight
   * @description
   * Formatea un valor numérico de peso para mostrarlo en kilogramos (kg) o gramos (g).
   * Si el peso es 1 o más, lo muestra en kg. Si es menor a 1, lo convierte a gramos.
   * @param {number} weight - El peso de la mascota en kilogramos.
   * @returns {string} El peso formateado con su unidad (ej. "10.5 kg" o "500 g").
   */
  public formatWeight( weight: number ): string {
    if ( weight >= 1 ) {
      return weight + ' kg';
    } else {
      return (weight * 1000) + ' g';
    }
  }
}
