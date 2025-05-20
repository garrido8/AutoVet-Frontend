import { Component, inject } from '@angular/core';
import { Client } from '../../../interfaces/client.interface';
import { Pet } from '../../../interfaces/pet.interface';
import { AuthService } from '../../../services/auth.service';
import { GeminiService } from '../../../services/gemini.service';
import { PetService } from '../../../services/pet.service';
import { UserInfoService } from '../../../services/user-info.service';
import { marked } from 'marked';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-foods',
  standalone: true,
  templateUrl: './foods.component.html',
  styleUrl: './foods.component.css',
  imports: [
    CommonModule
  ],
})
export class FoodsComponent {

  private userInfoService = inject(UserInfoService);
  private authService = inject( AuthService )
  private petService = inject( PetService )
  private geminiService = inject( GeminiService )

  public userPets: Pet[] = [];

  public defaultPets: string[] = [
    'Perro',
    'Gato',
    'Loro',
    'Tortuga',
    'Conejo',
    'Hámster',
    'Pez',]

  public breeds: string[] = [];

  public isUser: boolean = false;

  public selectedUserPet?: Pet

  public selectedPet?: string

  public permanent: boolean = false;

  public formattedResponse: string = '';

  public isLoading: boolean = false;
  public loadingBreeds: boolean = false;

  public selectedBreed: string = '';

  public exit: boolean = false;
  ngOnInit(): void {
    const token = this.userInfoService.getToken();

    if( token ) {
      this.authService.getUserPerEmail( token )
        .subscribe( response => {
          const user: Client = response[0]
          this.isUser = true

          this.petService.getPetByOwner( user.id! )
            .subscribe( response => {
              this.userPets = response
            })
        })
    }
  }

  public loadBreeds( pet: string ) {
    this.resetProcess()

    this.loadingBreeds = true
    this.selectedPet = pet


    this.geminiService.getBreeds( pet )
      .subscribe( response => {
        this.loadingBreeds = false
        this.treatResponse( response )
      })
  }

  public treatResponse( texto: string ): void {
    const lineas = texto.trim().split('\n');
    this.breeds = lineas.map(linea => {
      return linea.replace(/^\*\s+|\s+$/g, '');
    });
  }

  public chooseBreed(event: any): void {
    this.selectedBreed = event.target.value;

    if( this.selectedBreed !== 'Otro' ) {
      this.getDangerousFoods()
    }
  }

  public getDangerousFoods( event?: any ): void {
    this.isLoading = true;

    if( this.selectedBreed === 'Otro' && event?.target?.value ) {
      this.selectedBreed = event.target.value;
      this.permanent = true
    }

    const text = this.selectedPet! + ' ' + this.selectedBreed;

    this.geminiService.getFoods( text )
      .subscribe( response => {
        this.isLoading = false
        this.formattedResponse = marked( response ).toString();
      })
  }

  metodoPrueba( pet: Pet) {
    this.isLoading = true;
    this.selectedBreed = pet.raza
    this.selectedPet = pet.especie

    const prompt = 'Mi mascota es un ' + pet.especie +
          ' ,de raza ' + pet.raza +
          ' ,se llama ' + pet.nombre +
          ' ,tiene ' + pet.edad + ' años. ' +
          ' y pesa ' + pet.peso + ' kg. '

    this.geminiService.getFoods( prompt )
    .subscribe( response => {
      this.isLoading = false
      this.formattedResponse = marked( response ).toString();
    })
  }

  private resetProcess(): void {
    this.selectedBreed = ''
    this.permanent = false
    this.formattedResponse = ''
  }
}
