import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthRoutingModule } from '../../auth-routing.module';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class LoginComponent {

  private fb = inject(FormBuilder)

  private authService = inject(AuthService)

  public form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  public logIn(): void {
    if (this.form.valid) {
      // console.log('Email:', this.form.value.email);
      // console.log('Password:', this.form.value.password);
      this.authService.getUserPerEmail(this.form.value.email!).subscribe(
        response => {
          if (response.length > 0) {
            if( this.form.value.password === response[0].password) {
              console.log('Login exitoso! 🎉');
            } else {
              console.log('Contraseña incorrecta 😬');
            }
          }
        })
    } else {
      console.log('Formulario inválido 😬');
      this.form.markAllAsTouched(); // Para mostrar errores si los hay
    }
  }

}
