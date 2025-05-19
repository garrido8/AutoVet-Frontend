import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { StyleService } from '../../../services/style.service';
import { UserInfoService } from '../../../services/user-info.service';
import { Client } from '../../../interfaces/client.interface';
import { dniValidator } from '../../../../environments/format-settings';
import * as CryptoJS from 'crypto-js';


@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule
  ]
})
export class RegisterComponent {

    private fb = inject(FormBuilder)

    private authService = inject(AuthService)
    private styleService = inject( StyleService )
    private userInfo = inject( UserInfoService )

    private router = inject(Router)

    public badMail: boolean = false
    public alreadyExists: boolean = false

    public form = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      dni: ['', [Validators.required, dniValidator()]],
      phone: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(15)]],
    });

    ngOnInit(): void {
      this.styleService.setHeaderOff(true);
    }

    ngOnDestroy(): void {
      this.styleService.setHeaderOff(false);
    }

    public createUser(): void {
      if (this.form.valid) {

        if ( this.form.value.email!.includes( 'autovet' ) ) {
          this.badMail = true
          return
        }

        this.authService.getUserPerEmail( this.form.value.email!)
          .subscribe( response => {
            if( response.length !== 0 ) {
              this.alreadyExists = true
            } else {
              this.alreadyExists = false
            }
          })

        if( !this.alreadyExists ) {
          const newClient: Client = {
            name: this.form.value.name!,
            email: this.form.value.email!,
            password: CryptoJS.SHA256(this.form.value.password!).toString(),
            dni: this.form.value.dni!,
            phone: this.form.value.phone!
          }
          this.authService.addUser(newClient).subscribe({
            next: (createdClient) => {
              this.form.reset()
              this.router.navigate(['/auth/login'])
            },
            error: (err) => {
              console.error('Error al crear usuario:', err);
            }
          });
        }


      } else {
        console.log('Formulario inválido 😬');
        this.form.markAllAsTouched(); // Para mostrar errores si los hay
      }
    }
}
