import { Appoinment } from "./appoinment.interface";

export interface Pet {
  pk?:           number;
  propietario:   number;
  nombre:        string;
  especie:       string;
  raza:          string;
  edad:          number;
  sexo:          string;
  peso:          string;
  vacunado:      boolean;
  esterilizado:  boolean;
  appoinments:   Appoinment[];
}
