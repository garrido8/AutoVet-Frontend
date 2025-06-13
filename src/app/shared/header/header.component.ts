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

  public showingProfileMenu: boolean = false; // For desktop profile dropdown
  public showingFullscreenMenu: boolean = false; // For mobile fullscreen modal

  public isClient: boolean = localStorage.getItem('isClient') === 'true' ? true : false;
  public isAdmin: boolean = localStorage.getItem('isAdmin') === 'true' ? true : false;

  private clickOutsideListener?: (event: MouseEvent) => void;

  constructor(private elementRef: ElementRef) {}

  ngOnInit(): void {
    this.clickOutsideListener = (event: MouseEvent) => {
      const target = event.target as Node;

      // Close profile menu if clicked outside
      if (this.showingProfileMenu) {
        const profileMenuElement = this.elementRef.nativeElement.querySelector('.profile-dropdown-menu');
        const profileToggleButton = this.elementRef.nativeElement.querySelector('#logout-btn'); // The "Mi perfil" button

        // If the click is outside the profile menu AND outside its toggle button
        if (profileMenuElement && !profileMenuElement.contains(target) && profileToggleButton && !profileToggleButton.contains(target)) {
          this.showingProfileMenu = false;
        }
      }

      // Close fullscreen menu if clicked outside its content
      if (this.showingFullscreenMenu) {
        const fullscreenMenuContent = this.elementRef.nativeElement.querySelector('.fullscreen-menu-content');
        const hamburgerToggleButton = this.elementRef.nativeElement.querySelector('.menu-toggle'); // The hamburger button

        // If the click is outside the fullscreen menu content AND outside the hamburger button
        if (fullscreenMenuContent && !fullscreenMenuContent.contains(target) && hamburgerToggleButton && !hamburgerToggleButton.contains(target)) {
          this.closeFullscreenMenu(); // Use close function to also manage body overflow
        }
      }
    };
    this.document.addEventListener('mousedown', this.clickOutsideListener);
  }

  ngOnDestroy(): void {
    this.document.removeEventListener('mousedown', this.clickOutsideListener!);
  }

  public logOut(): void {
    this.userInfo.setUserInfo({} as Client);
    this.authService.logout();
    localStorage.removeItem('isClient');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('isAdmin');
    this.router.navigate(['/home']);
  }

  // Toggles the small desktop profile dropdown
  public toggleProfileMenu(): void {
    this.showingProfileMenu = !this.showingProfileMenu;
    // Ensure fullscreen menu is closed if profile menu is opened
    if (this.showingProfileMenu && this.showingFullscreenMenu) {
      this.closeFullscreenMenu();
    }
  }

  // Closes the small desktop profile dropdown
  public closeProfileMenu(): void {
    this.showingProfileMenu = false;
  }

  // Toggles the fullscreen mobile menu
  public toggleFullscreenMenu(): void {
    this.showingFullscreenMenu = !this.showingFullscreenMenu;
    if (this.showingFullscreenMenu) {
      this.document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
      // Ensure profile menu is closed if fullscreen menu is opened
      if (this.showingProfileMenu) {
        this.closeProfileMenu();
      }
    } else {
      this.document.body.style.overflow = ''; // Restore scrolling
    }
  }

  // Closes the fullscreen mobile menu
  public closeFullscreenMenu(): void {
    this.showingFullscreenMenu = false;
    this.document.body.style.overflow = ''; // Restore scrolling
  }
}
