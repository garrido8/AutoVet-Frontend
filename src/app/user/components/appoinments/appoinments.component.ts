import { Component, inject, OnInit } from '@angular/core';
import { UserInfoService } from '../../../services/user-info.service';
import { AuthService } from '../../../services/auth.service';
import { PetService } from '../../../services/pet.service';
import { AppoinmentService } from '../../../services/appoinment.service';
import { Appoinment } from '../../../interfaces/appoinment.interface';
import { Client } from '../../../interfaces/client.interface';

@Component({
  selector: 'app-appoinments',
  standalone: false,
  templateUrl: './appoinments.component.html',
  styleUrl: './appoinments.component.css'
})
export class AppoinmentsComponent implements OnInit {

  private userInfoService = inject( UserInfoService )
  private authService = inject( AuthService )
  private petService = inject( PetService )
  private appoinmentService = inject( AppoinmentService )

  public appoinments: Appoinment[] = []

  ngOnInit(): void {
    const token = this.userInfoService.getToken();

    if (token) {
      this.authService.getUserPerEmail(token)
        .subscribe(response => {
          const user: Client = response[0];

          this.petService.getPetByOwner(user.id!)
            .subscribe(pets => {

              pets.forEach(pet => {
                this.appoinmentService.getAppoinmentByPet(pet.pk!)
                  .subscribe(appoinments => {
                    // Añadir el nombre de la mascota a cada cita
                    const enrichedAppoinments = appoinments.map(app => ({
                      ...app,
                      petName: pet.nombre
                    }));

                    // Agregar al array general
                    this.appoinments = [ ...this.appoinments, ...enrichedAppoinments ];
                  });
              });

            });
        });
    }
  }


}
