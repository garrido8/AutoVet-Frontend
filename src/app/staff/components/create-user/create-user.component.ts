import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Client } from '../../../interfaces/client.interface';
import { Staff } from '../../../interfaces/staff.interface';
import { AuthService } from '../../../services/auth.service';
import { dniValidator, passwordRegEx } from '../../../../environments/format-settings';
import * as CryptoJS from 'crypto-js';

/**
 * @class CreateUserComponent
 * @description
 * Componente para la creación de nuevos usuarios, ya sean clientes o miembros del personal.
 * Reutiliza el mismo formulario y distingue el tipo de usuario a crear basándose en la URL activa.
 */
@Component({
  selector: 'app-create-user',
  standalone: true,
  templateUrl: './create-user.component.html',
  styleUrl: './create-user.component.css',
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule
  ]
})
export class CreateUserComponent implements OnInit, OnDestroy {

  // --- Inyección de Dependencias ---

  /**
   * @private
   * @property {ActivatedRoute} route
   * @description Proporciona acceso a la información de la ruta para determinar el tipo de usuario a crear.
   */
  private route = inject( ActivatedRoute );

  /**
   * @private
   * @property {AuthService} authService
   * @description Servicio para gestionar la creación de nuevos usuarios y trabajadores.
   */
  private authService = inject( AuthService );

  /**
   * @private
   * @property {FormBuilder} fb
   * @description Servicio de Angular para construir formularios reactivos.
   */
  private fb = inject( FormBuilder );

  // --- Propiedades Privadas ---

  /**
   * @private
   * @property {Subscription} subscriptions
   * @description Contenedor para las suscripciones de RxJS, facilitando su anulación.
   */
  private subscriptions = new Subscription();

  // --- Propiedades Públicas ---

  /**
   * @property {boolean} client
   * @description Un flag que indica si el usuario a crear es un cliente (true) o un miembro del personal (false).
   */
  public client = false;

  /**
   * @property {boolean} exit
   * @description Un flag que se activa cuando el usuario se ha creado con éxito, para mostrar un mensaje de confirmación.
   */
  public exit: boolean = false;

  /**
   * @property {FormGroup} form
   * @description Define el formulario reactivo para la creación de usuarios con sus campos y validadores.
   */
  public form = this.fb.group({
        name: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.pattern( passwordRegEx )]],
        dni: ['', [Validators.required, dniValidator()]],
        phone: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(15)]],
      });

  /**
   * @method ngOnInit
   * @description
   * Ciclo de vida de Angular. Se suscribe a los cambios en la URL para determinar si la ruta
   * actual corresponde a la creación de un cliente y actualiza el flag `client`.
   * @returns {void}
   */
  ngOnInit(): void {
    const routeSub = this.route.url
      .subscribe( ( url ) => {
        if ( url[0].path.includes( 'client' ) ) {
          this.client = true;
        }
      } );

    this.subscriptions.add( routeSub );
  }

  /**
   * @method ngOnDestroy
   * @description
   * Ciclo de vida de Angular. Anula todas las suscripciones para prevenir fugas de memoria.
   * @returns {void}
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * @method addUser
   * @description
   * Se ejecuta al enviar el formulario. Si es válido, crea un objeto `Client` o `Staff`
   * dependiendo del valor del flag `client`, hashea la contraseña y llama al servicio
   * correspondiente para añadir el usuario a la base de datos.
   * @returns {void}
   */
  public addUser() {
    if( this.form.valid ) {

      if( this.client ) {
        const client: Client = {
          name: this.form.value.name!,
          email: this.form.value.email!,
          password: CryptoJS.SHA256(this.form.value.password!).toString(),
          dni: this.form.value.dni!,
          phone: this.form.value.phone!
        };

        this.authService.addUser( client )
          .subscribe( ( response ) => {
            this.exit = true;
            this.form.reset();
          } );

      } else {
        const staff: Staff = {
          name: this.form.value.name!,
          email: this.form.value.email!,
          password: CryptoJS.SHA256(this.form.value.password!).toString(),
          dni: this.form.value.dni!,
          phone: this.form.value.phone!,
          role: 'worker',
          assigned_clients: []
        };

        this.authService.addWorker( staff )
          .subscribe( ( response ) => {
            this.exit = true;
            this.form.reset();
          } );
      }
    }
  }
}
