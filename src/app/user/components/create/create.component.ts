import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { UserInfoService } from '../../../services/user-info.service';
import { AuthService } from '../../../services/auth.service';
import { Client } from '../../../interfaces/client.interface';
import { PetService } from '../../../services/pet.service';
import { Pet } from '../../../interfaces/pet.interface';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../../services/gemini.service';
import { Appoinment } from '../../../interfaces/appoinment.interface';
import { AppoinmentService } from '../../../services/appoinment.service';

@Component({
  selector: 'app-create',
  standalone: true,
  templateUrl: './create.component.html',
  styleUrl: './create.component.css',
  imports: [
    CommonModule,
    FormsModule
  ]
})
export class CreateComponent implements OnInit {

  private userInfoService = inject(UserInfoService);
  private authService = inject( AuthService )
  private petService = inject( PetService )
  private geminiService = inject( GeminiService )
  private appoinmentService = inject( AppoinmentService )

  public pets: Pet[] = [];

  public selectedPet?: Pet

  public isLoading: boolean = false;

  public exit: boolean = false;

  @ViewChild('problemTxt') problemTxt?: ElementRef;

  public problemTxtValue: string = '';

  ngOnInit(): void {
    const token = this.userInfoService.getToken();

    if( token ) {
      this.authService.getUserPerEmail( token )
        .subscribe( response => {
          const user: Client = response[0]

          this.petService.getPetByOwner( user.id! )
            .subscribe( response => {
              this.pets = response
            })
        })
    }
  }

  public createAppoinment() {
    const appoinment: Appoinment = {
      mascota: this.selectedPet!.pk!,
      titulo: '',
      descripcion: '',
      estado: 'pendiente',
      urgencia: false,
    }

    if( this.problemTxtValue.length > 0 && this.selectedPet ) {
      this.isLoading = true;

      const prompt = 'Mi mascota es un ' + this.selectedPet?.especie +
          ' ,de raza ' + this.selectedPet?.raza +
          ' ,se llama ' + this.selectedPet?.nombre +
          ' ,tiene ' + this.selectedPet?.edad + ' años. ' +
          ' y pesa ' + this.selectedPet?.peso + ' kg. ' +
          '. ' + this.problemTxtValue

      this.geminiService.generateName( prompt )
        .subscribe( title => {

          this.geminiService.generateProffesionalSummary( prompt )
            .subscribe( description => {
              this.isLoading = false;
              appoinment.titulo = title
              appoinment.descripcion = description

              this.appoinmentService.addAppoinment( appoinment )
                .subscribe( response => {
                  this.exit = true;
                  this.problemTxtValue = ''
                  this.selectedPet = undefined
                }
                )
            } )
        } )

    }
  }


}
