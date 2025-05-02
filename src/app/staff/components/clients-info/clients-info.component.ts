import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { Client } from '../../../interfaces/client.interface';
import { PetService } from '../../../services/pet.service';
import { Pet } from '../../../interfaces/pet.interface';
import { AppoinmentService } from '../../../services/appoinment.service';
import { Appoinment } from '../../../interfaces/appoinment.interface';

@Component({
  selector: 'app-clients-info',
  standalone: false,
  templateUrl: './clients-info.component.html',
  styleUrl: './clients-info.component.css'
})
export class ClientsInfoComponent implements OnInit, OnDestroy {

  private route = inject( ActivatedRoute );
  private authService = inject( AuthService );
  private petService = inject( PetService )
  private appoinmentService = inject( AppoinmentService );

  private suscriptions = new Subscription()

  public client: Client | null = null;
  public pets: Pet[] = [];
  public showPendingOnly: boolean = false; // Property to control visibility

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
                  this.pets = pets.map(pet => ({ // Map over pets to add appointments
                    ...pet,
                    appoinments: [] // Initialize appointments array
                  }));
                  this.pets.forEach(pet => {
                    this.appoinmentService.getAppoinmentByPet(pet.pk!)
                      .subscribe( appoinments => {
                        pet.appoinments = appoinments;
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

  public togglePendingVisibility(): void {
    this.showPendingOnly = !this.showPendingOnly;
  }
}
