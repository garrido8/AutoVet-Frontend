import { Component, ElementRef, inject, OnDestroy, OnInit } from '@angular/core';
import { UserInfoService } from '../../services/user-info.service';
import { Client } from '../../interfaces/client.interface';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';

/**
 * @class HeaderComponent
 * @description
 * Gestiona la barra de navegación superior de la aplicación. Es responsable de mostrar
 * los enlaces de navegación, el menú de perfil de usuario para escritorio, un menú
 * a pantalla completa para dispositivos móviles, y la funcionalidad de cierre de sesión.
 * También adapta su contenido según si el usuario es un cliente o un administrador.
 */
@Component( {
  selector: 'header-component',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
} )
export class HeaderComponent implements OnInit, OnDestroy {
  // --- Inyección de Dependencias ---

  /**
   * @private
   * @property {UserInfoService} userInfo
   * @description Servicio para gestionar la información del usuario logueado.
   */
  private userInfo = inject( UserInfoService );

  /**
   * @private
   * @property {AuthService} authService
   * @description Servicio para gestionar el estado de autenticación y el cierre de sesión.
   */
  private authService = inject( AuthService );

  /**
   * @private
   * @property {Router} router
   * @description Servicio de Angular para la navegación entre rutas.
   */
  private router = inject( Router );

  /**
   * @private
   * @property {Document} document
   * @description Proporciona acceso directo al DOM del documento, usado para añadir listeners globales.
   */
  private document = inject( DOCUMENT );

  /**
   * @private
   * @property {ElementRef} elementRef
   * @description Referencia al elemento anfitrión del componente, usado para detectar clics internos.
   */
  constructor( private elementRef: ElementRef ) {}

  // --- Propiedades Públicas ---

  /**
   * @property {boolean} showingProfileMenu
   * @description Controla la visibilidad del menú desplegable del perfil en la vista de escritorio.
   */
  public showingProfileMenu: boolean = false;

  /**
   * @property {boolean} showingFullscreenMenu
   * @description Controla la visibilidad del menú modal a pantalla completa en la vista móvil.
   */
  public showingFullscreenMenu: boolean = false;

  /**
   * @property {boolean} isClient
   * @description Determina si el usuario logueado es un cliente, para mostrar enlaces específicos.
   */
  public isClient: boolean = localStorage.getItem( 'isClient' ) === 'true' ? true : false;

  /**
   * @property {boolean} isAdmin
   * @description Determina si el usuario logueado es administrador, para mostrar enlaces específicos.
   */
  public isAdmin: boolean = localStorage.getItem( 'isAdmin' ) === 'true' ? true : false;


  // --- Propiedades Privadas ---

  /**
   * @private
   * @property {((event: MouseEvent) => void) | undefined} clickOutsideListener
   * @description Almacena la función listener para detectar clics fuera de los menús y poder cerrarlos.
   */
  private clickOutsideListener?: ( event: MouseEvent ) => void;

  /**
   * @method ngOnInit
   * @description
   * Ciclo de vida de Angular. Se ejecuta al iniciar el componente.
   * Define y añade un event listener al documento para detectar clics fuera de los menús abiertos
   * y cerrarlos automáticamente.
   * @returns {void}
   */
  ngOnInit(): void {
    this.clickOutsideListener = ( event: MouseEvent ) => {
      const target = event.target as Node;

      // Cierra el menú de perfil si se hace clic fuera
      if ( this.showingProfileMenu ) {
        const profileMenuElement = this.elementRef.nativeElement.querySelector( '.profile-dropdown-menu' );
        const profileToggleButton = this.elementRef.nativeElement.querySelector( '#logout-btn' );

        if ( profileMenuElement && !profileMenuElement.contains( target ) && profileToggleButton && !profileToggleButton.contains( target ) ) {
          this.closeProfileMenu();
        }
      }

      // Cierra el menú de pantalla completa si se hace clic fuera de su contenido
      if ( this.showingFullscreenMenu ) {
        const fullscreenMenuContent = this.elementRef.nativeElement.querySelector( '.fullscreen-menu-content' );
        const hamburgerToggleButton = this.elementRef.nativeElement.querySelector( '.menu-toggle' );

        if ( fullscreenMenuContent && !fullscreenMenuContent.contains( target ) && hamburgerToggleButton && !hamburgerToggleButton.contains( target ) ) {
          this.closeFullscreenMenu();
        }
      }
    };
    this.document.addEventListener( 'mousedown', this.clickOutsideListener );
  }

  /**
   * @method ngOnDestroy
   * @description
   * Ciclo de vida de Angular. Se ejecuta al destruir el componente.
   * Elimina el event listener del documento para prevenir fugas de memoria.
   * @returns {void}
   */
  ngOnDestroy(): void {
    if ( this.clickOutsideListener ) {
      this.document.removeEventListener( 'mousedown', this.clickOutsideListener );
    }
  }

  /**
   * @method logOut
   * @description
   * Cierra la sesión del usuario. Limpia la información del usuario en los servicios
   * y el localStorage, y redirige a la página de inicio.
   * @returns {void}
   */
  public logOut(): void {
    this.userInfo.setUserInfo( {} as Client );
    this.authService.logout();
    localStorage.removeItem( 'isClient' );
    localStorage.removeItem( 'isLoggedIn' );
    localStorage.removeItem( 'isAdmin' );
    this.router.navigate( [ '/home' ] );
  }

  /**
   * @method toggleProfileMenu
   * @description
   * Muestra u oculta el menú desplegable del perfil en la vista de escritorio.
   * Se asegura de que el menú móvil esté cerrado si se abre este.
   * @returns {void}
   */
  public toggleProfileMenu(): void {
    this.showingProfileMenu = !this.showingProfileMenu;
    if ( this.showingProfileMenu && this.showingFullscreenMenu ) {
      this.closeFullscreenMenu();
    }
  }

  /**
   * @method closeProfileMenu
   * @description Cierra explícitamente el menú desplegable del perfil.
   * @returns {void}
   */
  public closeProfileMenu(): void {
    this.showingProfileMenu = false;
  }

  /**
   * @method toggleFullscreenMenu
   * @description
   * Muestra u oculta el menú a pantalla completa para móviles.
   * Bloquea el scroll del body cuando el menú está abierto para mejorar la experiencia de usuario.
   * @returns {void}
   */
  public toggleFullscreenMenu(): void {
    this.showingFullscreenMenu = !this.showingFullscreenMenu;
    if ( this.showingFullscreenMenu ) {
      this.document.body.style.overflow = 'hidden';
      if ( this.showingProfileMenu ) {
        this.closeProfileMenu();
      }
    } else {
      this.document.body.style.overflow = '';
    }
  }

  /**
   * @method closeFullscreenMenu
   * @description
   * Cierra explícitamente el menú a pantalla completa y restaura el scroll del body.
   * @returns {void}
   */
  public closeFullscreenMenu(): void {
    this.showingFullscreenMenu = false;
    this.document.body.style.overflow = '';
  }
}
