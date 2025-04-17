import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthRoutingModule } from '../../auth-routing.module';

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

  public form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  public logIn(): void {
    if (this.form.valid) {
      console.log('Email:', this.form.value.email);
      console.log('Password:', this.form.value.password);
    } else {
      console.log('Formulario inválido 😬');
      this.form.markAllAsTouched(); // Para mostrar errores si los hay
    }
  }

}
