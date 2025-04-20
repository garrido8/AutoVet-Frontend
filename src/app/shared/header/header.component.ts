import { Component, inject } from '@angular/core';
import { UserInfoService } from '../../services/user-info.service';
import { Client } from '../../interfaces/client.interface';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

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

  public showingMenu: boolean = false


  public isClient: boolean = localStorage.getItem('isClient') === 'true' ? true : false


  public logOut(): void {
    this.userInfo.setUserInfo( {} as Client );
    this.authService.logout();
    localStorage.removeItem('isClient');
    localStorage.removeItem('isLoggedIn');
    this.router.navigate(['/home']);
  }

  public showMenu(): void {
    this.showingMenu = !this.showingMenu
  }

}
