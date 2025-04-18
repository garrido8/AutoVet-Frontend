import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { StyleService } from '../../../services/style.service';
import { UserInfoService } from '../../../services/user-info.service';
import { Client } from '../../../interfaces/client.interface';

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

    public form = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      dni: ['', [Validators.required]],
      phone: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(15)]],
    });

    ngOnInit(): void {
      this.styleService.setHeaderOff(true);
    }

    ngOnDestroy(): void {
      this.styleService.setHeaderOff(false);
    }

    public logIn(): void {
      if (this.form.valid) {
        const newClient: Client = {
          name: this.form.value.name!,
          email: this.form.value.email!,
          password: this.form.value.password!,
          dni: this.form.value.dni!,
          phone: this.form.value.phone!
        }
        this.authService.addUser(newClient).subscribe({
          next: (createdClient) => {
            this.form.reset()
          },
          error: (err) => {
            console.error('Error al crear usuario:', err);
          }
        });

      } else {
        console.log('Formulario inválido 😬');
        this.form.markAllAsTouched(); // Para mostrar errores si los hay
      }
    }
}
