import { CommonModule, formatDate, registerLocaleData } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ReassignmentService } from '../../../../services/reassignment.service';
import { Reassignment } from '../../../../interfaces/reassignment.interface';
import { Subscription } from 'rxjs';
import localeEs from '@angular/common/locales/es';
import { FormsModule } from '@angular/forms';
import { UserInfoService } from '../../../../services/user-info.service';
import { Staff } from '../../../../interfaces/staff.interface';

// Registra el locale español para poder formatear fechas correctamente.
registerLocaleData(localeEs, 'es-ES');

/**
 * @class ReassignmentsComponent
 * @description
 * Componente para visualizar y gestionar las solicitudes de reasignación.
 * Los administradores pueden ver todas las solicitudes y cambiar su estado.
 * El personal no administrador solo puede ver las solicitudes que ha realizado.
 */
@Component({
  selector: 'app-reassignments',
  standalone: true,
  templateUrl: './reassignments.component.html',
  styleUrl: './reassignments.component.css',
  imports: [
    CommonModule,
    FormsModule
  ]
})
export class ReassignmentsComponent implements OnInit, OnDestroy {

  // --- Propiedades Privadas ---
  /**
   * @private
   * @property {Subscription} subscriptions
   * @description Contenedor para todas las suscripciones de RxJS.
   */
  private subscriptions = new Subscription();

  // --- Inyección de Dependencias ---
  /**
   * @private
   * @property {ReassignmentService} reassignmentService
   * @description Servicio para gestionar las operaciones CRUD de las reasignaciones.
   */
  private reassignmentService = inject(ReassignmentService);

  /**
   * @private
   * @property {UserInfoService} userInfoService
   * @description Servicio para obtener datos del usuario/personal logueado.
   */
  private userInfoService = inject( UserInfoService );

  // --- Propiedades Públicas ---
  /**
   * @property {Reassignment[]} reassignments
   * @description Array para almacenar todas las reasignaciones (vista de admin).
   */
  public reassignments: Reassignment[] = [];

  /**
   * @property {Reassignment[]} workerReassignments
   * @description Array para almacenar las reasignaciones de un trabajador específico.
   */
  public workerReassignments: Reassignment[] = [];

  /**
   * @property {string[]} availableStatuses
   * @description Lista de estados disponibles para el dropdown de cambio de estado.
   */
  public availableStatuses: string[] = [
    'pending',
    'approved',
    'rejected'
  ];

  /**
   * @property {boolean} isAdmin
   * @description Flag que indica si el usuario actual es un administrador.
   */
  public isAdmin: boolean = localStorage.getItem('isAdmin') === 'true' ? true : false;

  /**
   * @method ngOnInit
   * @description
   * Ciclo de vida de Angular. Carga las reasignaciones según el rol del usuario.
   * Si es admin, carga todas. Si no, carga solo las del usuario logueado.
   * @returns {void}
   */
  ngOnInit(): void {
    const staff: Staff = this.userInfoService.getFullStaffToken()!;

    if( this.isAdmin ) {
      this.subscriptions.add(
        this.reassignmentService.getReassignments()
          .subscribe({
            next: response => this.reassignments = response,
            error: err => console.error('Error fetching reassignments:', err)
          })
      );
    } else {
      if (staff && staff.pk) {
        this.subscriptions.add(
          this.reassignmentService.getReassignmentByUser( staff.pk ).subscribe( response => {
            this.workerReassignments = response;
          })
        );
      }
    }
  }

  /**
   * @method ngOnDestroy
   * @description
   * Ciclo de vida de Angular. Anula todas las suscripciones para evitar fugas de memoria.
   * @returns {void}
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * @method getDate
   * @description
   * Formatea una fecha a un string localizado en español ('dd/MM/yyyy HH:mm').
   * @param {Date | string | undefined} date - La fecha a formatear.
   * @returns {string} La fecha formateada o un string vacío si la fecha es inválida.
   */
  public getDate(date: Date | string | undefined): string {
    if (!date) return '';
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      return formatDate(d, 'dd/MM/yyyy HH:mm', 'es-ES');
    } catch (e) {
      console.error('Error formatting date:', e);
      return '';
    }
  }

  /**
   * @method getDisplayStatus
   * @description
   * Convierte un estado de reasignación del backend a un texto legible para el usuario.
   * @param {string} status - El estado del backend (ej. 'pending').
   * @returns {string} El texto a mostrar (ej. 'Pendiente').
   */
  public getDisplayStatus(status: string): string {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'approved': return 'Aprobada';
      case 'rejected': return 'Rechazada';
      default: return 'Desconocido';
    }
  }

  /**
   * @method getStatusClass
   * @description
   * Genera una clase CSS dinámica basada en el estado para estilizarlo visualmente.
   * @param {string} status - El estado del backend.
   * @returns {string} La clase CSS correspondiente (ej. 'status-pending').
   */
  public getStatusClass(status: string): string {
    return `status-${status}`;
  }

  /**
   * @method onStatusChange
   * @description
   * Maneja el cambio de estado de una reasignación desde el dropdown (solo para admins).
   * Llama al servicio para actualizar el estado en el backend.
   * @param {Reassignment} reassignment - El objeto de reasignación modificado.
   * @param {string} newStatus - El nuevo estado seleccionado.
   * @returns {void}
   */
  public onStatusChange(reassignment: Reassignment, newStatus: string): void {
    if (reassignment.id === undefined) return;

    const updatedReassignment: Partial<Reassignment> = {
      status: newStatus,
      updated_at: new Date()
    };

    this.subscriptions.add(
      this.reassignmentService.editReassignment(reassignment.id, { ...reassignment, ...updatedReassignment } as Reassignment)
        .subscribe({
          next: response => console.log('Reassignment status updated successfully:', response),
          error: err => {
            console.error('Error updating reassignment status:', err);
            // Revierte el cambio en la UI para una mejor experiencia de usuario en caso de error.
            const originalReassignment = this.reassignments.find(r => r.id === reassignment.id);
            if (originalReassignment) {
              reassignment.status = originalReassignment.status;
            }
            alert('Error al actualizar el estado. Por favor, inténtelo de nuevo.');
          }
        })
    );
  }
}
