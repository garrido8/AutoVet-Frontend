import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { PetService } from '../../../services/pet.service';
import { Client } from '../../../interfaces/client.interface';
import { UserInfoService } from '../../../services/user-info.service';
import { Pet } from '../../../interfaces/pet.interface';
import { AppoinmentService } from '../../../services/appoinment.service';

@Component({
  selector: 'app-pets',
  standalone: false,
  templateUrl: './pets.component.html',
  styleUrl: './pets.component.css'
})
export class PetsComponent implements OnInit {

  private authService = inject(AuthService);
  private userInfoService = inject(UserInfoService)
  private petService = inject(PetService);
  private appoinmentService = inject(AppoinmentService);

  public pets: Pet[] = [];

  ngOnInit(): void {
    const email = this.userInfoService.getToken();

    if (email) {
      this.authService.getUserPerEmail(email)
        .subscribe(response => {
          const user: Client = response[0];

          this.petService.getPetByOwner(user.id!)
            .subscribe(pets => {
              this.pets = pets;

              // Cargar appoinments después de tener las mascotas
              this.pets.forEach(pet => {
                this.appoinmentService.getAppoinmentByPet(pet.pk!)
                  .subscribe(appoinments => {
                    pet.appoinments = appoinments;
                  });
              });
            });
        });
    }
  }


}
