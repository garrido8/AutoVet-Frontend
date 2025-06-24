import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { StyleService } from '../../../services/style.service';
import { UserInfoService } from '../../../services/user-info.service';
import { Client } from '../../../interfaces/client.interface';
import { dniValidator, passwordRegEx } from '../../../../environments/format-settings';
import * as CryptoJS from 'crypto-js';
import { Subscription } from 'rxjs';

/**
 * @class RegisterComponent
 * @description
 * Componente para el registro de nuevos clientes. Contiene un formulario reactivo
 * con validaciones personalizadas para DNI y contraseña. Se encarga de hashear la contraseña
 * y enviar los datos al servicio de autenticación para crear el nuevo usuario.
 */
@Component( {
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule
  ]
} )
export class RegisterComponent implements OnInit, OnDestroy {

  // --- Inyección de Dependencias ---

  /**
   * @private
   * @property {FormBuilder} fb
   * @description Servicio de Angular para construir formularios reactivos de forma sencilla.
   */
  private fb = inject( FormBuilder );

  /**
   * @private
   * @property {AuthService} authService
   * @description Servicio para gestionar la autenticación y el registro de usuarios.
   */
  private authService = inject( AuthService );

  /**
   * @private
   * @property {StyleService} styleService
   * @description Servicio para manipular estilos globales de la aplicación, como el encabezado.
   */
  private styleService = inject( StyleService );

  /**
   * @private
   * @property {Router} router
   * @description Servicio de Angular para la navegación entre las vistas de la aplicación.
   */
  private router = inject( Router );

  // --- Propiedades Públicas del Componente ---

  /**
   * @property {boolean} badMail
   * @description Flag que indica si el correo electrónico introducido no es válido (contiene 'autovet').
   */
  public badMail: boolean = false;

  /**
   * @property {boolean} alreadyExists
   * @description Flag que indica si el correo electrónico introducido ya está registrado en el sistema.
   */
  public alreadyExists: boolean = false;

  /**
   * @property {FormGroup} form
   * @description Define el formulario de registro con sus campos y validaciones, incluyendo
   * validadores personalizados para el DNI y una expresión regular para la contraseña.
   */
  public form = this.fb.group( {
    name: [ '', Validators.required ],
    email: [ '', [ Validators.required, Validators.email ] ],
    password: [ '', [ Validators.required, Validators.pattern( passwordRegEx ) ] ],
    dni: [ '', [ Validators.required, dniValidator() ] ],
    phone: [ '', [ Validators.required, Validators.minLength( 7 ), Validators.maxLength( 15 ) ] ],
  } );

  // --- Propiedades Privadas del Componente ---
  /**
   * @private
   * @property {Subscription} subscriptions
   * @description Contenedor para las suscripciones de RxJS.
   */
  private subscriptions = new Subscription();


  /**
   * @method ngOnInit
   * @description
   * Ciclo de vida de Angular. Se ejecuta al iniciar el componente.
   * Utiliza el `styleService` para ocultar el encabezado en la página de registro.
   * @returns {void}
   */
  ngOnInit(): void {
    this.styleService.setHeaderOff( true );
  }

  /**
   * @method ngOnDestroy
   * @description
   * Ciclo de vida de Angular. Se ejecuta al destruir el componente.
   * Restaura la visibilidad del encabezado y anula las suscripciones.
   * @returns {void}
   */
  ngOnDestroy(): void {
    this.styleService.setHeaderOff( false );
    this.subscriptions.unsubscribe();
  }

  /**
   * @method createUser
   * @description
   * Procesa el envío del formulario de registro. Si el formulario es válido,
   * comprueba que el email no esté prohibido y no exista previamente.
   * Si todo es correcto, hashea la contraseña, crea un nuevo objeto `Client`
   * y lo envía al `authService` para ser guardado.
   * @returns {void}
   */
  public createUser(): void {
    if ( this.form.valid ) {
      const email = this.form.value.email!;

      // Validación para no permitir correos de un dominio específico
      if ( email.includes( 'autovet' ) ) {
        this.badMail = true;
        return;
      }

      const sub = this.authService.getUserPerEmail( email )
        .subscribe( response => {
          if ( response.length !== 0 ) {
            this.alreadyExists = true;
          } else {
            this.alreadyExists = false;

            // Si el usuario no existe, procede con la creación
            const newClient: Client = {
              name: this.form.value.name!,
              email: email,
              password: CryptoJS.SHA256( this.form.value.password! ).toString(), // Hasheo de la contraseña
              dni: this.form.value.dni!,
              phone: this.form.value.phone!
            };

            const subCreate = this.authService.addUser( newClient ).subscribe( {
              next: () => {
                this.form.reset();
                this.router.navigate( [ '/auth/login' ] ); // Redirige al login tras el éxito
              },
              error: ( err ) => {
                console.error( 'Error al crear usuario:', err );
              }
            } );
            this.subscriptions.add( subCreate );
          }
        } );

      this.subscriptions.add( sub );

    } else {
      console.log( 'Formulario inválido 😬' );
      this.form.markAllAsTouched(); // Muestra los errores de validación en los campos
    }
  }
}
