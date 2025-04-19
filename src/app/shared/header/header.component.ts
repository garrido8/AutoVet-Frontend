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


  @Input() public isClient: boolean = false


  public logOut(): void {
    this.userInfo.setUserInfo( {} as Client );
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

}
