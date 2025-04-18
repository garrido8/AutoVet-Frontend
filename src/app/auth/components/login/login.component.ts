import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthRoutingModule } from '../../auth-routing.module';
import { AuthService } from '../../../services/auth.service';
import { StyleService } from '../../../services/style.service';
import { UserInfoService } from '../../../services/user-info.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule
  ]
})
export class LoginComponent implements OnInit, OnDestroy {


  private fb = inject(FormBuilder)

  private authService = inject(AuthService)
  private styleService = inject( StyleService )
  private userInfo = inject( UserInfoService )

  public form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  ngOnInit(): void {
    this.styleService.setHeaderOff(true);
  }

  ngOnDestroy(): void {
    this.styleService.setHeaderOff(false);
  }

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
