import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { UserInfoService } from '../../../services/user-info.service';
import { Client } from '../../../interfaces/client.interface';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { Staff } from '../../../interfaces/staff.interface';
import { HttpClient } from '@angular/common/http';

/**
 * @class ProfileComponent
 * @description
 * Componente para mostrar y gestionar el perfil del usuario.
 * Permite tanto a clientes como a miembros del personal ver su información
 * y actualizar su foto de perfil. Distingue entre los dos tipos de usuario
 * para realizar las operaciones correspondientes.
 */
@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit, OnDestroy {

  // --- Inyección de Dependencias ---

  /**
   * @private
   * @property {UserInfoService} userInfoService
   * @description Servicio para obtener la información del usuario logueado (ej. token/email).
   */
  private userInfoService = inject( UserInfoService );

  /**
   * @private
   * @property {AuthService} authService
   * @description Servicio para la autenticación y actualización de datos de usuarios y personal.
   */
  private authService = inject( AuthService );

  /**
   * @private
   * @property {HttpClient} http
   * @description Cliente HTTP de Angular para realizar peticiones (aunque no se use directamente, es una dependencia común).
   */
  private http = inject( HttpClient );

  // --- Propiedades Privadas de Estado y Suscripciones ---

  /**
   * @private
   * @property {Subscription} subscriptions
   * @description Contenedor para las suscripciones de RxJS, para ser anuladas al destruir el componente.
   */
  private subscriptions = new Subscription();

  /**
   * @private
   * @property {boolean} isClient
   * @description Flag que indica si el usuario actual es un cliente.
   */
  private isClient: boolean = false;

  /**
   * @private
   * @property {boolean} isStaff
   * @description Flag que indica si el usuario actual es un miembro del personal.
   */
  private isStaff: boolean = false;

  /**
   * @private
   * @property {string | null} userEmail
   * @description Almacena el email del usuario logueado.
   */
  private userEmail: string | null = null;

  // --- Propiedades Públicas ---

  /**
   * @property {Client | Staff | null} user
   * @description Almacena el objeto del usuario actual, que puede ser de tipo Cliente o Staff.
   */
  public user: Client | Staff | null = null;

  /**
   * @property {File | null} selectedFile
   * @description Almacena el archivo de imagen seleccionado por el usuario para subir.
   */
  public selectedFile: File | null = null;

  /**
   * @property {string | null} uploadMessage
   * @description Mensaje para mostrar al usuario el estado de la subida de la imagen.
   */
  public uploadMessage: string | null = null;

  /**
   * @property {string} backendBaseUrl
   * @description URL base del servidor backend, usada para construir las URLs completas de las imágenes.
   */
  public backendBaseUrl: string = 'http://127.0.0.1:8000';

  /**
   * @method ngOnInit
   * @description
   * Ciclo de vida de Angular. Al iniciar, obtiene el email del usuario y determina si es un
   * cliente o un miembro del personal, cargando los datos correspondientes.
   * @returns {void}
   */
  ngOnInit(): void {
    this.userEmail = this.userInfoService.getToken();
    if ( this.userEmail ) {
      const userSub = this.authService.getUserPerEmail(this.userEmail)
        .subscribe( response => {
          if (response.length > 0) {
            this.user = response[0];
            this.isClient = true;
            this.isStaff = false;
          } else {
            const staffSub = this.authService.getStaffPerEmail(this.userEmail!)
              .subscribe( response => {
                if (response.length > 0) {
                  this.user = response[0];
                  this.isStaff = true;
                  this.isClient = false;
                } else {
                  this.isClient = false;
                  this.isStaff = false;
                }
              });
            this.subscriptions.add(staffSub);
          }
        });
      this.subscriptions.add(userSub);
    }
  }

  /**
   * @method ngOnDestroy
   * @description
   * Ciclo de vida de Angular. Anula todas las suscripciones activas para evitar fugas de memoria.
   * @returns {void}
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * @method profileImageUrl
   * @description
   * Getter que construye y devuelve la URL completa de la foto de perfil del usuario.
   * Si el usuario no tiene foto, devuelve una URL a una imagen de placeholder.
   * @returns {string} La URL de la imagen de perfil.
   */
  get profileImageUrl(): string {
    if (this.user && this.user.photo) {
      const fullUrl = this.backendBaseUrl + this.user.photo;
      return fullUrl;
    }
    return 'https://placehold.co/150x150/cccccc/333333?text=No+Photo';
  }

  /**
   * @method onFileSelected
   * @description
   * Se ejecuta cuando el usuario selecciona un archivo en el input de tipo 'file'.
   * Almacena el archivo seleccionado en la propiedad `selectedFile`.
   * @param {Event} event - El evento del input que contiene los archivos seleccionados.
   * @returns {void}
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.uploadMessage = `Archivo seleccionado: ${this.selectedFile.name}`;
    } else {
      this.selectedFile = null;
      this.uploadMessage = null;
    }
  }

  /**
   * @method uploadProfilePicture
   * @description
   * Sube la foto de perfil seleccionada al servidor. Determina si el usuario es
   * cliente o personal y llama al método de servicio correspondiente para actualizar la foto.
   * @returns {void}
   */
  uploadProfilePicture(): void {
    if (!this.selectedFile) {
      this.uploadMessage = 'Por favor, selecciona una imagen primero.';
      return;
    }

    let userId: number | undefined;
    if (this.user && 'id' in this.user && this.user.id !== undefined) {
      userId = this.user.id;
    } else if (this.user && 'pk' in this.user && this.user.pk !== undefined) {
      userId = this.user.pk;
    }

    if (userId === undefined) {
      this.uploadMessage = 'No se puede subir la foto. No se encontró un ID de usuario válido.';
      return;
    }

    this.uploadMessage = 'Subiendo foto...';
    const formData = new FormData();
    formData.append('photo', this.selectedFile, this.selectedFile.name);

    if (this.isClient) {
      this.authService.updateClientPhoto(userId, formData).subscribe({
        next: (response: Client) => {
          this.user = { ...this.user as Client, photo: response.photo };
          this.uploadMessage = 'Foto de perfil de cliente actualizada con éxito.';
          this.selectedFile = null;
        },
        error: (error) => {
          this.uploadMessage = 'Error al subir la foto de cliente.';
          console.error('Error uploading client profile picture:', error);
        }
      });
    } else if (this.isStaff) {
      this.authService.updateStaffPhoto(userId, formData).subscribe({
        next: (response: Staff) => {
          this.user = { ...this.user as Staff, photo: response.photo };
          this.uploadMessage = 'Foto de perfil de staff actualizada con éxito.';
          this.selectedFile = null;
        },
        error: (error) => {
          this.uploadMessage = 'Error al subir la foto de staff.';
          console.error('Error uploading staff profile picture:', error);
        }
      });
    } else {
      this.uploadMessage = 'Rol de usuario no reconocido para la subida de fotos.';
    }
  }
}
