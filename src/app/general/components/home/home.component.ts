import { Component } from '@angular/core';

/**
 * @class HomeComponent
 * @description
 * Componente que representa la página de inicio de la aplicación.
 * Actualmente, es un componente puramente presentacional, sin lógica de negocio,
 * cuya única responsabilidad es mostrar la plantilla HTML asociada.
 */
@Component({
  selector: 'app-home',
  standalone: false, // Asumiendo que se declara en un módulo
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

}
