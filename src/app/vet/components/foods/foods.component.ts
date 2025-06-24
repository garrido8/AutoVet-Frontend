import { Component, inject, OnInit } from '@angular/core';
import { Client } from '../../../interfaces/client.interface';
import { Pet } from '../../../interfaces/pet.interface';
import { AuthService } from '../../../services/auth.service';
import { GeminiService } from '../../../services/gemini.service';
import { PetService } from '../../../services/pet.service';
import { UserInfoService } from '../../../services/user-info.service';
import { marked } from 'marked';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * @class FoodsComponent
 * @description
 * Componente interactivo que permite a los usuarios consultar alimentos peligrosos para sus mascotas.
 * Puede funcionar para usuarios logueados (usando sus mascotas registradas) o para usuarios anónimos
 * (seleccionando un tipo de mascota y raza). Utiliza GeminiService para obtener la información.
 */
@Component({
  selector: 'app-foods',
  standalone: true,
  templateUrl: './foods.component.html',
  styleUrl: './foods.component.css',
  imports: [
    CommonModule,
    FormsModule
  ],
})
export class FoodsComponent implements OnInit {

  // --- Inyección de Dependencias ---
  private userInfoService = inject(UserInfoService);
  private authService = inject(AuthService);
  private petService = inject(PetService);
  private geminiService = inject(GeminiService);

  // --- Propiedades Públicas de Estado ---
  public userPets: Pet[] = [];
  public defaultPets: string[] = ['Perro', 'Gato', 'Loro', 'Tortuga', 'Conejo', 'Hámster', 'Pez'];
  public breeds: string[] = [];
  public isUser: boolean = false;
  public selectedUserPet?: Pet;
  public selectedPet?: string;
  public permanent: boolean = false;
  public formattedResponse: string = '';
  public isLoading: boolean = false;
  public loadingBreeds: boolean = false;
  public selectedBreed: string = '';
  public exit: boolean = false;

  /**
   * @method ngOnInit
   * @description
   * Ciclo de vida de Angular. Comprueba si hay un usuario logueado.
   * Si es así, carga sus mascotas para que pueda seleccionarlas.
   * @returns {void}
   */
  ngOnInit(): void {
    const token = this.userInfoService.getToken();
    if (token) {
      this.authService.getUserPerEmail(token)
        .subscribe(response => {
          if (response.length > 0) {
            const user: Client = response[0];
            this.isUser = true;
            this.petService.getPetByOwner(user.id!)
              .subscribe(response => {
                this.userPets = response;
              });
          }
        });
    }
  }

  /**
   * @method loadBreeds
   * @description
   * Carga las razas para un tipo de mascota seleccionado (ej. 'Perro')
   * llamando al servicio de IA.
   * @param {string} pet - El tipo de mascota.
   * @returns {void}
   */
  public loadBreeds(pet: string): void {
    this.resetProcess();
    this.loadingBreeds = true;
    this.selectedPet = pet;

    this.geminiService.getBreeds(pet)
      .subscribe(response => {
        this.loadingBreeds = false;
        this.treatResponse(response);
      });
  }

  /**
   * @method treatResponse
   * @description
   * Procesa la respuesta de texto plano de la IA (una lista de razas separada por saltos de línea)
   * y la convierte en un array de strings.
   * @param {string} texto - La respuesta en texto plano de la IA.
   * @returns {void}
   */
  public treatResponse(texto: string): void {
    const lineas = texto.trim().split('\n');
    this.breeds = lineas.map(linea => {
      // Limpia los asteriscos y espacios en blanco de cada línea.
      return linea.replace(/^\*\s*|\s+$/g, '');
    });
  }

  /**
   * @method chooseBreed
   * @description
   * Se ejecuta cuando el usuario selecciona una raza del dropdown.
   * Si la raza no es 'Otro', procede a buscar los alimentos peligrosos.
   * @param {any} event - El evento de cambio del select.
   * @returns {void}
   */
  public chooseBreed(event: any): void {
    this.selectedBreed = event.target.value;
    if (this.selectedBreed !== 'Otro') {
      this.getDangerousFoods();
    }
  }

  /**
   * @method getDangerousFoods
   * @description
   * Obtiene la lista de alimentos peligrosos para la mascota y raza seleccionadas.
   * También maneja el caso de una raza personalizada introducida por el usuario.
   * @param {any} [event] - Evento opcional del input para razas personalizadas.
   * @returns {void}
   */
  public getDangerousFoods(event?: any): void {
    this.isLoading = true;

    if (this.selectedBreed === 'Otro' && event?.target?.value) {
      this.selectedBreed = event.target.value;
      this.permanent = true;
    }

    const text = this.selectedPet! + ' ' + this.selectedBreed;

    this.geminiService.getFoods(text)
      .subscribe(response => {
        this.isLoading = false;
        this.formattedResponse = marked(response).toString(); // Formatea la respuesta de Markdown a HTML.
      });
  }

  /**
   * @method getFoodsForUserPet
   * @description
   * Obtiene la lista de alimentos peligrosos para una mascota específica registrada por el usuario.
   * Crea un prompt más detallado con los datos de la mascota.
   * @param {Pet} pet - La mascota registrada del usuario.
   * @returns {void}
   */
  public getFoodsForUserPet(pet: Pet): void { // Nombre de método más descriptivo
    this.resetProcess();
    this.isLoading = true;
    this.selectedBreed = pet.raza;
    this.selectedPet = pet.especie;

    const prompt = 'Mi mascota es un ' + pet.especie +
      ' , de raza ' + pet.raza +
      ' , se llama ' + pet.nombre +
      ' , tiene ' + pet.edad + ' años. ' +
      ' y pesa ' + pet.peso + ' kg. ';

    this.geminiService.getFoods(prompt)
      .subscribe(response => {
        this.isLoading = false;
        this.formattedResponse = marked(response).toString();
      });
  }

  /**
   * @private
   * @method resetProcess
   * @description
   * Resetea el estado del componente a sus valores iniciales, limpiando selecciones
   * y resultados anteriores.
   * @returns {void}
   */
  private resetProcess(): void {
    this.selectedBreed = '';
    this.permanent = false;
    this.formattedResponse = '';
    this.breeds = [];
    this.selectedPet = undefined;
    this.selectedUserPet = undefined;
  }
}
