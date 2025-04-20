import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { UserInfoService } from '../../../services/user-info.service';
import { Client } from '../../../interfaces/client.interface';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit, OnDestroy{

  private userInfoService = inject( UserInfoService )
  private authService = inject( AuthService)

  private subscriptions = new Subscription()

  public user?: Client

  private userEmail: string | null = null;

  ngOnInit(): void {
    this.userEmail = this.userInfoService.getToken();
    if (this.userEmail) {
      const userSub = this.authService.getUserPerEmail(this.userEmail)
        .subscribe( response => {
          if (response.length > 0) {
            this.user = response[0];
          }
        })
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

}
