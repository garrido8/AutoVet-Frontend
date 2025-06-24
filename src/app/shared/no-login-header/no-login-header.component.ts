import { Component, OnInit, OnDestroy, inject, ElementRef } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * @class NoLoginHeaderComponent
 * @description
 * Componente que representa el encabezado de la aplicación para usuarios no autenticados.
 * Gestiona un menú de navegación a pantalla completa para dispositivos móviles,
 * incluyendo la lógica para abrirlo, cerrarlo y detectar clics fuera de él.
 */
@Component({
  selector: 'no-login-header',
  standalone: false,
  templateUrl: './no-login-header.component.html',
  styleUrl: './no-login-header.component.css'
})
export class NoLoginHeaderComponent implements OnInit, OnDestroy {
  // --- Inyección de Dependencias ---
  /**
   * @private
   * @property {Document} document
   * @description Proporciona acceso al DOM del documento para manipular estilos globales (ej. body) y añadir listeners.
   */
  private document = inject(DOCUMENT);

  /**
   * @private
   * @property {ElementRef} elementRef
   * @description Referencia al elemento anfitrión del componente, usada para detectar clics dentro de él.
   */
  private elementRef = inject(ElementRef);

  // --- Propiedades Públicas ---
  /**
   * @property {boolean} showingFullscreenMenu
   * @description Controla la visibilidad del menú modal a pantalla completa en la vista móvil.
   */
  public showingFullscreenMenu: boolean = false;

  // --- Propiedades Privadas ---
  /**
   * @private
   * @property {((event: MouseEvent) => void) | undefined} clickOutsideListener
   * @description Almacena la función del listener para detectar clics fuera del menú.
   */
  private clickOutsideListener?: (event: MouseEvent) => void;

  /**
   * @method ngOnInit
   * @description
   * Ciclo de vida de Angular. Define y añade un event listener al documento para
   * cerrar el menú a pantalla completa si el usuario hace clic fuera de él.
   * @returns {void}
   */
  ngOnInit(): void {
    this.clickOutsideListener = (event: MouseEvent) => {
      const target = event.target as Node;
      const fullscreenMenuContent = this.elementRef.nativeElement.querySelector('.fullscreen-menu-content');
      const hamburgerToggleButton = this.elementRef.nativeElement.querySelector('.menu-toggle');

      // Si el menú está abierto y el clic es fuera del contenido del menú y fuera del botón que lo abre.
      if (this.showingFullscreenMenu && fullscreenMenuContent && !fullscreenMenuContent.contains(target) && hamburgerToggleButton && !hamburgerToggleButton.contains(target)) {
        this.closeFullscreenMenu();
      }
    };
    this.document.addEventListener('mousedown', this.clickOutsideListener);
  }

  /**
   * @method ngOnDestroy
   * @description
   * Ciclo de vida de Angular. Elimina el event listener para evitar fugas de memoria y
   * se asegura de que el scroll del body se restaure si el componente se destruye.
   * @returns {void}
   */
  ngOnDestroy(): void {
    if (this.clickOutsideListener) {
      this.document.removeEventListener('mousedown', this.clickOutsideListener);
    }
    this.document.body.style.overflow = '';
  }

  /**
   * @method toggleFullscreenMenu
   * @description
   * Muestra u oculta el menú a pantalla completa. Bloquea o restaura el scroll
   * del body para mejorar la experiencia de usuario.
   * @returns {void}
   */
  public toggleFullscreenMenu(): void {
    this.showingFullscreenMenu = !this.showingFullscreenMenu;
    if (this.showingFullscreenMenu) {
      this.document.body.style.overflow = 'hidden'; // Previene el scroll cuando el menú está abierto.
    } else {
      this.document.body.style.overflow = ''; // Restaura el scroll.
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
