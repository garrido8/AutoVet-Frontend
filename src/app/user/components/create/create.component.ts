import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { UserInfoService } from '../../../services/user-info.service';
import { AuthService } from '../../../services/auth.service';
import { Client } from '../../../interfaces/client.interface';
import { PetService } from '../../../services/pet.service';
import { Pet } from '../../../interfaces/pet.interface';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../../services/gemini.service';
import { Appoinment } from '../../../interfaces/appoinment.interface';
import { AppoinmentService } from '../../../services/appoinment.service';

/**
 * @class CreateComponent
 * @description
 * Este componente permite a los clientes (usuarios) crear una nueva cita para una de sus mascotas.
 * Utiliza un servicio de IA (GeminiService) para generar automáticamente un título y una descripción
 * profesional del problema a partir de la información de la mascota y el texto introducido por el usuario.
 */
@Component( {
  selector: 'app-create',
  standalone: true,
  templateUrl: './create.component.html',
  styleUrl: './create.component.css',
  imports: [
    CommonModule,
    FormsModule
  ]
} )
export class CreateComponent implements OnInit {

  // --- Inyección de Dependencias ---

  /**
   * @private
   * @property {UserInfoService} userInfoService
   * @description Servicio para obtener información del token del usuario logueado.
   */
  private userInfoService = inject( UserInfoService );

  /**
   * @private
   * @property {AuthService} authService
   * @description Servicio para obtener datos del usuario a partir de su email.
   */
  private authService = inject( AuthService );

  /**
   * @private
   * @property {PetService} petService
   * @description Servicio para obtener las mascotas asociadas a un propietario.
   */
  private petService = inject( PetService );

  /**
   * @private
   * @property {GeminiService} geminiService
   * @description Servicio que interactúa con la API de Gemini para generar contenido de IA.
   */
  private geminiService = inject( GeminiService );

  /**
   * @private
   * @property {AppoinmentService} appoinmentService
   * @description Servicio para crear nuevas citas en el sistema.
   */
  private appoinmentService = inject( AppoinmentService );

  // --- Propiedades Públicas del Componente ---

  /**
   * @property {Pet[]} pets
   * @description Array que almacena la lista de mascotas del usuario logueado.
   */
  public pets: Pet[] = [];

  /**
   * @property {Pet | undefined} selectedPet
   * @description Almacena la mascota que el usuario ha seleccionado del desplegable para crear la cita.
   */
  public selectedPet?: Pet;

  /**
   * @property {boolean} isLoading
   * @description Un flag booleano para controlar la visualización de un indicador de carga
   * mientras se espera la respuesta del servicio de IA.
   */
  public isLoading: boolean = false;

  /**
   * @property {boolean} exit
   * @description Un flag booleano que se activa cuando la cita se ha creado con éxito.
   * Puede usarse para mostrar un mensaje de confirmación o cerrar un modal.
   */
  public exit: boolean = false;

  /**
   * @property {ElementRef | undefined} problemTxt
   * @description Referencia al elemento textarea del DOM donde el usuario describe el problema.
   */
  @ViewChild( 'problemTxt' ) problemTxt?: ElementRef;

  /**
   * @property {string} problemTxtValue
   * @description Vinculado con ngModel al textarea, almacena el texto del problema descrito por el usuario.
   */
  public problemTxtValue: string = '';

  /**
   * @method ngOnInit
   * @description
   * Ciclo de vida de Angular que se ejecuta al iniciar el componente.
   * Obtiene el token del usuario, busca su perfil y carga la lista de sus mascotas.
   * @returns {void}
   */
  ngOnInit(): void {
    const token = this.userInfoService.getToken();

    if ( token ) {
      this.authService.getUserPerEmail( token )
        .subscribe( response => {
          const user: Client = response[ 0 ];

          this.petService.getPetByOwner( user.id! )
            .subscribe( response => {
              this.pets = response;
            } );
        } );
    }
  }

  /**
   * @method createAppoinment
   * @description
   * Inicia el proceso de creación de una cita. Construye un prompt con los datos de la mascota
   * y el problema, lo envía al servicio de IA para generar un título y una descripción,
   * y finalmente guarda la nueva cita en la base de datos.
   * @returns {void}
   */
  public createAppoinment() {
    // Objeto base de la cita
    const appoinment: Appoinment = {
      mascota: this.selectedPet!.pk!,
      titulo: '',
      descripcion: '',
      estado: 'pendiente',
      urgencia: false,
    };

    if ( this.problemTxtValue.length > 0 && this.selectedPet ) {
      this.isLoading = true;

      // Construcción del prompt para la IA
      const prompt = 'Mi mascota es un ' + this.selectedPet?.especie +
        ' ,de raza ' + this.selectedPet?.raza +
        ' ,se llama ' + this.selectedPet?.nombre +
        ' ,tiene ' + this.selectedPet?.edad + ' años. ' +
        ' y pesa ' + this.selectedPet?.peso + ' kg. ' +
        '. ' + this.problemTxtValue;

      // Llamada a la IA para generar el título
      this.geminiService.generateName( prompt )
        .subscribe( title => {

          // Llamada anidada a la IA para generar la descripción
          this.geminiService.generateProffesionalSummary( prompt )
            .subscribe( description => {
              this.isLoading = false;
              appoinment.titulo = title;
              appoinment.descripcion = description;

              // Añadir la cita al sistema
              this.appoinmentService.addAppoinment( appoinment )
                .subscribe( response => {
                  this.exit = true; // Indicar éxito
                  // Resetear el formulario
                  this.problemTxtValue = '';
                  this.selectedPet = undefined;
                }
                );
            } );
        } );
    }
  }
}
