import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { UserInfoService } from '../../../services/user-info.service';
import { Client } from '../../../interfaces/client.interface';
import { Staff } from '../../../interfaces/staff.interface';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-clients',
  standalone: true,
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.css',
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class ClientsComponent implements OnInit, OnDestroy{

  private subscriptions = new Subscription();
  private userInfoService = inject( UserInfoService)
  private authService = inject( AuthService )

  private router = inject( Router )

  public clients: Client[] = [];

  ngOnInit(): void {
    const token = this.userInfoService.getToken()

    if( token ) {
      this.authService.getStaffPerEmail(token)
      .subscribe( response => {
        if ( response.length > 0 ) {
          const staffMember: Staff = response[0];
          const clientsIds = staffMember.assigned_clients;

          clientsIds.forEach( (clientId: number) => {
            this.authService.getUserPerId(clientId)
            .subscribe( response => {
              if ( response ) {
                this.clients.push(response);
              } else {
                console.log('No client found with this ID.');
              }
            })
          } )
          console.log('Client Data Received:', this.clients);
        } else {
          console.log('No client found with this email.');
        }
      })
    }
  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // public goToClient(client: Client) {
  //   this.router.navigate(['/staff/client-info'])
  // }

}
