import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { UserInfoService } from '../../../services/user-info.service';
import { Client } from '../../../interfaces/client.interface';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { Staff } from '../../../interfaces/staff.interface';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit, OnDestroy {

  private userInfoService = inject( UserInfoService );
  private authService = inject( AuthService );
  private http = inject( HttpClient );

  private subscriptions = new Subscription();

  public user: Client | Staff | null = null;
  public selectedFile: File | null = null;
  public uploadMessage: string | null = null;

  private isClient: boolean = false;
  private isStaff: boolean = false;

  private userEmail: string | null = null;

  // Add the backend base URL here
  public backendBaseUrl: string = 'http://127.0.0.1:8000'; // Make sure this matches your Django backend URL

  ngOnInit(): void {
    this.userEmail = this.userInfoService.getToken();
    if ( this.userEmail ) {
      const userSub = this.authService.getUserPerEmail(this.userEmail)
        .subscribe( response => {
          if (response.length > 0) {
            this.user = response[0];
            console.log('Client Data Received:', this.user); // <<< IMPORTANT: Check this.user.photo here!
            this.isClient = true;
            this.isStaff = false; // Ensure isStaff is false for clients
          } else {
            const staffSub = this.authService.getStaffPerEmail(this.userEmail!)
              .subscribe( response => {
                if (response.length > 0) {
                  this.user = response[0];
                  this.isStaff = true;
                  this.isClient = false; // Ensure isClient is false for staff
                  console.log('Staff Data Received:', this.user); // <<< IMPORTANT: Check this.user.photo here!
                } else {
                  console.log('No staff member found with this email.');
                  this.isClient = false; // Default to false if no user found
                  this.isStaff = false; // Default to false if no user found
                }
              });
            this.subscriptions.add(staffSub);
          }
        });
      this.subscriptions.add(userSub);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // NEW: Getter for the profile image URL
  get profileImageUrl(): string {
    if (this.user && this.user.photo) {
      const fullUrl = this.backendBaseUrl + this.user.photo;
      console.log('Constructed Image URL:', fullUrl); // <<< IMPORTANT: Check this in console!
      return fullUrl;
    }
    return 'https://placehold.co/150x150/cccccc/333333?text=No+Photo';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.uploadMessage = `Archivo seleccionado: ${this.selectedFile.name}`;
      console.log('File selected:', this.selectedFile.name);
    } else {
      this.selectedFile = null;
      this.uploadMessage = null;
    }
  }

  // MODIFIED METHOD: Handles both Client and Staff photo uploads using isClient/isStaff flags
  uploadProfilePicture(): void {
    if (!this.selectedFile) {
      this.uploadMessage = 'Por favor, selecciona una imagen primero.';
      return;
    }

    // FIX: Check for 'id' for Client or 'pk' for Staff
    let userId: number | undefined;
    if (this.user && 'id' in this.user && this.user.id !== undefined) {
      userId = this.user.id;
    } else if (this.user && 'pk' in this.user && this.user.pk !== undefined) {
      userId = this.user.pk;
    }

    if (userId === undefined) {
      this.uploadMessage = 'No se puede subir la foto. No se encontró un ID de usuario válido.';
      console.warn('Cannot upload photo: User object is null or missing ID/PK.');
      return;
    }

    this.uploadMessage = 'Subiendo foto...';
    const formData = new FormData();
    formData.append('photo', this.selectedFile, this.selectedFile.name);

    if (this.isClient) {
      // Handle Client photo upload
      this.authService.updateClientPhoto(userId, formData).subscribe(
        (response: Client) => {
          this.user = { ...this.user as Client, photo: response.photo };
          this.uploadMessage = 'Foto de perfil de cliente actualizada con éxito.';
          this.selectedFile = null;
          console.log('Client profile picture uploaded successfully!', response);
        },
        error => {
          this.uploadMessage = 'Error al subir la foto de cliente.';
          console.error('Error uploading client profile picture:', error);
        }
      );
    } else if (this.isStaff) {
      // Handle Staff photo upload
      this.authService.updateStaffPhoto(userId, formData).subscribe(
        (response: Staff) => {
          this.user = { ...this.user as Staff, photo: response.photo };
          this.uploadMessage = 'Foto de perfil de staff actualizada con éxito.';
          this.selectedFile = null;
          console.log('Staff profile picture uploaded successfully!', response);
        },
        error => {
          this.uploadMessage = 'Error al subir la foto de staff.';
          console.error('Error uploading staff profile picture:', error);
        }
      );
    } else {
      this.uploadMessage = 'Rol de usuario no reconocido para la subida de fotos.';
      console.warn('Cannot upload photo: User is neither client nor staff.');
    }
  }
}
