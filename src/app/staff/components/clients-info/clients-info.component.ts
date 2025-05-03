import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { Client } from '../../../interfaces/client.interface';
import { PetService } from '../../../services/pet.service';
import { Pet } from '../../../interfaces/pet.interface';
import { AppoinmentService } from '../../../services/appoinment.service';
import { Appoinment } from '../../../interfaces/appoinment.interface';
import { UserInfoService } from '../../../services/user-info.service';

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

  private suscriptions = new Subscription()

  public client: Client | null = null;
  public pets: Pet[] = [];
  public pendingVisibility: { [petId: number]: boolean } = {}; // Object to track visibility per pet

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      const userSub = this.authService.getUserPerId(Number(idParam))
        .subscribe( user => {
          if ( user ) {
            this.client = user;
            const petSub = this.petService.getPetByOwner( user.id! )
              .subscribe( pets => {
                if ( pets ) {
                  this.pets = pets.map(pet => ({
                    ...pet,
                    appoinments: []
                  }));
                  this.pets.forEach(pet => {
                    this.appoinmentService.getAppoinmentByPet(pet.pk!)
                      .subscribe( appoinments => {
                        pet.appoinments = appoinments;
                        this.pendingVisibility[pet.pk!] = false; // Initialize visibility for each pet
                      });
                  });
                }
              } )
            this.suscriptions.add( petSub );
          }
        })

      this.suscriptions.add( userSub );
    }
  }
  ngOnDestroy(): void {
    this.suscriptions.unsubscribe();
  }

  public getText( age: number ): string {
    return age === 1 ? 'año' : 'años';
  }

  public countPendingAppointments(appointments: Appoinment[]): number {
    return appointments.filter(app => app.estado === 'pendiente').length;
  }

  public getPendingAppointments(appointments: Appoinment[]): Appoinment[] {
    return appointments.filter(app => app.estado === 'pendiente');
  }

  public togglePendingVisibility(petId: number): void {
    this.pendingVisibility[petId] = !this.pendingVisibility[petId];
  }

  public goToAddPet(): void {
    this.userInfoService.setUserId( this.client!.id! );
    this.router.navigate([ '/staff/add-pet' ]);
  }
}
