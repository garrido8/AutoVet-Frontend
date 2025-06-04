import { CommonModule, formatDate, registerLocaleData } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
// Ya no necesitamos 'filter' si no se usa explícitamente en un pipe de RxJS
// import { filter } from 'rxjs/operators';

// Servicios
import { AppoinmentService } from '../../../services/appoinment.service';
import { PetService } from '../../../services/pet.service';
import { UserInfoService } from '../../../services/user-info.service';
import { ReassignmentService } from '../../../services/reassignment.service';

// Interfaces
import { Appoinment } from '../../../interfaces/appoinment.interface';
import { Reassignment } from '../../../interfaces/reassignment.interface';
import { Staff } from '../../../interfaces/staff.interface';

// Configuración de localización para fechas
import localeEs from '@angular/common/locales/es';
registerLocaleData(localeEs, 'es-ES');

/**
 * @class AppointmentInfoComponent
 * @description Componente para mostrar y gestionar la información detallada de una cita.
 * Permite a los usuarios (presumiblemente personal o administradores) ver, actualizar el estado
 * y la urgencia de una cita, y solicitar su reasignación.
 */
@Component({
  selector: 'app-appointment-info',
  standalone: true,
  templateUrl: './appointment-info.component.html',
  styleUrl: './appointment-info.component.css',
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule
  ]
})
export class AppointmentInfoComponent implements OnInit, OnDestroy {

  /**
   * @public
   * @property {string[]} estados - Array de cadenas que representan los estados posibles de una cita en la UI.
   */
  public estados: string[] = [
    'Pendiente',
    'En proceso',
    'Resuelta'
  ];

  /**
   * @public
   * @property {boolean} showModal - Controla la visibilidad del modal para mensajes generales (éxito/error).
   */
  public showModal = false;

  /**
   * @public
   * @property {string} modalMessage - Mensaje a mostrar dentro del modal general.
   */
  public modalMessage = '';

  /**
   * @public
   * @property {boolean} showReassignmentModal - Controla la visibilidad del modal para solicitudes de reasignación.
   */
  public showReassignmentModal = false;

  /**
   * @private
   * @property {FormBuilder} fb - Servicio inyectado de Angular para construir formularios reactivos.
   */
  private fb = inject( FormBuilder );

  /**
   * @private
   * @property {AppoinmentService} appointmentService - Servicio inyectado para gestionar las operaciones CRUD de citas.
   */
  private appointmentService = inject( AppoinmentService );

  /**
   * @private
   * @property {UserInfoService} userInfoService - Servicio inyectado para obtener información del usuario actual.
   */
  private userInfoService = inject( UserInfoService );

  /**
   * @private
   * @property {PetService} petService - Servicio inyectado para obtener información de las mascotas.
   */
  private petService = inject( PetService );

  /**
   * @private
   * @property {ActivatedRoute} route - Servicio inyectado para acceder a la información de la ruta activa, como los parámetros de la URL.
   */
  private route = inject( ActivatedRoute );

  /**
   * @private
   * @property {Router} router - Servicio inyectado para la navegación programática.
   */
  private router = inject( Router );

  /**
   * @private
   * @property {ReassignmentService} reassignmentService - Servicio inyectado para gestionar las solicitudes de reasignación.
   */
  private reassignmentService = inject( ReassignmentService );

  /**
   * @private
   * @property {Subscription} subscriptions - Objeto para gestionar todas las suscripciones de RxJS y desuscribirse en `ngOnDestroy`.
   */
  private subscriptions = new Subscription();

  /**
   * @public
   * @property {string} petName - El nombre de la mascota asociada a la cita actual.
   */
  public petName: string = '';

