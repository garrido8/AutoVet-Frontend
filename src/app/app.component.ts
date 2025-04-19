import { AfterViewInit, Component, inject, OnInit, Output } from '@angular/core';
import { AuthService } from './services/auth.service';
import { StyleService } from './services/style.service';
import { UserInfoService } from './services/user-info.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, AfterViewInit {

  title = 'vetManagement';

  private authService = inject(AuthService);
  private styleService = inject( StyleService );
  private userInfoService = inject( UserInfoService );

  public isLoggedIn: boolean = false

  // ngOnInit(): void {
  //   this.isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  // }

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

  ngAfterViewInit(): void {
    this.isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  }

}
