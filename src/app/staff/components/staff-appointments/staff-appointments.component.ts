import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Appoinment } from '../../../interfaces/appoinment.interface';
import { AppoinmentService } from '../../../services/appoinment.service';
import { forkJoin, map, of, Subscription, switchMap, tap, catchError } from 'rxjs'; // Added catchError
import { Staff } from '../../../interfaces/staff.interface';
import { UserInfoService } from '../../../services/user-info.service';
import { AuthService } from '../../../services/auth.service';
import { PetService } from '../../../services/pet.service';
import { Client } from '../../../interfaces/client.interface';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ShareAppointmentService } from '../../../services/share-appointment.service';

@Component({
  selector: 'app-staff-appointments',
  standalone: true,
  templateUrl: './staff-appointments.component.html',
  styleUrl: './staff-appointments.component.css',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
  ],
})
export class StaffAppointmentsComponent implements OnInit, OnDestroy {


  public allAppoinments: Appoinment[] = [];
  public workerAppoinments: Appoinment[] = [];
  public allStaffMembers: Staff[] = [];

  private subscriptions = new Subscription();

  public user?: Staff | null = null;

  private appoinmentService = inject(AppoinmentService);
  private userInfoService = inject( UserInfoService)
  private authService = inject( AuthService )
  private petService = inject( PetService )
  private shareAppointmentService = inject( ShareAppointmentService )

  public colaboratorAppointments: Appoinment[] = [];

  public isAdmin: boolean = localStorage.getItem('isAdmin') === 'true' ? true : false;

  private userEmail: string | null = null;

