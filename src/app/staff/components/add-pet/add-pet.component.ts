import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { UserInfoService } from '../../../services/user-info.service';
import { Subscription } from 'rxjs';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Pet } from '../../../interfaces/pet.interface';
import { PetService } from '../../../services/pet.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-add-pet',
  standalone: true,
  templateUrl: './add-pet.component.html',
  styleUrl: './add-pet.component.css',
    imports: [
      CommonModule,
      RouterModule,
      ReactiveFormsModule,
      FormsModule
    ]
})
export class AddPetComponent implements OnDestroy{

  private userInfoService = inject( UserInfoService )
  private petService = inject( PetService )

  private subscriptions = new Subscription()

  private fb = inject( FormBuilder )


  public form = this.fb.group( {
    nombre: ['', Validators.required ],
    especie: ['', Validators.required],
    raza: ['', Validators.required],
    edad: [0, Validators.required],
    sexo: ['', Validators.required],
    peso: [0.0, Validators.required],
    vacunado: [false, Validators.required],
    esterilizado: [false, Validators.required],
  } )

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.userInfoService.removeUserId();
  }

  public testForm(): void {
    // const pet: Pet = {
    //   nombre: this.form.value.nombre!,
    //   especie: this.form.value.especie!,
    //   raza: this.form.value.raza!,
    //   edad: this.form.value.edad!,
    //   sexo: this.form.value.sexo!,
    //   peso: this.form.value.peso!,
    //   vacunado: this.form.value.vacunado!,
    //   esterilizado: this.form.value.esterilizado!,
    //   propietario: this.userInfoService.getUserId()!,
    //   appoinments: []
    // }
    // console.log( pet );
  }

  public addPet(): void {
    if ( this.form.valid ) {
      const pet: Pet = {
        nombre: this.form.value.nombre!,
        especie: this.form.value.especie!,
        raza: this.form.value.raza!,
        edad: this.form.value.edad!,
        sexo: this.form.value.sexo!.toLowerCase(),
        peso: this.form.value.peso!,
        vacunado: this.form.value.vacunado! ? true : false,
        esterilizado: this.form.value.esterilizado! ? true : false,
        propietario: this.userInfoService.getUserId()!
      }

      console.log(pet);

      const addPetSub = this.petService.addPet(pet)
        .subscribe( response => {
          if ( response ) {
            alert('Mascota añadida correctamente')
            this.form.reset();
          }
        } )

      this.subscriptions.add( addPetSub );
    }
  }

}
