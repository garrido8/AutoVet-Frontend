import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { StyleService } from '../../../services/style.service';
import { UserInfoService } from '../../../services/user-info.service';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

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

  public showError: boolean = false;

  private authService = inject(AuthService)
  private styleService = inject( StyleService )
  private userInfoService = inject( UserInfoService )

  private subscriptions = new Subscription();

  private router = inject( Router )

  public errorMsg: string = ''

  public form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  ngOnInit(): void {
    this.styleService.setHeaderOff(true);
  }

  ngOnDestroy(): void {
    this.styleService.setHeaderOff(false);
    this.subscriptions.unsubscribe();
  }

  public logIn(): void {
    if (this.form.valid) {

      if (this.form.value.email?.includes('correo')) {
        const getUser = this.authService.getUserPerEmail(this.form.value.email!).subscribe(
          response => {
            if (response.length > 0) {
              if( this.form.value.password === response[0].password) {
                console.log('Login exitoso! 🎉');
                this.authService.setIsLoggedIn(true);
                this.userInfoService.setToken( response[0].email );
                this.router.navigate( ['/home'] );
                localStorage.setItem('isClient', 'true');
              } else {
                this.setErrorMessage( 'El correo o la contraseña son incorrectos' );
              }
            } else {
              this.setErrorMessage( 'No existe ningún usuario con este correo' );
            }
          })

        this.subscriptions.add(getUser);

      } else {
        const getStaff = this.authService.getStaffPerEmail(this.form.value.email!).subscribe(
          response => {
            if (response.length > 0) {
              if( this.form.value.password === response[0].password) {
                console.log('Login exitoso! 🎉');
                this.authService.setIsLoggedIn(true);
                this.userInfoService.setToken( response[0].email );
                localStorage.setItem('isClient', 'false');
                this.router.navigate( ['/home'] );
              } else {
                this.setErrorMessage( 'El correo o la contraseña son incorrectos');
              }
            } else {
              this.setErrorMessage( 'No existe ningún usuario con este correo' );
            }
          })
        this.subscriptions.add(getStaff);
      }
    } else {
      console.log('Formulario inválido 😬');
      this.form.markAllAsTouched(); // Para mostrar errores si los hay
    }
  }

  public setErrorMessage( message: string ) {
    this.showError = true;
    this.errorMsg = message;
  }

}
