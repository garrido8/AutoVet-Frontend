import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map, Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { Client } from '../../../interfaces/client.interface';
import { PetService } from '../../../services/pet.service';
import { Pet } from '../../../interfaces/pet.interface';
import { AppoinmentService } from '../../../services/appoinment.service';
import { Appoinment } from '../../../interfaces/appoinment.interface';
import { UserInfoService } from '../../../services/user-info.service';
import { forkJoin } from 'rxjs'; // Import forkJoin for parallel fetching
import { Staff } from '../../../interfaces/staff.interface'; // Import Staff interface

@Component({
  selector: 'app-clients-info',
  standalone: false,
  templateUrl: './clients-info.component.html',
  styleUrl: './clients-info.component.css'
})
export class ClientsInfoComponent implements OnInit, OnDestroy {

  private route = inject( ActivatedRoute );
  private router = inject( Router );
  private authService = inject( AuthService );
  private petService = inject( PetService )
  private appoinmentService = inject( AppoinmentService );
  private userInfoService = inject( UserInfoService)

  private subscriptions = new Subscription();

  public client: Client | null = null;
  public pets: Pet[] = [];
  public appointmentsVisibility: { [petId: number]: boolean } = {};
  public selectedPetPk: number | null = null;

  public profileUrl: string = ''; // This property isn't directly used in HTML, but client.photo is.
  private backendBaseUrl: string = 'http://127.0.0.1:8000';

  public currentWorker: Staff | null = null; // New property to store the current worker's info
  public isAdmin: boolean = localStorage.getItem('isAdmin') === 'true'; // Check if current user is admin

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    // First, get the current logged-in staff member (worker)
    const userEmail = this.userInfoService.getToken();
    if (userEmail) {
      this.subscriptions.add(
        this.authService.getStaffPerEmail(userEmail).subscribe(
          (staffMembers: Staff[]) => {
            if (staffMembers.length > 0) {
              this.currentWorker = staffMembers[0];
              this.loadClientData(idParam); // Now load client data using worker's PK
            } else {
              console.warn('No staff member found for the current user email.');
              this.currentWorker = null; // Ensure it's null if not found
              this.loadClientData(idParam); // Attempt to load client data anyway, though appointments won't filter
            }
          },
          error => {
            console.error('Error fetching current staff member:', error);
            this.currentWorker = null;
            this.loadClientData(idParam); // Continue to load client data even on error
          }
        )
      );
    } else {
      console.warn('No user email found in token. Cannot identify current worker.');
      this.currentWorker = null; // Ensure null if no email
      this.loadClientData(idParam); // Load client data without worker filter
    }
  }

  // New method to encapsulate client and pet data loading
  private loadClientData(idParam: string | null): void {
    if (idParam) {
      const clientId = Number(idParam);
      const userSub = this.authService.getUserPerId(clientId)
        .subscribe( user => {
          if ( user ) {
            this.client = user;
            // Assuming 'photo' property exists on Client interface for profile pictures
            if (user.photo) {
              this.client.photo = `${this.backendBaseUrl}${user.photo}`;
            } else {
              this.client.photo = ''; // Ensure it's an empty string if no photo
            }

            const petSub = this.petService.getPetByOwner(user.id!)
              .subscribe(pets => {
                if (pets && pets.length > 0) {
                  const petAppointmentObservables = pets.map(pet =>
                    this.appoinmentService.getAppoinmentByPet(pet.pk!).pipe(
                      map(appointments => {
                        // Filter appointments based on worker's PK if not an admin
                        const filteredAppointments = this.isAdmin || !this.currentWorker
                          ? appointments // Admins see all, or if no worker context
                          : appointments.filter(app => app.trabajador_asignado === this.currentWorker!.pk);

                        return { ...pet, appoinments: filteredAppointments || [] };
                      })
                    )
                  );

                  this.subscriptions.add(
                    forkJoin(petAppointmentObservables).subscribe(
                      (petsWithAppointments: Pet[]) => {
                        this.pets = petsWithAppointments;
                        this.pets.forEach(pet => {
                          this.appointmentsVisibility[pet.pk!] = false;
                        });
                      },
                      error => console.error('Error fetching pet appointments:', error)
                    )
                  );
                } else {
                  this.pets = [];
                }
              },
              error => console.error('Error fetching pets for client:', error)
            );
            this.subscriptions.add(petSub);
          } else {
            console.warn('Client not found with ID:', clientId);
            this.router.navigate(['/staff/clients']);
          }
        },
        error => console.error('Error fetching client info:', error)
      );
      this.subscriptions.add(userSub);
    } else {
      console.warn('No client ID provided in route.');
      this.router.navigate(['/staff/clients']);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public getText( age: number ): string {
    return age === 1 ? 'año' : 'años';
  }

  public getAppointmentsByStatus(appointments: Appoinment[], status: string): Appoinment[] {
    return appointments.filter(app => app.estado === status);
  }

  public toggleAppointmentsVisibility(petId: number): void {
    this.appointmentsVisibility[petId] = !this.appointmentsVisibility[petId];
  }

  public goToAddPet(): void {
    if (this.client && this.client.id) {
      this.userInfoService.setUserId(this.client.id);
      this.router.navigate([ '/staff/add-pet' ]);
    } else {
      console.error('Cannot add pet: Client ID is not available.');
    }
  }
}
