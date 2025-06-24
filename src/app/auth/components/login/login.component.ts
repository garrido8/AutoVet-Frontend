import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { StyleService } from '../../../services/style.service';
import { UserInfoService } from '../../../services/user-info.service';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import * as CryptoJS from 'crypto-js';

/**
 * @class LoginComponent
 * @description
 * Componente encargado de gestionar el formulario de inicio de sesión.
 * Diferencia entre usuarios clientes y personal de la clínica, maneja la validación
 * del formulario, la comunicación con el servicio de autenticación y la redirección
 * del usuario tras un login exitoso.
 */
@Component( {
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule
  ]
} )
export class LoginComponent implements OnInit, OnDestroy {

  // --- Inyección de Dependencias ---

  /**
   * @private
   * @property {FormBuilder} fb
   * @description Servicio de Angular para construir formularios reactivos.
   */
  private fb = inject( FormBuilder );

  /**
   * @private
   * @property {AuthService} authService
   * @description Servicio para gestionar la autenticación de usuarios.
   */
  private authService = inject( AuthService );

  /**
   * @private
   * @property {StyleService} styleService
   * @description Servicio para controlar estilos globales, como la visibilidad del encabezado.
   */
  private styleService = inject( StyleService );

  /**
   * @private
   * @property {UserInfoService} userInfoService
   * @description Servicio para almacenar y compartir información del usuario logueado.
   */
  private userInfoService = inject( UserInfoService );

  /**
   * @private
   * @property {Router} router
   * @description Servicio de Angular para gestionar la navegación entre rutas.
   */
  private router = inject( Router );

  // --- Propiedades Públicas del Componente ---

  /**
   * @property {boolean} showError
   * @description Flag para controlar la visibilidad del mensaje de error en la plantilla.
   */
  public showError: boolean = false;

  /**
   * @property {string} errorMsg
   * @description Almacena el mensaje de error específico que se mostrará al usuario.
   */
  public errorMsg: string = '';

  /**
   * @property {FormGroup} form
   * @description Define el grupo de formulario reactivo con sus campos y validadores.
   */
  public form = this.fb.group( {
    email: [ '', [ Validators.required, Validators.email ] ],
    password: [ '', Validators.required ]
  } );

  // --- Propiedades Privadas del Componente ---

  /**
   * @private
   * @property {Subscription} subscriptions
   * @description Contenedor para todas las suscripciones de RxJS, para anularlas al destruir el componente.
   */
  private subscriptions = new Subscription();

  /**
   * @method ngOnInit
   * @description
   * Ciclo de vida de Angular. Se ejecuta al iniciar el componente.
   * Oculta el encabezado de la página a través del `styleService`.
   * @returns {void}
   */
  ngOnInit(): void {
    this.styleService.setHeaderOff( true );
  }

  /**
   * @method ngOnDestroy
   * @description
   * Ciclo de vida de Angular. Se ejecuta al destruir el componente.
   * Vuelve a mostrar el encabezado y anula todas las suscripciones para evitar fugas de memoria.
   * @returns {void}
   */
  ngOnDestroy(): void {
    this.styleService.setHeaderOff( false );
    this.subscriptions.unsubscribe();
  }

  /**
   * @method logIn
   * @description
   * Gestiona el proceso de inicio de sesión cuando el usuario envía el formulario.
   * Valida el formulario, determina si el usuario es un cliente o personal,
   * hashea la contraseña y la compara con la almacenada.
   * En caso de éxito, establece el estado de login y redirige. En caso de error, muestra un mensaje.
   * @returns {void}
   */
  public logIn(): void {
    if ( this.form.valid ) {
      const email = this.form.value.email!;
      const password = this.form.value.password!;

      // Determina si es un cliente (contiene 'correo') o personal
      if ( email.includes( 'correo' ) ) {
        const getUser = this.authService.getUserPerEmail( email ).subscribe(
          response => {
            if ( response.length > 0 ) {
              const user = response[ 0 ];

                // Para clientes normales, se compara el hash de la contraseña.
                const hashedPassword = CryptoJS.SHA256( password ).toString();
                if ( hashedPassword === user.password ) {
                  this.handleSuccessfulLogin( user.email, true, false, user );
                } else {
                  this.setErrorMessage( 'El correo o la contraseña son incorrectos' );
                }

            } else {
              this.setErrorMessage( 'No existe ningún usuario con este correo' );
            }
          } );
        this.subscriptions.add( getUser );

      } else { // Lógica para el personal de la clínica
        const getStaff = this.authService.getStaffPerEmail( email ).subscribe(
          response => {
            if ( response.length > 0 ) {
              const staffMember = response[ 0 ];
              // Para usuarios admin, se compara la contraseña en texto plano.
              if ( email.includes( 'admin' ) ) {
                if ( password === staffMember.password ) {
                  this.handleSuccessfulLogin( staffMember.email, false, true, staffMember );
                } else {
                  this.setErrorMessage( 'El correo o la contraseña son incorrectos' );
                }
              } else {
                const hashedPassword = CryptoJS.SHA256( password ).toString();

                // Se compara el hash de la contraseña para todo el personal.
                if ( hashedPassword === staffMember.password ) {
                  this.handleSuccessfulLogin( staffMember.email, false, false, staffMember );
                } else {
                  this.setErrorMessage( 'El correo o la contraseña son incorrectos' );
                }
              }
            } else {
              this.setErrorMessage( 'No existe ningún usuario con este correo' );
            }
          } );
        this.subscriptions.add( getStaff );
      }
    } else {
      this.form.markAllAsTouched(); // Muestra errores de validación si el formulario es inválido.
    }
  }

  /**
   * @private
   * @method handleSuccessfulLogin
   * @description
   * Centraliza las acciones a realizar tras un inicio de sesión exitoso.
   * @param {string} email - El email del usuario.
   * @param {boolean} isClient - Indica si el usuario es un cliente.
   * @param {boolean} isAdmin - Indica si el usuario es administrador.
   * @param {any} fullToken - El objeto completo del usuario/personal para almacenar en el servicio.
   * @returns {void}
   */
  private handleSuccessfulLogin( email: string, isClient: boolean, isAdmin: boolean, fullToken: any ): void {
    console.log( 'Login exitoso! 🎉' );
    this.authService.setIsLoggedIn( true );
    this.userInfoService.setToken( email );
    localStorage.setItem( 'isClient', String( isClient ) );
    localStorage.setItem( 'isAdmin', String( isAdmin ) );

    if ( isClient && fullToken ) {
      this.userInfoService.setFullClientToken( fullToken );
    } else if ( !isClient && fullToken ) {
      this.userInfoService.setFullStaffToken( fullToken );
    }

    this.router.navigate( [ '/home' ] );
  }

  /**
   * @method setErrorMessage
   * @description
   * Muestra un mensaje de error en la interfaz de usuario.
   * @param {string} message - El mensaje de error a mostrar.
   * @returns {void}
   */
  public setErrorMessage( message: string ): void {
    this.showError = true;
    this.errorMsg = message;
  }
}
