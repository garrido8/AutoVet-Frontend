import { inject, Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable, of, tap, catchError, map, switchMap } from 'rxjs';
import { UserInfoService } from '../services/user-info.service';
import { AuthService } from '../services/auth.service';
import { Staff } from '../interfaces/staff.interface';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  private userInfoService = inject(UserInfoService);
  private authSevice = inject(AuthService);

  constructor(private router: Router) { }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const token = localStorage.getItem('token');

    if (token) {
      const email$ = of(this.userInfoService.getToken()); // Wrap the synchronous call in 'of'

      return email$.pipe(
        switchMap(email => {
          if (email?.includes('autovet')) {
            return this.authSevice.getStaffPerEmail(email).pipe(
              map(response => {
                if (response && response.length > 0 && response[0].role === 'admin') {
                  return true;
                } else {
                  return this.router.parseUrl('/error');
                }
              }),
              catchError(error => {
                console.error('Error fetching user data:', error);
                return of(this.router.parseUrl('/error'));
              })
            );
          } else {
            return of(this.router.parseUrl('/error'));
          }
        }),
        catchError(() => {
          return of(this.router.parseUrl('/error')); // Handle errors in the initial email check
        })
      );
    } else {
      return of(this.router.parseUrl('/error'));
    }
  }
}
