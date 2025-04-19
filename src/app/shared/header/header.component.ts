import { AfterViewInit, Component, inject, Input, input, OnInit } from '@angular/core';
import { UserInfoService } from '../../services/user-info.service';
import { Client } from '../../interfaces/client.interface';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { StyleService } from '../../services/style.service';

@Component({
  selector: 'header-component',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent  {


  private userInfo = inject( UserInfoService )
  private authService = inject( AuthService )

  private router = inject( Router )


  public isClient: boolean = localStorage.getItem('isClient') === 'true' ? true : false


  public logOut(): void {
    this.userInfo.setUserInfo( {} as Client );
    this.authService.logout();
    localStorage.removeItem('isClient');
    localStorage.removeItem('isLoggedIn');
    this.router.navigate(['/home']);
  }

}