  ngOnInit(): void {

    const staff = this.userInfoService.getFullStaffToken()

    if (this.isAdmin) {
      this.subscriptions.add(
        this.authService.getStaffMembers().subscribe(
          response => {
            this.allStaffMembers = response;
            // console.log('All Staff Members fetched:', this.allStaffMembers);
          },
          error => {
            console.error('Error fetching staff members:', error);
          }
        )
      );
    }


    if ( this.isAdmin ) {
      const allSub = this.appoinmentService.getAppoinments().pipe(
        map((appointments: Appoinment[]) => {
          if (appointments.length === 0) {
            return of([]);
          }
          const observables = appointments.map(appointment => {
            if (appointment.trabajador_asignado) {
              return this.authService.getStaffPerId(appointment.trabajador_asignado).pipe(
                map(worker => ({
                  ...appointment,
                  workerName: worker ? worker.name : 'Sin Asignar'
                }))
              );
            } else {
              return of({ ...appointment, workerName: 'Sin Asignar' });
            }
          });
          return forkJoin(observables);
        }),
        switchMap(obs => obs)
      ).subscribe(response => {
        this.allAppoinments = response;
        // console.log('Admin: All appointments fetched and workers resolved:', this.allAppoinments);
      });

      this.subscriptions.add(allSub);
    }


    this.userEmail = this.userInfoService.getToken();
      if ( this.userEmail ) {
        const staffSub = this.authService.getStaffPerEmail(this.userEmail!)
        .subscribe( response => {
          if (response.length > 0) {
            this.user = response[0];
            // console.log('Non-Admin: Staff user loaded:', this.user);
            const appoinmentSub = this.appoinmentService.getAppoinmentsByWorkerId(this.user.pk!)
              .subscribe( response => {
                if (response.length > 0) {
                  this.workerAppoinments = response;
                  // console.log('Non-Admin: Worker appointments fetched:', this.workerAppoinments);
                } else {
                  // console.log('Non-admin: No appointments found for this staff member.');
                  this.workerAppoinments = []; // Ensure it's empty
                }
              });
            this.subscriptions.add(appoinmentSub);
          } else {
            // console.log('Non-admin: No staff member found with this email.');
            this.user = null; // Ensure user is null if not found
          }
        });
      this.subscriptions.add(staffSub);
    }

    if ( !this.isAdmin ) {
      // This block ensures non-admins still see the unassigned appointments if that's the intent
      const getAppoinments = this.appoinmentService.getNonAssignedAppoinments()
        .subscribe(
          response => {
            if (response.length > 0) {
              this.allAppoinments = response;
              // console.log('Non-Admin: Non-assigned appointments fetched:', this.allAppoinments);
            } else {
              this.allAppoinments = [];
            }
          },
          error => {
            console.error('Error fetching non-assigned appointments (non-admin):', error);
          }
        )
        this.subscriptions.add(getAppoinments);
    }

    if( staff ) {
      this.shareAppointmentService.getSharedAppointmentsByCollaborator( staff.pk! ).subscribe( response => {
        if( response.length > 0 ) {
          const ids = response.map( share => share.appointment );
          // console.log('Colaborator appointments fetched:', this.colaboratorAppointments);
          ids.forEach( id => {
            this.appoinmentService.getAppoinmentById( id ).subscribe( appoinment => {
              if ( appoinment ) {
                this.colaboratorAppointments.push( appoinment );
              } else {
                console.warn('Appointment not found for shared ID:', id);
              }
            }, error => {
              console.error('Error fetching appointment by ID:', id, error);
            });
          })
        }
      })

    }
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
      case 'esperando':
        return 'Esperando cliente';
      default:
        return 'Desconocido';
    }
  }

  public assignAppoinment(appoinment: Appoinment): void {
    // Add null check for this.user here as well, similar to reassignAppoinment
    if (!this.user || !this.user.pk) {
      console.error('Cannot assign: Current staff user PK is not available.');
      // Optionally show a user-friendly message
      return;
    }

    const updatedAppointment: Appoinment = { ...appoinment, trabajador_asignado: this.user!.pk };
    console.log('Assigning appointment:', appoinment.pk, 'to user PK:', this.user!.pk);

    this.appoinmentService.editAppoinment(appoinment.pk!, updatedAppointment)
      .pipe(
        // After editing the appointment, we need to handle owner assignment/removal
        switchMap(() => this.petService.getPetById(appoinment.mascota)),
        switchMap(petResponse => {
          if (!petResponse) {
            console.warn('Pet not found for assigned appointment:', appoinment.pk);
            return of(null);
          }
          return this.authService.getUserPerId(petResponse.propietario);
        }),
        switchMap(ownerResponse => {
          if (!ownerResponse) {
            console.warn('Owner not found for pet of assigned appointment:', appoinment.pk);
            return of(null);
          }

          const ownerId = ownerResponse.id!;
          // Update current staff user's assigned_clients
          return this.authService.getStaffPerId(this.user!.pk!).pipe( // Re-fetch current user to ensure latest assigned_clients
            switchMap(currentUserStaff => {
              if (currentUserStaff) {
                if (!currentUserStaff.assigned_clients) {
                  currentUserStaff.assigned_clients = [];
                }
                if (!currentUserStaff.assigned_clients.includes(ownerId)) {
                  currentUserStaff.assigned_clients.push(ownerId);
                  console.log('Added owner', ownerId, 'to current staff assigned_clients:', currentUserStaff.assigned_clients);
                  return this.authService.editStaffMember(currentUserStaff.pk!, currentUserStaff);
                }
                console.log('Owner', ownerId, 'already in current staff assigned_clients.');
                return of(null); // No update needed
              }
              console.warn('Current user staff data not found for assigned client update.');
              return of(null);
            })
          );
        }),
        // After all updates, refresh the UI lists
        switchMap(() => this.appoinmentService.getNonAssignedAppoinments()), // Refresh non-assigned list
        switchMap(nonAssignedResponse => {
          this.allAppoinments = nonAssignedResponse;
          console.log('UI: allAppoinments updated after assign:', this.allAppoinments);
          // Only fetch worker-specific appointments if this.user exists and has a PK
          return this.user && this.user.pk ? this.appoinmentService.getAppoinmentsByWorkerId(this.user.pk!) : of([]);
        })
      )
      .subscribe(
        workerAppointmentsResponse => {
          this.workerAppoinments = workerAppointmentsResponse || [];
          console.log('UI: workerAppoinments updated after assign:', this.workerAppoinments);
        },
        error => {
          console.error('Error during assignAppoinment process:', error);
          // Potentially show a user-friendly error message
        }
      );
  }

  public reassignAppoinment(appoinment: Appoinment, newWorkerPk: number | null): void {
    console.log(`Reassigning appointment ${appoinment.pk} from ${appoinment.trabajador_asignado} to ${newWorkerPk}`);

    // Prevent reassigning to the same worker or if no worker is selected (and it was already unassigned)
    if (appoinment.trabajador_asignado === newWorkerPk) {
      console.log('No change in assigned worker. Skipping reassign.');
      return;
    }

    const oldWorkerPk = appoinment.trabajador_asignado; // Capture the old worker PK
    const updatedAppointment: Appoinment = {
      ...appoinment,
      trabajador_asignado: newWorkerPk // newWorkerPk can be null here for "Sin Asignar"
    };

    // 1. Update the appointment itself
    this.appoinmentService.editAppoinment(appoinment.pk!, updatedAppointment)
      .pipe(
        tap(() => console.log('Appointment updated successfully in backend.')),
        // 2. Get the owner of the pet related to this appointment
        switchMap(() => this.petService.getPetById(appoinment.mascota)),
        switchMap(petResponse => {
          if (!petResponse) {
            console.warn('Pet not found for appointment during reassign:', appoinment.pk);
            return of(null); // Return null to continue the chain
          }
          return this.authService.getUserPerId(petResponse.propietario);
        }),
        switchMap(ownerResponse => {
          if (!ownerResponse) {
            console.warn('Owner not found for pet of appointment during reassign:', appoinment.pk);
            return of(null); // Return null to continue the chain
          }

          const ownerId = ownerResponse.id!;
          const staffUpdateObservables: Array<Promise<any>> = []; // Array to hold promises/observables of staff updates

          // 3. Handle the OLD staff member (if one existed)
          if (oldWorkerPk) {
            const oldWorkerUpdate$ = this.authService.getStaffPerId(oldWorkerPk).pipe(
              switchMap(oldWorker => {
                if (oldWorker) {
                  console.log(`Processing old worker ${oldWorker.name} (PK: ${oldWorker.pk}) for owner ${ownerId}.`);
                  // Check if this owner has ANY other appointments with this old worker
                  return this.appoinmentService.getAppoinmentsByWorkerId(oldWorker.pk!).pipe(
                    switchMap(oldWorkerAppointments => {
                      // Filter out the *just reassigned* appointment from the old worker's list
                      // and any other appointments not related to this specific owner.
                      const appointmentsStillWithClient = oldWorkerAppointments.filter(
                        appt => appt.pk !== appoinment.pk // Exclude the appointment being reassigned
                      ).map(appt => this.petService.getPetById(appt.mascota)); // Map to get pet for owner check

                      if (appointmentsStillWithClient.length > 0) {
                          return forkJoin(appointmentsStillWithClient).pipe(
                              map(pets => {
                                  const stillHasRelatedAppointment = pets.some(p => p && p.propietario === ownerId);
                                  if (!stillHasRelatedAppointment && oldWorker.assigned_clients && oldWorker.assigned_clients.includes(ownerId)) {
                                      oldWorker.assigned_clients = oldWorker.assigned_clients.filter(id => id !== ownerId);
                                      console.log(`Removed owner ${ownerId} from old worker ${oldWorker.name} assigned_clients.`);
                                      return this.authService.editStaffMember(oldWorker.pk!, oldWorker);
                                  }
                                  console.log(`Old worker ${oldWorker.name} still has related appointments for owner ${ownerId} or owner not in list.`);
                                  return of(null); // No update needed for old worker's assigned_clients
                              }),
                              catchError(err => {
                                console.error('Error checking remaining appointments for old worker:', err);
                                return of(null); // Continue chain even on error
                              })
                          );
                      } else {
                          // No other appointments for this old worker, so remove the client if present
                          if (oldWorker.assigned_clients && oldWorker.assigned_clients.includes(ownerId)) {
                              oldWorker.assigned_clients = oldWorker.assigned_clients.filter(id => id !== ownerId);
                              console.log(`Removed owner ${ownerId} from old worker ${oldWorker.name} as no other appointments exist.`);
                              return this.authService.editStaffMember(oldWorker.pk!, oldWorker);
                          }
                          console.log(`Old worker ${oldWorker.name} has no other appointments, but owner ${ownerId} not in assigned_clients.`);
                          return of(null); // No update needed
                      }
                    }),
                    catchError(err => {
                      console.error('Error fetching old worker appointments or processing pets:', err);
                      return of(null); // Continue chain even on error
                    })
                  );
                }
                console.warn(`Old worker (PK: ${oldWorkerPk}) not found for update.`);
                return of(null); // Old worker not found
              }),
              catchError(err => {
                console.error('Error fetching old worker for update:', err);
                return of(null); // Continue chain even on error
              })
            );
            staffUpdateObservables.push(oldWorkerUpdate$.toPromise()); // Convert to promise
          } else {
              console.log('No old worker was assigned. Skipping old worker update.');
          }


          // 4. Handle the NEW staff member (if one is assigned)
          if (newWorkerPk) {
            const newWorkerUpdate$ = this.authService.getStaffPerId(newWorkerPk).pipe(
              switchMap(newWorker => {
                if (newWorker) {
                  console.log(`Processing new worker ${newWorker.name} (PK: ${newWorker.pk}) for owner ${ownerId}.`);
                  if (!newWorker.assigned_clients) {
                    newWorker.assigned_clients = [];
                  }
                  if (!newWorker.assigned_clients.includes(ownerId)) {
                    newWorker.assigned_clients.push(ownerId);
                    console.log(`Added owner ${ownerId} to new worker ${newWorker.name} assigned_clients.`);
                    return this.authService.editStaffMember(newWorker.pk!, newWorker);
                  }
                  console.log(`New worker ${newWorker.name} already has owner ${ownerId} in assigned_clients.`);
                } else {
                  console.warn(`New worker (PK: ${newWorkerPk}) not found for update.`);
                }
                return of(null); // New worker not found or no update needed
              }),
              catchError(err => {
                console.error('Error fetching new worker for update:', err);
                return of(null); // Continue chain even on error
              })
            );
            staffUpdateObservables.push(newWorkerUpdate$.toPromise()); // Convert to promise
          } else {
              console.log('Appointment unassigned. Skipping new worker update.');
          }

          // 5. Wait for all staff updates to complete
          if (staffUpdateObservables.length > 0) {
            return forkJoin(staffUpdateObservables.filter(Boolean)).pipe( // Filter out nulls
              tap(() => console.log('All staff updates (old/new) completed.')),
              map(() => ownerResponse) // Pass ownerResponse to the next switchMap
            );
          } else {
            console.log('No staff updates were necessary or possible.');
            return of(ownerResponse); // Continue without staff updates
          }
        }),
        // 6. Refresh the main appointments list for the UI
        switchMap(() => this.appoinmentService.getAppoinments()),
        switchMap((appointments: Appoinment[]) => {
          if (appointments.length === 0) {
            return of([]);
          }
          const observables = appointments.map(appt => {
            if (appt.trabajador_asignado) {
              return this.authService.getStaffPerId(appt.trabajador_asignado).pipe(
                map(worker => ({
                  ...appt,
                  workerName: worker ? worker.name : 'Sin Asignar'
                })),
                catchError(err => {
                  console.error(`Error fetching worker for appointment ${appt.pk}:`, err);
                  return of({ ...appt, workerName: 'Error Worker' }); // Return appt with error status
                })
              );
            } else {
              return of({ ...appt, workerName: 'Sin Asignar' });
            }
          });
          return forkJoin(observables);
        })
      )
      .subscribe(
        updatedAllAppoinments => {
          this.allAppoinments = updatedAllAppoinments!;
          console.log('UI: All appointments list refreshed:', this.allAppoinments);
        },
        error => {
          console.error('Final subscription error in reassignAppoinment:', error);
          // Implement user-facing error notification here
        }
      );
  }
}
