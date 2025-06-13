import { Component, OnInit, OnDestroy, inject, ElementRef } from '@angular/core';
import { DOCUMENT } from '@angular/common'; // Import DOCUMENT

@Component({
  selector: 'no-login-header',
  standalone: false,
  templateUrl: './no-login-header.component.html',
  styleUrl: './no-login-header.component.css'
})
export class NoLoginHeaderComponent implements OnInit, OnDestroy { // Implement OnInit and OnDestroy
  private document = inject(DOCUMENT); // Inject DOCUMENT
  private elementRef = inject(ElementRef); // Inject ElementRef

  public showingFullscreenMenu: boolean = false; // New state variable

  private clickOutsideListener?: (event: MouseEvent) => void;

  ngOnInit(): void {
    // Listener for clicks outside the fullscreen menu
    this.clickOutsideListener = (event: MouseEvent) => {
      const target = event.target as Node;
      const fullscreenMenuContent = this.elementRef.nativeElement.querySelector('.fullscreen-menu-content');
      const hamburgerToggleButton = this.elementRef.nativeElement.querySelector('.menu-toggle');

      // If the fullscreen menu is open AND the click is outside its content AND outside the hamburger button
      if (this.showingFullscreenMenu && fullscreenMenuContent && !fullscreenMenuContent.contains(target) && hamburgerToggleButton && !hamburgerToggleButton.contains(target)) {
        this.closeFullscreenMenu();
      }
    };
    this.document.addEventListener('mousedown', this.clickOutsideListener);
  }

  ngOnDestroy(): void {
    if (this.clickOutsideListener) {
      this.document.removeEventListener('mousedown', this.clickOutsideListener);
    }
    // Ensure scrolling is restored if component is destroyed while menu is open
    this.document.body.style.overflow = '';
  }

  // Toggles the fullscreen mobile menu
  public toggleFullscreenMenu(): void {
    this.showingFullscreenMenu = !this.showingFullscreenMenu;
    if (this.showingFullscreenMenu) {
      this.document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
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