  /**
   * @public
   * @property {FormGroup} form - El formulario reactivo para editar los detalles de la cita.
   */
  public form = this.fb.group( {
    /**
     * @property {FormControl<Date | null>} fecha_resolucion - Fecha de resolución de la cita. Puede ser un objeto Date o nula.
     * Este FormControl almacena un objeto Date, mientras que el input HTML 'datetime-local' trabaja con una cadena.
     * La sincronización se maneja mediante `fechaResolucionInput` y el método `updateFechaResolucion`.
     */
    fecha_resolucion: [null as Date | null],
    /**
     * @property {FormControl<string>} estado - Estado actual de la cita (ej. 'Pendiente', 'En proceso'). Requerido.
     */
    estado: ['pendiente', Validators.required],
    /**
     * @property {FormControl<boolean>} urgencia - Indicador de urgencia de la cita. Por defecto es `false`.
     */
    urgencia: [false],
  } );

  /**
   * @public
   * @property {string | null} fechaResolucionInput - Propiedad auxiliar para manejar el valor de cadena del input `datetime-local`.
   * Se utiliza para la vinculación `[(ngModel)]` con el input HTML.
   */
  public fechaResolucionInput: string | null = null;

  /**
   * @public
   * @property {FormGroup} reassignmentForm - El formulario reactivo para solicitar una reasignación de cita.
   */
  public reassignmentForm = this.fb.group({
    /**
     * @property {FormControl<string>} reason - Razón de la solicitud de reasignación. Requerido.
     */
    reason: ['', Validators.required]
  });

  /**
   * @public
   * @property {Appoinment | undefined} appointment - El objeto de cita actual que se está visualizando/editando.
   */
  public appointment?: Appoinment;

  /**
   * @private
   * @property {Staff | null} staff - Información del personal logueado actualmente.
   */
  private staff: Staff | null = null;

  /**
   * @method ngOnInit
   * @description Hook del ciclo de vida que se ejecuta después de que se inicializan las propiedades enlazadas a datos del componente.
   * Obtiene la información del personal, el ID de la cita de la URL y carga los detalles de la cita y el nombre de la mascota.
   * También se encarga de precargar la fecha de resolución en el input HTML y en el FormControl correspondiente.
   */
  ngOnInit(): void {
    this.staff = this.userInfoService.getFullStaffToken();

    const id = parseInt( this.route.snapshot.paramMap.get('id')! );

    const appointmentSub = this.appointmentService.getAppoinmentById(id)
      .subscribe( response => {
        if (response) {
          this.appointment = response;

          const petNameSub = this.petService.getPetById(response.mascota)
            .subscribe( petResponse => {
              if (petResponse) {
                this.petName = petResponse.nombre;
              }
            } );
          this.subscriptions.add(petNameSub);

          // Precarga los valores del formulario que no son la fecha de resolución
          this.form.patchValue({
            estado: this.getDisplayStatus(response.estado),
            urgencia: response.urgencia,
          });

          // Si la cita tiene una fecha de resolución, precargamos tanto la propiedad de cadena para el input
          // como el FormControl con el objeto Date correspondiente.
          if (response.fecha_resolucion) {
            this.fechaResolucionInput = this._formatDateForInput(response.fecha_resolucion);
            this.form.controls.fecha_resolucion.setValue(new Date(response.fecha_resolucion));
          }
        }
      } );
    this.subscriptions.add(appointmentSub);
  }

  /**
   * @method ngOnDestroy
   * @description Hook del ciclo de vida que se ejecuta cuando el componente se destruye.
   * Cancela la suscripción de todas las suscripciones activas para prevenir fugas de memoria.
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * @public
   * @method getDate
   * @description Formatea un objeto `Date` a una cadena en formato "dd/MM/yyyy" para la localización en español.
   * @param {Date} date - El objeto Date a formatear.
   * @returns {string} La fecha formateada.
   */
  public getDate(date: Date): string {
    const dateFormat = 'dd/MM/yyyy';
    const locale = 'es-ES';
    return formatDate(date, dateFormat, locale);
  }

