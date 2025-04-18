import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { StyleService } from './services/style.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'vetManagement';

  private authService = inject(AuthService);
  private styleService = inject( StyleService );

  public isLoggedIn: boolean = false

  public headerOff: boolean = false

  ngOnInit(): void {
    this.authService.getIsLoggedIn()
      .subscribe((isLoggedIn: boolean) => {
        this.isLoggedIn = isLoggedIn;
      });

    this.styleService.getHeaderOff()
      .subscribe((headerOff: boolean) => {
        this.headerOff = headerOff;
      }
    )
  }
}
