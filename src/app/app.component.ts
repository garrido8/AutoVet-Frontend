import { AfterViewInit, Component, inject, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { StyleService } from './services/style.service';
import { UserInfoService } from './services/user-info.service';

/**
 * @class AppComponent
 * @description
 * Componente raíz de la aplicación. Es el componente principal que se carga al inicio.
 * Su principal responsabilidad es gestionar el estado global de la aplicación,
 * como el estado de inicio de sesión del usuario y la visibilidad del encabezado (header),
 * suscribiéndose a los servicios correspondientes.
 */
@Component( {
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
} )
export class AppComponent implements OnInit, AfterViewInit {

  // --- Propiedades Públicas ---

  /**
   * @property {string} title
   * @description Título de la aplicación.
   */
  title = 'vetManagement';

  /**
   * @property {boolean} isLoggedIn
   * @description Indica si el usuario ha iniciado sesión. Controla la visualización
   * de componentes como el Header.
   */
  public isLoggedIn: boolean = false;

  /**
   * @property {boolean} headerOff
   * @description Controla si el encabezado debe ocultarse. Útil para páginas
   * como login o register que no deben mostrar la barra de navegación principal.
   */
  public headerOff: boolean = false;

  // --- Inyección de Dependencias ---

  /**
   * @private
   * @property {AuthService} authService
   * @description Servicio para gestionar el estado de autenticación.
   */
  private authService = inject( AuthService );

  /**
   * @private
   * @property {StyleService} styleService
   * @description Servicio para controlar estilos globales, como la visibilidad del header.
   */
  private styleService = inject( StyleService );

  /**
   * @private
   * @property {UserInfoService} userInfoService
   * @description Servicio para gestionar la información del usuario (no se usa directamente aquí pero está disponible).
   */
  private userInfoService = inject( UserInfoService );

  /**
   * @method ngOnInit
   * @description
   * Ciclo de vida de Angular. Se suscribe a los observables de `authService` y `styleService`
   * para reaccionar a los cambios en el estado de login y la visibilidad del header en tiempo real.
   * @returns {void}
   */
  ngOnInit(): void {
    this.authService.getIsLoggedIn()
      .subscribe( ( isLoggedIn: boolean ) => {
        this.isLoggedIn = isLoggedIn;
      } );

    this.styleService.getHeaderOff()
      .subscribe( ( headerOff: boolean ) => {
        this.headerOff = headerOff;
      }
      );
  }

  /**
   * @method ngAfterViewInit
   * @description
   * Ciclo de vida de Angular. Se ejecuta después de que la vista del componente ha sido inicializada.
   * Se utiliza para establecer el estado inicial de `isLoggedIn` a partir del localStorage,
   * asegurando que el estado persista tras recargar la página.
   * @returns {void}
   */
  ngAfterViewInit(): void {
    this.isLoggedIn = localStorage.getItem( 'isLoggedIn' ) === 'true';
  }

}
