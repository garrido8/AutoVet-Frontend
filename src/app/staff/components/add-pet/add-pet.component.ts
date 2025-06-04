import { Component, inject, OnDestroy } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs'; // Importamos Subscription aquí para claridad

import { UserInfoService } from '../../../services/user-info.service';
import { PetService } from '../../../services/pet.service';
import { Pet } from '../../../interfaces/pet.interface'; // Asegúrate de que esta interfaz está correctamente definida

/**
 * @class AddPetComponent
 * @description Componente para añadir una nueva mascota. Permite al usuario introducir los detalles de una mascota
 * a través de un formulario reactivo y enviarlos a la base de datos.
 */
@Component({
  selector: 'app-add-pet',
  standalone: true,
  templateUrl: './add-pet.component.html',
  styleUrl: './add-pet.component.css',
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule // FormsModule se utiliza para el two-way data binding, aunque principalmente uses ReactiveFormsModule.
  ]
})
export class AddPetComponent implements OnDestroy {

  /**
   * @private
   * @property {UserInfoService} userInfoService - Servicio inyectado para gestionar la información del usuario, como el ID del propietario.
   */
  private userInfoService = inject( UserInfoService );

  /**
   * @private
   * @property {PetService} petService - Servicio inyectado para interactuar con la API de mascotas.
   */
  private petService = inject( PetService );

  /**
   * @private
   * @property {Subscription} subscriptions - Objeto para gestionar todas las suscripciones de RxJS y desuscribirse en `ngOnDestroy`.
   */
  private subscriptions = new Subscription();

  /**
   * @private
   * @property {FormBuilder} fb - Servicio inyectado de Angular para facilitar la creación de formularios reactivos.
   */
  private fb = inject( FormBuilder );

  /**
   * @public
   * @property {boolean} exit - Bandera que indica si se debe salir o navegar después de una operación exitosa.
   * Se establece a `true` cuando la mascota se añade correctamente.
   */
  public exit: boolean = false;

  /**
   * @public
   * @property {FormGroup} form - El formulario reactivo para la entrada de datos de la mascota.
   * Define los controles del formulario y sus validadores.
   */
  public form = this.fb.group( {
    /**
     * @property {FormControl<string>} nombre - Nombre de la mascota. Requerido.
     */
    nombre: ['', Validators.required ],
    /**
     * @property {FormControl<string>} especie - Especie de la mascota (ej. "perro", "gato"). Requerido.
     */
    especie: ['', Validators.required],
    /**
     * @property {FormControl<string>} raza - Raza de la mascota. Requerido.
     */
    raza: ['', Validators.required],
    /**
     * @property {FormControl<number>} edad - Edad de la mascota en años. Requerido.
     */
    edad: [0, Validators.required],
    /**
     * @property {FormControl<string>} sexo - Sexo de la mascota (ej. "Macho", "Hembra"). Requerido.
     */
    sexo: ['', Validators.required],
    /**
     * @property {FormControl<number>} peso - Peso de la mascota en kilogramos. Requerido.
     */
    peso: [0.0, Validators.required],
    /**
     * @property {FormControl<boolean>} vacunado - Estado de vacunación de la mascota. Requerido.
     */
    vacunado: [false, Validators.required],
    /**
     * @property {FormControl<boolean>} esterilizado - Estado de esterilización de la mascota. Requerido.
     */
    esterilizado: [false, Validators.required],
  } );

  /**
   * @method ngOnDestroy
   * @description Hook del ciclo de vida que se ejecuta cuando el componente se destruye.
   * Se utiliza para desuscribir todas las suscripciones de RxJS para prevenir fugas de memoria
   * y para eliminar el ID de usuario almacenado.
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.userInfoService.removeUserId();
  }

  /**
   * @public
   * @method addPet
   * @description Maneja la lógica para añadir una nueva mascota.
   * Valida el formulario, construye el objeto `Pet` con los datos introducidos
   * y llama al servicio `PetService` para guardar la mascota.
   * Tras un éxito, resetea el formulario y establece la bandera `exit` a `true`.
   */
  public addPet(): void {
    if ( this.form.valid ) {
      // Construye el objeto Pet a partir de los valores del formulario
      const pet: Pet = {
        nombre: this.form.value.nombre!,
        especie: this.form.value.especie!,
        raza: this.form.value.raza!,
        edad: this.form.value.edad!,
        // Asegúrate de que el sexo se guarda en minúsculas si el backend lo requiere
        sexo: this.form.value.sexo!.toLowerCase(),
        peso: this.form.value.peso!,
        // Convierte los valores booleanos explícitamente a true/false
        vacunado: this.form.value.vacunado! ? true : false,
        esterilizado: this.form.value.esterilizado! ? true : false,
        // Obtiene el ID del propietario desde UserInfoService
        propietario: this.userInfoService.getUserId()!,
        // Asumiendo que 'appointments' no se establece aquí en la creación inicial o es opcional
        // Si el backend espera 'appointments' o tiene un valor por defecto, podría no ser necesario aquí.
        // Si es requerido y vacío, sería: appointments: []
      };

      console.log(pet); // Para depuración

      // Envía la nueva mascota al servicio y gestiona la suscripción
      const addPetSub = this.petService.addPet(pet)
        .subscribe( response => {
          if ( response ) {
            this.exit = true; // Indica que la operación fue exitosa
            this.form.reset(); // Resetea el formulario después de un envío exitoso
          }
        } );

      this.subscriptions.add( addPetSub ); // Añade la suscripción para desuscripción en ngOnDestroy
    } else {
      // Opcional: Puedes añadir lógica para mostrar mensajes de error si el formulario no es válido.
      console.warn('El formulario no es válido. Por favor, revisa los campos.');
      // Por ejemplo: this.form.markAllAsTouched(); para mostrar los errores de validación.
    }
  }
}
