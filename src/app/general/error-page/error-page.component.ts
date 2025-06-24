import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { StyleService } from '../../services/style.service';

/**
 * @class ErrorPageComponent
 * @description
 * Componente que se muestra cuando ocurre un error de navegación o se accede a una ruta no definida.
 * Su principal función es mostrar un mensaje de error y ocultar el encabezado principal
 * de la aplicación mientras esta página esté activa.
 */
@Component({
  selector: 'app-error-page',
  standalone: true,
  templateUrl: './error-page.component.html',
  styleUrl: './error-page.component.css',
  imports: [
    RouterModule
  ]
})
export class ErrorPageComponent implements OnInit, OnDestroy {

  /**
   * @private
   * @property {StyleService} styleService
   * @description Servicio para controlar estilos globales, como la visibilidad del encabezado.
   */
  private styleService = inject( StyleService );

  /**
   * @method ngOnInit
   * @description
   * Ciclo de vida de Angular. Se ejecuta al iniciar el componente.
   * Llama al `styleService` para ocultar el encabezado de la aplicación.
   * @returns {void}
   */
  ngOnInit(): void {
    this.styleService.setHeaderOff(true);
  }

  /**
   * @method ngOnDestroy
   * @description
   * Ciclo de vida de Angular. Se ejecuta al destruir el componente.
   * Llama al `styleService` para volver a mostrar el encabezado cuando el usuario
   * navega fuera de la página de error.
   * @returns {void}
   */
  ngOnDestroy(): void {
    this.styleService.setHeaderOff(false);
  }

}
