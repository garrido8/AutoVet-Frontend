import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Client } from '../../../interfaces/client.interface';
import { Staff } from '../../../interfaces/staff.interface';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-create-user',
  standalone: true,
  templateUrl: './create-user.component.html',
  styleUrl: './create-user.component.css',
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule
  ]
})
export class CreateUserComponent implements OnInit, OnDestroy {

  private route = inject( ActivatedRoute )

  private authService = inject( AuthService )

  private fb = inject( FormBuilder)

  private subscriptions = new Subscription()

  public client = false;

  public form = this.fb.group({
        name: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', Validators.required],
        dni: ['', [Validators.required]],
        phone: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(15)]],
      });

  ngOnInit(): void {
    const routeSub = this.route.url
      .subscribe( ( url ) => {
        if ( url[0].path.includes( 'client' ) ) {
          this.client = true;
        }
      } );

    this.subscriptions.add( routeSub );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }



  public addUser() {
    if( this.form.valid ) {

      if( this.client ) {
        const client: Client = {
          name: this.form.value.name!,
          email: this.form.value.email!,
          password: this.form.value.password!,
          dni: this.form.value.dni!,
          phone: this.form.value.phone!
        }

        this.authService.addUser( client )
          .subscribe( ( response ) => {
            this.form.reset();
            console.log( response );
          } );

      } else {
        const staff: Staff = {
          name: this.form.value.name!,
          email: this.form.value.email!,
          password: this.form.value.password!,
          dni: this.form.value.dni!,
          phone: this.form.value.phone!,
          role: 'worker',
          assigned_clients: []
        }

        this.authService.addWorker( staff )
          .subscribe( ( response ) => {
            this.form.reset();
            console.log( response );
          } );
      }
    }
  }

}
