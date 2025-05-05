import { Component, inject, OnDestroy, OnInit, ElementRef } from '@angular/core';
import { UserInfoService } from '../../services/user-info.service';
import { Client } from '../../interfaces/client.interface';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'header-component',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy {
  private userInfo = inject(UserInfoService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private document = inject(DOCUMENT);
  public showingMenu: boolean = false;
  public isClient: boolean = localStorage.getItem('isClient') === 'true' ? true : false;
  public isAdmin: boolean = localStorage.getItem('isAdmin') === 'true' ? true : false;
  private clickOutsideListener?: (event: MouseEvent) => void;

  constructor(private elementRef: ElementRef) {}

  ngOnInit(): void {
    this.clickOutsideListener = (event: MouseEvent) => {
      if (this.showingMenu && !this.elementRef.nativeElement.contains(event.target as Node)) {
        this.showingMenu = false;
      }
    };
    this.document.addEventListener('mousedown', this.clickOutsideListener);
  }

  ngOnDestroy(): void {
    this.document.removeEventListener('mousedown', this.clickOutsideListener! );
  }

  public logOut(): void {
    this.userInfo.setUserInfo({} as Client);
    this.authService.logout();
    localStorage.removeItem('isClient');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('isAdmin');
    this.router.navigate(['/home']);
  }

  public showMenu(): void {
    this.showingMenu = !this.showingMenu;
  }

  public closeMenu(): void {
    this.showingMenu = false;
  }
}
