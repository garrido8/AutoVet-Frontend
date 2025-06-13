import { Appoinment } from "./appoinment.interface";

export interface Pet {
  pk?:           number;
  propietario:   number;
  nombre:        string;
  especie:       string;
  raza:          string;
  edad:          number;
  sexo:          string;
  peso:          number;
  vacunado:      boolean;
  esterilizado:  boolean;
  appoinments?:   Appoinment[];
}
