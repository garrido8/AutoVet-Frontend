import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'vetManagement';

  private authService = inject(AuthService);

  public isLoggedIn: boolean = false

  ngOnInit(): void {
    this.authService.getIsLoggedIn()
      .subscribe((isLoggedIn: boolean) => {
        this.isLoggedIn = isLoggedIn;
      });
  }
}
