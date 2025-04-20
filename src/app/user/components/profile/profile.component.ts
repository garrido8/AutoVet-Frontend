import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { UserInfoService } from '../../../services/user-info.service';
import { Client } from '../../../interfaces/client.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit, OnDestroy{

  private userInfoService = inject( UserInfoService )

  private subscriptions = new Subscription()

  public user?: Client

  ngOnInit(): void {
    const userSub = this.userInfoService.getUserInfo().subscribe({
      next: user => {
        if (user) {
          console.log('Usuario recibido:', user);
          this.user = user;
        } else {
          console.log('No hay usuario disponible');
        }
      },
      error: err => {
        console.error('Error al obtener user info:', err);
      }
    });

    this.subscriptions.add(userSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

}