  /**
   * @private
   * @method _formatDateForInput
   * @description Formatea una fecha (Date o string ISO) a una cadena compatible con el input `datetime-local` (YYYY-MM-DDTHH:mm).
   * Esto es necesario para que el valor de la fecha se precargue correctamente en el campo del formulario HTML.
   * @param {string | Date} dateInput - La fecha a formatear.
   * @returns {string} La fecha formateada en el formato "YYYY-MM-DDTHH:mm".
   */
  private _formatDateForInput(dateInput: string | Date): string {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      console.warn('Fecha inválida proporcionada para _formatDateForInput:', dateInput);
      return '';
    }

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  /**
   * @public
   * @method updateFechaResolucion
   * @description Este método se llama cuando el valor del input `datetime-local` cambia (ej. el usuario selecciona una fecha/hora).
   * Convierte la cadena de fecha del input HTML a un objeto `Date` y actualiza el `FormControl` `fecha_resolucion`
   * con este objeto `Date`. También maneja casos donde la cadena no es una fecha válida o está vacía.
   * @param {Event} event - El evento de cambio (`input`) del elemento HTML.
   */
  public updateFechaResolucion(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const dateString = inputElement.value;

    if (dateString) {
      const dateObject = new Date(dateString);
      if (!isNaN(dateObject.getTime())) {
        this.form.controls.fecha_resolucion.setValue(dateObject);
      } else {
        // Si la cadena no es una fecha válida, establecer el control a null
        this.form.controls.fecha_resolucion.setValue(null);
        console.warn('Fecha introducida inválida:', dateString);
      }
    } else {
      // Si el input está vacío, establecer el control a null
      this.form.controls.fecha_resolucion.setValue(null);
    }
  }

  /**
   * @private
   * @method getStatus
   * @description Convierte el estado de la cita desde el formato de visualización (UI) al formato esperado por el backend (API).
   * @param {string} estado - El estado de la cita en formato de visualización (ej. "Pendiente").
   * @returns {string} El estado de la cita en formato de API (ej. "pendiente").
   */
  private getStatus(estado: string): string {
    switch (estado) {
      case 'Pendiente':
        return 'pendiente';
      case 'En proceso':
        return 'en_proceso';
      case 'Resuelta':
        return 'resuelta';
      default:
        console.warn(`Estado desconocido: ${estado}. Retornando 'pendiente'.`);
        return 'pendiente';
    }
  }

  /**
   * @private
   * @method getDisplayStatus
   * @description Convierte el estado de la cita desde el formato de la API al formato de visualización (UI).
   * @param {string} estado - El estado de la cita en formato de API (ej. "pendiente").
   * @returns {string} El estado de la cita en formato de visualización (ej. "Pendiente").
   */
  private getDisplayStatus(estado: string): string {
    switch (estado) {
      case 'pendiente':
        return 'Pendiente';
      case 'en_proceso':
        return 'En proceso';
      case 'resuelta':
        return 'Resuelta';
      default:
        console.warn(`Estado API desconocido: ${estado}. Retornando 'Desconocido'.`);
        return 'Desconocido';
    }
  }

