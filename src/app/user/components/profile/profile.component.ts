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
  public isClient: boolean = false;

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
          } else {
            const staffSub = this.authService.getStaffPerEmail(this.userEmail!)
              .subscribe( response => {
                if (response.length > 0) {
                  this.user = response[0];
                  console.log('Staff Data Received:', this.user); // <<< IMPORTANT: Check this.user.photo here!
                } else {
                  console.log('No staff member found with this email.');
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
      // The `user.photo` value coming from Django's ImageField
      // typically looks like 'client_photos/your_image.png' or '/media/client_photos/your_image.png'.
      // The error message 'http://localhost:4200/media/client_photos/...'
      // suggests that 'user.photo' already includes '/media/'.
      // If 'user.photo' is '/media/client_photos/image.png', then directly concatenate.
      // If 'user.photo' is 'client_photos/image.png', then you need:
      // return this.backendBaseUrl + '/media/' + this.user.photo;

      // Let's assume user.photo is already like '/media/client_photos/image.png' as per your error.
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

  uploadProfilePicture(): void {
    if (!this.selectedFile) {
      this.uploadMessage = 'Por favor, selecciona una imagen primero.';
      return;
    }

    if (this.user && 'id' in this.user && this.isClient) {
      this.uploadMessage = 'Subiendo foto...';
      const formData = new FormData();
      formData.append('photo', this.selectedFile, this.selectedFile.name);

      this.authService.updateClientPhoto(this.user.id!, formData).subscribe(
        (response: Client) => {
          // Update the user object with the new photo URL from the response
          // response.photo should be the updated path from Django.
          this.user = { ...this.user as Client, photo: response.photo };
          this.uploadMessage = 'Foto de perfil actualizada con éxito.';
          this.selectedFile = null; // Clear selected file after successful upload
          console.log('Profile picture uploaded successfully!', response);
          console.log('Updated user photo path in component:', this.user.photo); // <<< Check updated path
        },
        error => {
          this.uploadMessage = 'Error al subir la foto.';
          console.error('Error uploading profile picture:', error);
        }
      );
    } else {
      this.uploadMessage = 'No se puede subir la foto. Asegúrate de ser un cliente y tener un perfil cargado.';
      console.warn('Cannot upload photo: User is not a client or ID is missing.');
    }
  }
}
