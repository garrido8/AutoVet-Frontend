import { inject, Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable, of } from 'rxjs'; // Import 'of'
import { UserInfoService } from '../services/user-info.service';

@Injectable({
  providedIn: 'root'
})
export class ClientGuard implements CanActivate {

  private userInfoService = inject(UserInfoService);

  constructor(private router: Router) { }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const token = localStorage.getItem('token');
    if (token) {
      const email = this.userInfoService.getToken();
      if (email?.includes('correo')) {
        return true;
      } else {
        this.router.navigate(['/error']); // Consider a specific unauthorized route
        return false;
      }
    } else {
      this.router.navigate(['/error']); // Consider a specific login route
      return false;
    }
  }
}