  /**
   * @public
   * @method onSubmit
   * @description Maneja el envío del formulario de actualización de la cita.
   * Valida el formulario, construye el objeto `Appoinment` con los datos actualizados
   * y llama al servicio `AppoinmentService` para modificar la cita en el backend.
   * Muestra un modal con el resultado de la operación.
   */
  public onSubmit(): void {
    if (this.form.valid && this.appointment) {
      // Directamente usamos el valor del form control, que ya es un Date | null
      const resolvedDate = this.form.value.fecha_resolucion;

      const appointmentToUpdate: Appoinment = {
        mascota: this.appointment.mascota,
        titulo: this.appointment.titulo,
        descripcion: this.appointment.descripcion,
        fecha_creacion: this.appointment.fecha_creacion,
        estado: this.getStatus(this.form.value.estado!),
        urgencia: this.form.value.urgencia!,
        fecha_resolucion: resolvedDate!
      };

      console.log('Actualizando cita:', appointmentToUpdate);
      const editAppointmentSub = this.appointmentService.editAppoinment(this.appointment.pk!, appointmentToUpdate)
        .subscribe({
          next: response => {
            // Se asume que un 'null', 'undefined' o un objeto vacío indica éxito para la API.
            if (response === null || response === undefined || Object.keys(response).length === 0) {
              this.modalMessage = 'Cita modificada correctamente.';
              this.showModal = true;
            } else {
              // Si el backend devuelve el objeto actualizado, se asigna
              this.appointment = response;
              this.modalMessage = 'Cita modificada correctamente.';
              this.showModal = true;
            }
          },
          error: err => {
            console.error('Error al modificar la cita:', err);
            this.modalMessage = 'Error al modificar la cita. Por favor, inténtelo de nuevo.';
            this.showModal = true;
          }
        });
      this.subscriptions.add(editAppointmentSub);
    } else {
      console.warn('El formulario no es válido o no hay cita seleccionada.');
      this.modalMessage = 'No se pudo actualizar la cita. Verifique el formulario.';
      this.showModal = true;
    }
  }

  /**
   * @public
   * @method closeModalAndNavigate
   * @description Cierra el modal de mensajes generales y navega a la página de listado de citas del personal.
   */
  public closeModalAndNavigate(): void {
    this.showModal = false;
    this.router.navigate(['/staff/appointments']);
  }

  /**
   * @public
   * @method openReassignmentModal
   * @description Abre el modal de solicitud de reasignación y resetea el formulario de reasignación.
   */
  public openReassignmentModal(): void {
    this.showReassignmentModal = true;
    this.reassignmentForm.reset();
  }

  /**
   * @public
   * @method closeReassignmentModal
   * @description Cierra el modal de solicitud de reasignación y resetea el formulario de reasignación.
   */
  public closeReassignmentModal(): void {
    this.showReassignmentModal = false;
    this.reassignmentForm.reset();
  }

  /**
   * @public
   * @method onReassignmentSubmit
   * @description Maneja el envío del formulario de solicitud de reasignación.
   * Valida el formulario, construye el objeto `Reassignment` y lo envía al servicio `ReassignmentService`.
   * Muestra un modal de éxito o error tras la operación.
   */
  public onReassignmentSubmit(): void {
    if (this.reassignmentForm.valid && this.appointment && this.staff) {
      const reassignment: Reassignment = {
        appointment: this.appointment.pk!,
        appointment_title: this.appointment.titulo!,
        requesting_worker: this.staff.pk!,
        requesting_worker_name: this.staff.name!,
        reason: this.reassignmentForm.value.reason!,
        status: 'pending',
        requested_at: new Date()
      };

      console.log('Enviando solicitud de reasignación:', reassignment);

      const addReassignmentSub = this.reassignmentService.addReassignment( reassignment )
        .subscribe({
          next: response => {
            if( response ) {
              console.log('Reasignación añadida:', response);
              this.modalMessage = 'Solicitud de reasignación enviada correctamente.';
              this.showReassignmentModal = false;
              this.showModal = true;
            } else {
              this.modalMessage = 'Error al enviar la solicitud de reasignación. Inténtelo de nuevo.';
              this.showModal = true;
            }
          },
          error: err => {
            console.error('Error al añadir la reasignación:', err);
            this.modalMessage = 'Error de conexión al enviar la solicitud de reasignación.';
            this.showModal = true;
          }
        });
      this.subscriptions.add(addReassignmentSub);
    } else {
      console.warn('El formulario de reasignación no es válido o faltan datos de la cita/personal.');
      this.modalMessage = 'Por favor, introduce un motivo válido para la reasignación.';
      this.showModal = true;
    }
  }
}
