import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Appoinment } from '../../../interfaces/appoinment.interface';
import { AppoinmentService } from '../../../services/appoinment.service';
import { forkJoin, map, of, Subscription, switchMap } from 'rxjs';
import { Staff } from '../../../interfaces/staff.interface';
import { UserInfoService } from '../../../services/user-info.service';
import { AuthService } from '../../../services/auth.service';
import { PetService } from '../../../services/pet.service';
import { Client } from '../../../interfaces/client.interface';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-staff-appointments',
  standalone: true,
  templateUrl: './staff-appointments.component.html',
  styleUrl: './staff-appointments.component.css',
  imports: [
    CommonModule,
    RouterModule,
  ],
})
export class StaffAppointmentsComponent implements OnInit, OnDestroy {


  public allAppoinments: Appoinment[] = [];
  public workerAppoinments: Appoinment[] = [];

  private subscriptions = new Subscription();

  public user?: Staff | null = null;
  private owner?: Client | null = null;

  private appoinmentService = inject(AppoinmentService);
  private userInfoService = inject( UserInfoService)
  private authService = inject( AuthService )
  private petService = inject( PetService )

  public isAdmin: boolean = localStorage.getItem('isAdmin') === 'true' ? true : false;

  private userEmail: string | null = null;

  ngOnInit(): void {

    if ( this.isAdmin ) {
      const allSub = this.appoinmentService.getAppoinments().pipe(
        // Use map to transform the response
        map((appointments: Appoinment[]) => {
          if (appointments.length === 0) {
            return of([]); // Return an observable of empty array if no appointments
          }
          // Use forkJoin to handle multiple observables (getStaffPerId for each appointment)
          const observables = appointments.map(appointment => {
            if (appointment.trabajador_asignado) {
              return this.authService.getStaffPerId(appointment.trabajador_asignado).pipe(
                // Map again to combine appointment data with worker name
                map(worker => ({
                  ...appointment,
                  workerName: worker ? worker.name : 'Unknown Worker' // Handle null worker
                }))
              );
            } else {
              return of({ ...appointment, workerName: 'Sin Asignar' }); // Or some default value
            }
          });
          return forkJoin(observables); // forkJoin returns a single observable
        }),
        // switchMap to switch to the observable returned by map
        switchMap(obs => obs)
      ).subscribe(response => {
        this.allAppoinments = response;
      });

      this.subscriptions.add(allSub);
    }

    this.userEmail = this.userInfoService.getToken();
    // console.log('User Email in Component:', this.userEmail);
      if ( this.userEmail ) {
        const staffSub = this.authService.getStaffPerEmail(this.userEmail!)
        .subscribe( response => {
          if (response.length > 0) {
            this.user = response[0];
            // console.log('Staff Data Received:', this.user);
            const appoinmentSub = this.appoinmentService.getAppoinmentsByWorkerId(this.user.pk!)
              .subscribe( response => {
                if (response.length > 0) {
                  this.workerAppoinments = response;
                } else {
                  // console.log('No appoinments found for this staff member.');
                }
              });
            this.subscriptions.add(appoinmentSub);
          } else {
            // console.log('No staff member found with this email.');
          }
        });
      this.subscriptions.add(staffSub);
    }


    const getAppoinments = this.appoinmentService.getNonAssignedAppoinments()
      .subscribe(
        response => {
          if (response.length > 0) {
            this.allAppoinments = response;
          }
        }
      )

      this.subscriptions.add(getAppoinments);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public getDisplayStatus(estado: string): string {
    switch (estado) {
      case 'pendiente':
        return 'Pendiente';
      case 'en_proceso':
        return 'En proceso';
      case 'resuelta':
        return 'Resuelta';
      default:
        return 'Desconocido';
    }
  }

  public assignAppoinment(appoinment: Appoinment): void {
    const updatedAppointment: Appoinment = { ...appoinment, trabajador_asignado: this.user!.pk };

    this.appoinmentService.editAppoinment(appoinment.pk!, updatedAppointment)
      .pipe(
        switchMap(() => this.appoinmentService.getNonAssignedAppoinments()),
        switchMap(nonAssignedResponse => {
          this.allAppoinments = nonAssignedResponse;
          return this.user ? this.appoinmentService.getAppoinmentsByWorkerId(this.user.pk!) : [];
        })
      )
      .subscribe(workerAppointmentsResponse => {
        this.workerAppoinments = workerAppointmentsResponse || [];
        this.petService.getPetById(appoinment.mascota)
          .subscribe(petResponse => {
            if (petResponse) {
              this.authService.getUserPerId(petResponse.propietario)
                .subscribe(ownerResponse => {
                  if (ownerResponse) {
                    this.owner = ownerResponse;

                    this.user?.assigned_clients.push(this.owner.id!);

                    this.authService.editStaffMember(this.user!.pk!, this.user!)
                      .subscribe(() => {
                        // console.log('Staff member updated successfully');
                      }, error => {
                        // console.error('Error updating staff member:', error);
                      });
                  }
                });

            } else {
              // console.log('No pet found with this ID.');
            }
          }
        );
      });
  }

}
