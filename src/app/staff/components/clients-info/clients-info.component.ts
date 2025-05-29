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

@Component({
  selector: 'app-clients-info',
  standalone: false, // Keep as false if it's part of a larger module
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

  private subscriptions = new Subscription(); // Renamed from suscriptions for consistency

  public client: Client | null = null;
  public pets: Pet[] = [];
  // Use an object to manage visibility for each pet's appointments section
  public appointmentsVisibility: { [petId: number]: boolean } = {};
  public selectedPetPk: number | null = null; // To highlight the selected pet or show its details

  public profileUrl: string = ''
  private backendBaseUrl: string = 'http://127.0.0.1:8000';

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      const clientId = Number(idParam);
      const userSub = this.authService.getUserPerId(clientId)
        .subscribe( user => {
          if ( user ) {
            this.client = user;
            this.client.photo = `${this.backendBaseUrl}${user.photo}`; // Set the profile URL for the client
            // Fetch all pets for this client
            const petSub = this.petService.getPetByOwner(user.id!)
              .subscribe(pets => {
                if (pets && pets.length > 0) {
                  // For each pet, fetch its appointments in parallel
                  const petAppointmentObservables = pets.map(pet =>
                    this.appoinmentService.getAppoinmentByPet(pet.pk!).pipe(
                      map(appointments => ({ ...pet, appoinments: appointments || [] })) // Ensure appoinments is an array
                    )
                  );

                  // Once all pet appointments are fetched, assign to this.pets
                  this.subscriptions.add(
                    forkJoin(petAppointmentObservables).subscribe(
                      (petsWithAppointments: Pet[]) => {
                        this.pets = petsWithAppointments;
                        // Initialize visibility for all pets to false (collapsed)
                        this.pets.forEach(pet => {
                          this.appointmentsVisibility[pet.pk!] = false;
                        });
                        // console.log('Client and Pets with Appointments loaded:', this.client, this.pets);
                      },
                      error => console.error('Error fetching pet appointments:', error)
                    )
                  );
                } else {
                  this.pets = []; // No pets found
                }
              },
              error => console.error('Error fetching pets for client:', error)
            );
            this.subscriptions.add(petSub);
          } else {
            console.warn('Client not found with ID:', clientId);
            this.router.navigate(['/staff/clients']); // Redirect if client not found
          }
        },
        error => console.error('Error fetching client info:', error)
      );
      this.subscriptions.add(userSub);
    } else {
      console.warn('No client ID provided in route.');
      this.router.navigate(['/staff/clients']); // Redirect if no ID
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
    // Optionally, close others when one is opened
    // Object.keys(this.appointmentsVisibility).forEach(key => {
    //   if (Number(key) !== petId) {
    //     this.appointmentsVisibility[Number(key)] = false;
    //   }
    // });
  }

  public goToAddPet(): void {
    if (this.client && this.client.id) {
      this.userInfoService.setUserId(this.client.id);
      this.router.navigate([ '/staff/add-pet' ]);
    } else {
      console.error('Cannot add pet: Client ID is not available.');
      // Optionally, show a user-friendly message
    }
  }
}
